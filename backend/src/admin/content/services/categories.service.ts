import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ProductCategory } from '../schemas/product-category.schema';
import {
  CreateCategoryDto,
  UpdateCategoryDto,
  GetCategoriesQueryDto,
  ReorderCategoryDto,
  SuggestCategoryDto,
  ToggleMainstreamDto,
  ApproveCategoryDto,
} from '../dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectModel(ProductCategory.name)
    private readonly categoryModel: Model<ProductCategory>,
  ) {}

  /**
   * Generate slug from name
   */
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  /**
   * Get categories flat list with optional filters
   */
  async getCategories(query: GetCategoriesQueryDto) {
    const filter: any = {};

    if (!query.includeDeleted) {
      filter.isDeleted = { $ne: true };
    }

    if (query.isActive !== undefined) {
      filter.isActive = query.isActive;
    }

    if (query.rootOnly) {
      filter.parent = null;
    } else if (query.parent) {
      filter.parent = new Types.ObjectId(query.parent);
    }

    if (query.search) {
      filter.$or = [
        { name: { $regex: query.search, $options: 'i' } },
        { slug: { $regex: query.search, $options: 'i' } },
        { aliases: { $regex: query.search, $options: 'i' } },
      ];
    }

    // Mainstream/Niche classification filters
    if (query.isMainstream !== undefined) {
      filter.isMainstream = query.isMainstream;
    }

    if (query.leafOnly) {
      filter.isMainstream = { $ne: null }; // Only leaf categories with classification
    }

    if (query.pendingOnly) {
      filter.createdByUser = { $exists: true, $ne: null };
      filter.isActive = false; // Pending submissions are inactive
    }

    const categories = await this.categoryModel
      .find(filter)
      .populate('parent', 'name slug')
      .sort({ level: 1, order: 1, name: 1 })
      .lean();

    return {
      categories,
      total: categories.length,
    };
  }

  /**
   * Get category tree structure
   */
  async getCategoryTree() {
    // Get all non-deleted categories
    const allCategories = await this.categoryModel
      .find({ isDeleted: { $ne: true } })
      .sort({ order: 1, name: 1 })
      .lean();

    // Build tree
    const categoryMap = new Map<string, any>();
    const tree: any[] = [];

    // First pass: create map
    allCategories.forEach((cat) => {
      categoryMap.set(cat._id.toString(), {
        ...cat,
        children: [],
      });
    });

    // Second pass: build tree
    allCategories.forEach((cat) => {
      const node = categoryMap.get(cat._id.toString());
      if (cat.parent) {
        const parentNode = categoryMap.get(cat.parent.toString());
        if (parentNode) {
          parentNode.children.push(node);
        }
      } else {
        tree.push(node);
      }
    });

    return {
      tree,
      total: allCategories.length,
    };
  }

  /**
   * Get category by ID
   */
  async getCategoryById(id: string) {
    const category = await this.categoryModel
      .findById(id)
      .populate('parent', 'name slug')
      .lean();
    if (!category || category.isDeleted) {
      throw new NotFoundException('Category not found');
    }
    return category;
  }

  /**
   * Get children of a category
   */
  async getChildren(parentId: string) {
    const children = await this.categoryModel
      .find({ parent: new Types.ObjectId(parentId), isDeleted: { $ne: true } })
      .sort({ order: 1, name: 1 })
      .lean();
    return children;
  }

  /**
   * Create a new category
   */
  async createCategory(dto: CreateCategoryDto) {
    // Generate slug if not provided
    const slug = dto.slug || this.generateSlug(dto.name);

    // Check if slug already exists
    const existing = await this.categoryModel.findOne({
      slug,
      isDeleted: { $ne: true },
    });
    if (existing) {
      throw new ConflictException(`Category with slug '${slug}' already exists`);
    }

    // Determine level
    let level = 0;
    if (dto.parent) {
      const parent = await this.categoryModel.findById(dto.parent);
      if (!parent || parent.isDeleted) {
        throw new BadRequestException('Parent category not found');
      }
      if (parent.level >= 2) {
        throw new BadRequestException('Maximum category depth is 3 levels');
      }
      level = parent.level + 1;
    }

    // Get max order for this level/parent
    const maxOrderDoc = await this.categoryModel
      .findOne({
        parent: dto.parent ? new Types.ObjectId(dto.parent) : null,
        isDeleted: { $ne: true },
      })
      .sort({ order: -1 })
      .lean();
    const order = (maxOrderDoc?.order || 0) + 1;

    const category = new this.categoryModel({
      name: dto.name,
      slug,
      description: dto.description,
      parent: dto.parent ? new Types.ObjectId(dto.parent) : null,
      level,
      order,
      isActive: dto.isActive !== false,
      // Mainstream/Niche classification fields
      isMainstream: dto.isMainstream,
      aliases: dto.aliases || [],
      hsCodePrefix: dto.hsCodePrefix,
    });

    await category.save();
    return this.getCategoryById(category._id.toString());
  }

  /**
   * Update an existing category
   */
  async updateCategory(id: string, dto: UpdateCategoryDto) {
    const category = await this.categoryModel.findById(id);
    if (!category || category.isDeleted) {
      throw new NotFoundException('Category not found');
    }

    // If changing slug, check uniqueness
    if (dto.slug && dto.slug !== category.slug) {
      const existing = await this.categoryModel.findOne({
        slug: dto.slug,
        _id: { $ne: id },
        isDeleted: { $ne: true },
      });
      if (existing) {
        throw new ConflictException(`Category with slug '${dto.slug}' already exists`);
      }
    }

    // If changing parent, validate depth
    if (dto.parent !== undefined) {
      if (dto.parent === null) {
        // Moving to root
        category.parent = null;
        category.level = 0;
      } else if (dto.parent !== category.parent?.toString()) {
        // Moving to new parent
        const newParent = await this.categoryModel.findById(dto.parent);
        if (!newParent || newParent.isDeleted) {
          throw new BadRequestException('New parent category not found');
        }

        // Check if trying to move to self or child
        if (dto.parent === id) {
          throw new BadRequestException('Cannot set category as its own parent');
        }

        // Check depth constraint
        const childDepth = await this.getMaxChildDepth(id);
        if (newParent.level + 1 + childDepth > 2) {
          throw new BadRequestException('Moving would exceed maximum depth of 3 levels');
        }

        category.parent = new Types.ObjectId(dto.parent);
        category.level = newParent.level + 1;

        // Update all children's levels recursively
        await this.updateChildrenLevels(id, category.level);
      }
    }

    if (dto.name !== undefined) category.name = dto.name;
    if (dto.slug !== undefined) category.slug = dto.slug;
    if (dto.description !== undefined) category.description = dto.description;
    if (dto.order !== undefined) category.order = dto.order;
    if (dto.isActive !== undefined) category.isActive = dto.isActive;

    // Mainstream/Niche classification fields
    if (dto.isMainstream !== undefined) category.isMainstream = dto.isMainstream;
    if (dto.aliases !== undefined) category.aliases = dto.aliases;
    if (dto.hsCodePrefix !== undefined) category.hsCodePrefix = dto.hsCodePrefix;

    await category.save();
    return this.getCategoryById(id);
  }

  /**
   * Get maximum depth of children
   */
  private async getMaxChildDepth(categoryId: string): Promise<number> {
    const children = await this.categoryModel.find({
      parent: new Types.ObjectId(categoryId),
      isDeleted: { $ne: true },
    });

    if (children.length === 0) return 0;

    let maxDepth = 1;
    for (const child of children) {
      const childDepth = await this.getMaxChildDepth(child._id.toString());
      maxDepth = Math.max(maxDepth, 1 + childDepth);
    }

    return maxDepth;
  }

  /**
   * Update levels of all children recursively
   */
  private async updateChildrenLevels(parentId: string, parentLevel: number) {
    const children = await this.categoryModel.find({
      parent: new Types.ObjectId(parentId),
      isDeleted: { $ne: true },
    });

    for (const child of children) {
      child.level = parentLevel + 1;
      await child.save();
      await this.updateChildrenLevels(child._id.toString(), child.level);
    }
  }

  /**
   * Soft delete a category
   */
  async deleteCategory(id: string) {
    const category = await this.categoryModel.findById(id);
    if (!category || category.isDeleted) {
      throw new NotFoundException('Category not found');
    }

    // Check if has children
    const hasChildren = await this.categoryModel.exists({
      parent: new Types.ObjectId(id),
      isDeleted: { $ne: true },
    });
    if (hasChildren) {
      throw new BadRequestException('Cannot delete category with children. Delete children first.');
    }

    category.isDeleted = true;
    category.deletedAt = new Date();
    await category.save();

    return { deleted: true };
  }

  /**
   * Reorder a category
   */
  async reorderCategory(dto: ReorderCategoryDto) {
    const category = await this.categoryModel.findById(dto.categoryId);
    if (!category || category.isDeleted) {
      throw new NotFoundException('Category not found');
    }

    // Update parent if specified
    if (dto.newParent !== undefined) {
      await this.updateCategory(dto.categoryId, { parent: dto.newParent });
    }

    // Update order
    category.order = dto.newOrder;
    await category.save();

    return this.getCategoryTree();
  }

  // ==========================================================
  // MAINSTREAM/NICHE CLASSIFICATION METHODS
  // ==========================================================

  /**
   * Toggle mainstream/niche classification for a category (admin only)
   * Only applicable to leaf nodes (level 2 categories)
   */
  async toggleMainstreamStatus(id: string, dto: ToggleMainstreamDto) {
    const category = await this.categoryModel.findById(id);
    if (!category || category.isDeleted) {
      throw new NotFoundException('Category not found');
    }

    // Only allow toggling on leaf categories
    const hasChildren = await this.categoryModel.exists({
      parent: new Types.ObjectId(id),
      isDeleted: { $ne: true },
    });

    if (hasChildren) {
      throw new BadRequestException(
        'Cannot set mainstream status on parent categories. Only leaf categories can be classified.'
      );
    }

    category.isMainstream = dto.isMainstream;
    await category.save();
    return this.getCategoryById(id);
  }

  /**
   * Get categories grouped by mainstream/niche classification
   * Used for seller dropdown in product creation
   * @param userId - Optional user ID to include their pending (unapproved) categories
   */
  async getCategoriesGroupedByClassification(userId?: string) {
    // Get all active leaf categories (those with isMainstream set)
    const leafCategories = await this.categoryModel
      .find({
        isDeleted: { $ne: true },
        isActive: true,
        isMainstream: { $ne: null },
      })
      .populate('parent', 'name slug')
      .sort({ name: 1 })
      .lean();

    // Get category path for each leaf
    const withPaths = await Promise.all(
      leafCategories.map(async (cat) => {
        const path = await this.getCategoryPath(cat._id.toString());
        return {
          ...cat,
          path: path.join(' > '),
          isPending: false, // Approved categories are not pending
        };
      })
    );

    // If userId provided, also include their pending (unapproved) categories
    let userPendingCategories: any[] = [];
    if (userId) {
      const pendingCats = await this.categoryModel
        .find({
          isDeleted: { $ne: true },
          isActive: false,
          createdByUser: new Types.ObjectId(userId),
        })
        .populate('parent', 'name slug')
        .sort({ name: 1 })
        .lean();

      userPendingCategories = await Promise.all(
        pendingCats.map(async (cat) => {
          const path = await this.getCategoryPath(cat._id.toString());
          return {
            ...cat,
            path: path.length > 0 ? path.join(' > ') : cat.name, // Use name if no path
            isPending: true, // Mark as pending approval
            isMainstream: false, // Pending categories are always niche until approved
          };
        })
      );
    }

    // Combine approved and pending categories
    const allCategories = [...withPaths, ...userPendingCategories];

    // Group by classification
    const mainstream = allCategories.filter((cat) => cat.isMainstream === true && !cat.isPending);
    const niche = allCategories.filter((cat) => cat.isMainstream === false || cat.isPending);

    return { mainstream, niche };
  }

  /**
   * Get full path for a category (e.g., "Agricultural > Grains > Wheat")
   */
  private async getCategoryPath(categoryId: string): Promise<string[]> {
    const path: string[] = [];
    let current = await this.categoryModel.findById(categoryId).lean();

    while (current) {
      path.unshift(current.name);
      if (current.parent) {
        current = await this.categoryModel.findById(current.parent).lean();
      } else {
        break;
      }
    }

    return path;
  }

  /**
   * Add a user-submitted category (pending admin approval)
   * New categories are set to isActive=false until approved
   */
  async addUserCategory(dto: SuggestCategoryDto, userId: string) {
    // Generate slug
    const slug = this.generateSlug(dto.name);

    // Check if slug already exists
    const existing = await this.categoryModel.findOne({
      slug,
      isDeleted: { $ne: true },
    });
    if (existing) {
      throw new ConflictException(
        `A category with similar name already exists: "${existing.name}"`
      );
    }

    // Determine parent and level
    let level = 0;
    let parentId: Types.ObjectId | null = null;

    if (dto.parentId) {
      const parent = await this.categoryModel.findById(dto.parentId);
      if (!parent || parent.isDeleted) {
        throw new BadRequestException('Parent category not found');
      }
      if (parent.level >= 2) {
        throw new BadRequestException('Maximum category depth is 3 levels');
      }
      level = parent.level + 1;
      parentId = new Types.ObjectId(dto.parentId);
    }

    // Get max order
    const maxOrderDoc = await this.categoryModel
      .findOne({
        parent: parentId,
        isDeleted: { $ne: true },
      })
      .sort({ order: -1 })
      .lean();
    const order = (maxOrderDoc?.order || 0) + 1;

    // Create category with pending status
    const category = new this.categoryModel({
      name: dto.name,
      slug,
      parent: parentId,
      level,
      order,
      isActive: false, // Pending admin approval
      isMainstream: false, // Default to niche
      createdByUser: new Types.ObjectId(userId),
      aliases: [],
    });

    await category.save();
    return this.getCategoryById(category._id.toString());
  }

  /**
   * Approve a user-submitted category with optional edits
   * Admin can change name, parent, classification, aliases, and HS code prefix
   */
  async approveUserCategory(id: string, dto?: ApproveCategoryDto) {
    const category = await this.categoryModel.findById(id);
    if (!category || category.isDeleted) {
      throw new NotFoundException('Category not found');
    }

    if (!category.createdByUser) {
      throw new BadRequestException('This category was not submitted by a user');
    }

    if (category.isActive) {
      throw new BadRequestException('This category is already approved');
    }

    // Apply edits if provided
    if (dto) {
      // Update name if provided
      if (dto.name && dto.name !== category.name) {
        category.name = dto.name;
        category.slug = this.generateSlug(dto.name);
      }

      // Update parent if provided
      if (dto.parentId !== undefined) {
        if (dto.parentId === null) {
          category.parent = null;
          category.level = 0;
        } else {
          const parentCategory = await this.categoryModel.findById(dto.parentId);
          if (!parentCategory || parentCategory.isDeleted) {
            throw new BadRequestException('Parent category not found');
          }
          category.parent = new Types.ObjectId(dto.parentId);
          category.level = parentCategory.level + 1;
        }
      }

      // Update classification if provided (default is niche/false if not specified)
      if (dto.isMainstream !== undefined) {
        category.isMainstream = dto.isMainstream;
      } else if (category.isMainstream === undefined || category.isMainstream === null) {
        // Default to niche if not already set
        category.isMainstream = false;
      }

      // Update aliases if provided
      if (dto.aliases !== undefined) {
        category.aliases = dto.aliases;
      }

      // Update HS code prefix if provided
      if (dto.hsCodePrefix !== undefined) {
        category.hsCodePrefix = dto.hsCodePrefix;
      }
    } else {
      // No DTO provided, ensure isMainstream has a value (default to niche)
      if (category.isMainstream === undefined || category.isMainstream === null) {
        category.isMainstream = false;
      }
    }

    // Approve the category
    category.isActive = true;
    await category.save();
    return this.getCategoryById(id);
  }

  /**
   * Get pending user-submitted categories for admin review
   */
  async getPendingUserCategories() {
    const pendingCategories = await this.categoryModel
      .find({
        createdByUser: { $exists: true, $ne: null },
        isActive: false,
        isDeleted: { $ne: true },
      })
      .populate('parent', 'name slug')
      .populate('createdByUser', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .lean();

    return {
      categories: pendingCategories,
      total: pendingCategories.length,
    };
  }

  /**
   * Get commodity stats for admin dashboard
   */
  async getCommodityStats() {
    const stats = await this.categoryModel.aggregate([
      { $match: { isDeleted: { $ne: true }, isMainstream: { $ne: null } } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          mainstream: { $sum: { $cond: [{ $eq: ['$isMainstream', true] }, 1, 0] } },
          niche: { $sum: { $cond: [{ $eq: ['$isMainstream', false] }, 1, 0] } },
          active: { $sum: { $cond: ['$isActive', 1, 0] } },
          inactive: { $sum: { $cond: [{ $eq: ['$isActive', false] }, 1, 0] } },
        },
      },
    ]);

    const pending = await this.categoryModel.countDocuments({
      createdByUser: { $exists: true, $ne: null },
      isActive: false,
      isDeleted: { $ne: true },
    });

    return {
      total: stats[0]?.total || 0,
      mainstream: stats[0]?.mainstream || 0,
      niche: stats[0]?.niche || 0,
      active: stats[0]?.active || 0,
      inactive: stats[0]?.inactive || 0,
      pendingReview: pending,
    };
  }

  /**
   * Seed default categories with full hierarchy (3 levels)
   */
  async seedDefaultCategories() {
    // Define full category hierarchy
    const categoryHierarchy = [
      {
        name: 'Agricultural Products',
        slug: 'agricultural-products',
        order: 1,
        children: [
          {
            name: 'Grains & Cereals',
            slug: 'grains-cereals',
            order: 1,
            children: [
              { name: 'Wheat', slug: 'wheat', order: 1 },
              { name: 'Rice', slug: 'rice', order: 2 },
              { name: 'Corn/Maize', slug: 'corn-maize', order: 3 },
              { name: 'Barley', slug: 'barley', order: 4 },
              { name: 'Oats', slug: 'oats', order: 5 },
              { name: 'Sorghum', slug: 'sorghum', order: 6 },
            ],
          },
          {
            name: 'Oilseeds & Pulses',
            slug: 'oilseeds-pulses',
            order: 2,
            children: [
              { name: 'Soybeans', slug: 'soybeans', order: 1 },
              { name: 'Sunflower Seeds', slug: 'sunflower-seeds', order: 2 },
              { name: 'Rapeseed/Canola', slug: 'rapeseed-canola', order: 3 },
              { name: 'Lentils', slug: 'lentils', order: 4 },
              { name: 'Chickpeas', slug: 'chickpeas', order: 5 },
              { name: 'Peanuts/Groundnuts', slug: 'peanuts-groundnuts', order: 6 },
            ],
          },
          {
            name: 'Fruits & Vegetables',
            slug: 'fruits-vegetables',
            order: 3,
            children: [
              { name: 'Citrus Fruits', slug: 'citrus-fruits', order: 1 },
              { name: 'Tropical Fruits', slug: 'tropical-fruits', order: 2 },
              { name: 'Root Vegetables', slug: 'root-vegetables', order: 3 },
              { name: 'Leafy Greens', slug: 'leafy-greens', order: 4 },
            ],
          },
          {
            name: 'Plantation Crops',
            slug: 'plantation-crops',
            order: 4,
            children: [
              { name: 'Coffee', slug: 'coffee', order: 1 },
              { name: 'Tea', slug: 'tea', order: 2 },
              { name: 'Cocoa', slug: 'cocoa', order: 3 },
              { name: 'Rubber', slug: 'rubber', order: 4 },
              { name: 'Cotton', slug: 'cotton', order: 5 },
              { name: 'Sugarcane', slug: 'sugarcane', order: 6 },
            ],
          },
          {
            name: 'Spices & Herbs',
            slug: 'spices-herbs',
            order: 5,
            children: [
              { name: 'Black Pepper', slug: 'black-pepper', order: 1 },
              { name: 'Turmeric', slug: 'turmeric', order: 2 },
              { name: 'Cardamom', slug: 'cardamom', order: 3 },
              { name: 'Cinnamon', slug: 'cinnamon', order: 4 },
              { name: 'Cumin', slug: 'cumin', order: 5 },
            ],
          },
        ],
      },
      {
        name: 'Chemicals',
        slug: 'chemicals',
        order: 2,
        children: [
          {
            name: 'Fertilizers',
            slug: 'fertilizers',
            order: 1,
            children: [
              { name: 'Urea', slug: 'urea', order: 1 },
              { name: 'DAP (Diammonium Phosphate)', slug: 'dap', order: 2 },
              { name: 'NPK Fertilizers', slug: 'npk-fertilizers', order: 3 },
              { name: 'Potash', slug: 'potash', order: 4 },
              { name: 'Ammonium Nitrate', slug: 'ammonium-nitrate', order: 5 },
            ],
          },
          {
            name: 'Industrial Chemicals',
            slug: 'industrial-chemicals',
            order: 2,
            children: [
              { name: 'Caustic Soda', slug: 'caustic-soda', order: 1 },
              { name: 'Soda Ash', slug: 'soda-ash', order: 2 },
              { name: 'Sulfuric Acid', slug: 'sulfuric-acid', order: 3 },
              { name: 'Phosphoric Acid', slug: 'phosphoric-acid', order: 4 },
            ],
          },
          {
            name: 'Petrochemicals',
            slug: 'petrochemicals',
            order: 3,
            children: [
              { name: 'Polyethylene', slug: 'polyethylene', order: 1 },
              { name: 'Polypropylene', slug: 'polypropylene', order: 2 },
              { name: 'PVC', slug: 'pvc', order: 3 },
              { name: 'Methanol', slug: 'methanol', order: 4 },
            ],
          },
          {
            name: 'Agrochemicals',
            slug: 'agrochemicals',
            order: 4,
            children: [
              { name: 'Pesticides', slug: 'pesticides', order: 1 },
              { name: 'Herbicides', slug: 'herbicides', order: 2 },
              { name: 'Fungicides', slug: 'fungicides', order: 3 },
            ],
          },
        ],
      },
      {
        name: 'Metals & Minerals',
        slug: 'metals-minerals',
        order: 3,
        children: [
          {
            name: 'Ferrous Metals',
            slug: 'ferrous-metals',
            order: 1,
            children: [
              { name: 'Iron Ore', slug: 'iron-ore', order: 1 },
              { name: 'Steel Billets', slug: 'steel-billets', order: 2 },
              { name: 'Hot Rolled Coils', slug: 'hot-rolled-coils', order: 3 },
              { name: 'Cold Rolled Coils', slug: 'cold-rolled-coils', order: 4 },
              { name: 'Steel Scrap', slug: 'steel-scrap', order: 5 },
            ],
          },
          {
            name: 'Non-Ferrous Metals',
            slug: 'non-ferrous-metals',
            order: 2,
            children: [
              { name: 'Copper', slug: 'copper', order: 1 },
              { name: 'Aluminum', slug: 'aluminum', order: 2 },
              { name: 'Zinc', slug: 'zinc', order: 3 },
              { name: 'Lead', slug: 'lead', order: 4 },
              { name: 'Nickel', slug: 'nickel', order: 5 },
              { name: 'Tin', slug: 'tin', order: 6 },
            ],
          },
          {
            name: 'Precious Metals',
            slug: 'precious-metals',
            order: 3,
            children: [
              { name: 'Gold', slug: 'gold', order: 1 },
              { name: 'Silver', slug: 'silver', order: 2 },
              { name: 'Platinum', slug: 'platinum', order: 3 },
            ],
          },
          {
            name: 'Industrial Minerals',
            slug: 'industrial-minerals',
            order: 4,
            children: [
              { name: 'Coal', slug: 'coal', order: 1 },
              { name: 'Bauxite', slug: 'bauxite', order: 2 },
              { name: 'Limestone', slug: 'limestone', order: 3 },
              { name: 'Gypsum', slug: 'gypsum', order: 4 },
              { name: 'Silica Sand', slug: 'silica-sand', order: 5 },
            ],
          },
        ],
      },
      {
        name: 'Textiles',
        slug: 'textiles',
        order: 4,
        children: [
          {
            name: 'Natural Fibers',
            slug: 'natural-fibers',
            order: 1,
            children: [
              { name: 'Cotton Fiber', slug: 'cotton-fiber', order: 1 },
              { name: 'Wool', slug: 'wool', order: 2 },
              { name: 'Silk', slug: 'silk', order: 3 },
              { name: 'Jute', slug: 'jute', order: 4 },
              { name: 'Linen/Flax', slug: 'linen-flax', order: 5 },
            ],
          },
          {
            name: 'Synthetic Fibers',
            slug: 'synthetic-fibers',
            order: 2,
            children: [
              { name: 'Polyester', slug: 'polyester', order: 1 },
              { name: 'Nylon', slug: 'nylon', order: 2 },
              { name: 'Acrylic', slug: 'acrylic', order: 3 },
              { name: 'Viscose/Rayon', slug: 'viscose-rayon', order: 4 },
            ],
          },
          {
            name: 'Yarns & Threads',
            slug: 'yarns-threads',
            order: 3,
            children: [
              { name: 'Cotton Yarn', slug: 'cotton-yarn', order: 1 },
              { name: 'Blended Yarn', slug: 'blended-yarn', order: 2 },
              { name: 'Sewing Thread', slug: 'sewing-thread', order: 3 },
            ],
          },
          {
            name: 'Fabrics',
            slug: 'fabrics',
            order: 4,
            children: [
              { name: 'Woven Fabrics', slug: 'woven-fabrics', order: 1 },
              { name: 'Knitted Fabrics', slug: 'knitted-fabrics', order: 2 },
              { name: 'Non-Woven Fabrics', slug: 'non-woven-fabrics', order: 3 },
              { name: 'Denim', slug: 'denim', order: 4 },
            ],
          },
        ],
      },
      {
        name: 'Machinery & Equipment',
        slug: 'machinery-equipment',
        order: 5,
        children: [
          {
            name: 'Agricultural Machinery',
            slug: 'agricultural-machinery',
            order: 1,
            children: [
              { name: 'Tractors', slug: 'tractors', order: 1 },
              { name: 'Harvesters', slug: 'harvesters', order: 2 },
              { name: 'Irrigation Equipment', slug: 'irrigation-equipment', order: 3 },
              { name: 'Planting Equipment', slug: 'planting-equipment', order: 4 },
            ],
          },
          {
            name: 'Industrial Machinery',
            slug: 'industrial-machinery',
            order: 2,
            children: [
              { name: 'Pumps', slug: 'pumps', order: 1 },
              { name: 'Compressors', slug: 'compressors', order: 2 },
              { name: 'Generators', slug: 'generators', order: 3 },
              { name: 'Motors', slug: 'motors', order: 4 },
            ],
          },
          {
            name: 'Construction Equipment',
            slug: 'construction-equipment',
            order: 3,
            children: [
              { name: 'Excavators', slug: 'excavators', order: 1 },
              { name: 'Cranes', slug: 'cranes', order: 2 },
              { name: 'Concrete Mixers', slug: 'concrete-mixers', order: 3 },
            ],
          },
          {
            name: 'Processing Equipment',
            slug: 'processing-equipment',
            order: 4,
            children: [
              { name: 'Food Processing', slug: 'food-processing-equipment', order: 1 },
              { name: 'Textile Machinery', slug: 'textile-machinery', order: 2 },
              { name: 'Packaging Machinery', slug: 'packaging-machinery', order: 3 },
            ],
          },
        ],
      },
      {
        name: 'Food & Beverages',
        slug: 'food-beverages',
        order: 6,
        children: [
          {
            name: 'Edible Oils',
            slug: 'edible-oils',
            order: 1,
            children: [
              { name: 'Palm Oil', slug: 'palm-oil', order: 1 },
              { name: 'Soybean Oil', slug: 'soybean-oil', order: 2 },
              { name: 'Sunflower Oil', slug: 'sunflower-oil', order: 3 },
              { name: 'Olive Oil', slug: 'olive-oil', order: 4 },
              { name: 'Coconut Oil', slug: 'coconut-oil', order: 5 },
            ],
          },
          {
            name: 'Sugar & Sweeteners',
            slug: 'sugar-sweeteners',
            order: 2,
            children: [
              { name: 'Raw Sugar', slug: 'raw-sugar', order: 1 },
              { name: 'Refined Sugar', slug: 'refined-sugar', order: 2 },
              { name: 'Molasses', slug: 'molasses', order: 3 },
            ],
          },
          {
            name: 'Dairy Products',
            slug: 'dairy-products',
            order: 3,
            children: [
              { name: 'Milk Powder', slug: 'milk-powder', order: 1 },
              { name: 'Butter', slug: 'butter', order: 2 },
              { name: 'Cheese', slug: 'cheese', order: 3 },
              { name: 'Whey', slug: 'whey', order: 4 },
            ],
          },
          {
            name: 'Meat & Seafood',
            slug: 'meat-seafood',
            order: 4,
            children: [
              { name: 'Beef', slug: 'beef', order: 1 },
              { name: 'Poultry', slug: 'poultry', order: 2 },
              { name: 'Pork', slug: 'pork', order: 3 },
              { name: 'Fish & Seafood', slug: 'fish-seafood', order: 4 },
            ],
          },
          {
            name: 'Beverages',
            slug: 'beverages',
            order: 5,
            children: [
              { name: 'Fruit Juices', slug: 'fruit-juices', order: 1 },
              { name: 'Mineral Water', slug: 'mineral-water', order: 2 },
              { name: 'Alcoholic Beverages', slug: 'alcoholic-beverages', order: 3 },
            ],
          },
        ],
      },
      {
        name: 'Energy & Fuels',
        slug: 'energy-fuels',
        order: 7,
        children: [
          {
            name: 'Crude Oil & Petroleum',
            slug: 'crude-oil-petroleum',
            order: 1,
            children: [
              { name: 'Crude Oil', slug: 'crude-oil', order: 1 },
              { name: 'Diesel', slug: 'diesel', order: 2 },
              { name: 'Gasoline', slug: 'gasoline', order: 3 },
              { name: 'Jet Fuel', slug: 'jet-fuel', order: 4 },
              { name: 'Fuel Oil', slug: 'fuel-oil', order: 5 },
            ],
          },
          {
            name: 'Natural Gas & LNG',
            slug: 'natural-gas-lng',
            order: 2,
            children: [
              { name: 'Natural Gas', slug: 'natural-gas', order: 1 },
              { name: 'LNG', slug: 'lng', order: 2 },
              { name: 'LPG', slug: 'lpg', order: 3 },
            ],
          },
          {
            name: 'Renewable Energy',
            slug: 'renewable-energy',
            order: 3,
            children: [
              { name: 'Biofuels', slug: 'biofuels', order: 1 },
              { name: 'Ethanol', slug: 'ethanol', order: 2 },
              { name: 'Biodiesel', slug: 'biodiesel', order: 3 },
            ],
          },
        ],
      },
      {
        name: 'Construction Materials',
        slug: 'construction-materials',
        order: 8,
        children: [
          {
            name: 'Cement & Concrete',
            slug: 'cement-concrete',
            order: 1,
            children: [
              { name: 'Portland Cement', slug: 'portland-cement', order: 1 },
              { name: 'Clinite', slug: 'clinker', order: 2 },
              { name: 'Ready-Mix Concrete', slug: 'ready-mix-concrete', order: 3 },
            ],
          },
          {
            name: 'Building Materials',
            slug: 'building-materials',
            order: 2,
            children: [
              { name: 'Bricks & Blocks', slug: 'bricks-blocks', order: 1 },
              { name: 'Tiles', slug: 'tiles', order: 2 },
              { name: 'Glass', slug: 'glass', order: 3 },
              { name: 'Timber/Lumber', slug: 'timber-lumber', order: 4 },
              { name: 'Plywood', slug: 'plywood', order: 5 },
            ],
          },
        ],
      },
    ];

    let created = 0;
    let skipped = 0;

    // Helper function to create category and its children recursively
    const createCategoryWithChildren = async (
      cat: any,
      parentId: Types.ObjectId | null,
      level: number,
    ) => {
      // Check if category exists
      const exists = await this.categoryModel.findOne({
        slug: cat.slug,
        isDeleted: { $ne: true },
      });

      let categoryId: Types.ObjectId;

      // Determine if this is a leaf category (no children)
      const isLeafCategory = !cat.children || cat.children.length === 0;

      if (!exists) {
        const newCat = await this.categoryModel.create({
          name: cat.name,
          slug: cat.slug,
          level,
          order: cat.order,
          parent: parentId,
          isActive: true,
          isDeleted: false,
          // Set isMainstream for leaf categories (level 2), null for parent categories
          isMainstream: isLeafCategory ? true : null, // Default seeded categories to mainstream
          aliases: cat.aliases || [],
          hsCodePrefix: cat.hsCodePrefix,
        });
        categoryId = newCat._id as Types.ObjectId;
        created++;
      } else {
        categoryId = exists._id as Types.ObjectId;
        skipped++;
      }

      // Create children recursively
      if (cat.children && cat.children.length > 0) {
        for (const child of cat.children) {
          await createCategoryWithChildren(child, categoryId, level + 1);
        }
      }
    };

    // Create all root categories and their children
    for (const rootCat of categoryHierarchy) {
      await createCategoryWithChildren(rootCat, null, 0);
    }

    const total = await this.categoryModel.countDocuments({ isDeleted: { $ne: true } });

    return { created, skipped, total };
  }

  /**
   * Seed mainstream classification for existing leaf categories
   * This updates all leaf categories (categories without children) to set isMainstream=true
   * Run this after categories exist but before isMainstream was set
   */
  async seedMainstreamClassification() {
    // Get all categories
    const allCategories = await this.categoryModel
      .find({ isDeleted: { $ne: true } })
      .lean();

    // Build a set of category IDs that have children
    const parentIds = new Set<string>();
    allCategories.forEach((cat) => {
      if (cat.parent) {
        parentIds.add(cat.parent.toString());
      }
    });

    // Find leaf categories (categories not in parentIds set)
    const leafCategoryIds = allCategories
      .filter((cat) => !parentIds.has(cat._id.toString()))
      .map((cat) => cat._id);

    // Update all leaf categories to be mainstream
    const updateResult = await this.categoryModel.updateMany(
      {
        _id: { $in: leafCategoryIds },
        isMainstream: null, // Only update categories that haven't been classified
      },
      {
        $set: { isMainstream: true },
      }
    );

    // Get updated stats
    const stats = await this.getCommodityStats();

    return {
      totalLeafCategories: leafCategoryIds.length,
      updated: updateResult.modifiedCount,
      alreadyClassified: leafCategoryIds.length - updateResult.modifiedCount,
      ...stats,
    };
  }
}
