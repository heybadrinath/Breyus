import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ProductCategory } from '../schemas/product-category.schema';
import { Product } from '../../../products/schema/products.schema';
import { User } from '../../../users/user.schema';
import { MailService } from '../../../mail/mail.service';
import { emailTemplates } from '../../../mail/templates/email.templates';
import {
  CreateCategoryDto,
  UpdateCategoryDto,
  GetCategoriesQueryDto,
  ReorderCategoryDto,
  SuggestCategoryDto,
  ToggleMainstreamDto,
  ApproveCategoryDto,
  RejectCategoryDto,
} from '../dto';
import {
  commodityHierarchy,
  CommoditySeedItem,
  commodityStats,
} from '../../../seeds/seed-commodities-enhanced';

@Injectable()
export class CategoriesService {
  private readonly logger = new Logger(CategoriesService.name);

  constructor(
    @InjectModel(ProductCategory.name)
    private readonly categoryModel: Model<ProductCategory>,
    @InjectModel(Product.name)
    private readonly productModel: Model<Product>,
    @InjectModel(User.name)
    private readonly userModel: Model<User>,
    private readonly mailService: MailService,
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
      throw new ConflictException(
        `Category with slug '${slug}' already exists`,
      );
    }

    // Determine level
    let level = 0;
    if (dto.parent) {
      const parent = await this.categoryModel.findById(dto.parent);
      if (!parent || parent.isDeleted) {
        throw new BadRequestException('Parent category not found');
      }
      if (parent.level >= 4) {
        throw new BadRequestException('Maximum category depth is 5 levels');
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
        throw new ConflictException(
          `Category with slug '${dto.slug}' already exists`,
        );
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
          throw new BadRequestException(
            'Cannot set category as its own parent',
          );
        }

        // Check depth constraint
        const childDepth = await this.getMaxChildDepth(id);
        if (newParent.level + 1 + childDepth > 4) {
          throw new BadRequestException(
            'Moving would exceed maximum depth of 5 levels',
          );
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
    if (dto.isMainstream !== undefined)
      category.isMainstream = dto.isMainstream;
    if (dto.aliases !== undefined) category.aliases = dto.aliases;
    if (dto.hsCodePrefix !== undefined)
      category.hsCodePrefix = dto.hsCodePrefix;

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
      throw new BadRequestException(
        'Cannot delete category with children. Delete children first.',
      );
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
        'Cannot set mainstream status on parent categories. Only leaf categories can be classified.',
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
      }),
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
        }),
      );
    }

    // Combine approved and pending categories
    const allCategories = [...withPaths, ...userPendingCategories];

    // Group by classification
    const mainstream = allCategories.filter(
      (cat) => cat.isMainstream === true && !cat.isPending,
    );
    const niche = allCategories.filter(
      (cat) => cat.isMainstream === false || cat.isPending,
    );

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
        `A category with similar name already exists: "${existing.name}"`,
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
      if (parent.level >= 4) {
        throw new BadRequestException('Maximum category depth is 5 levels');
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
      throw new BadRequestException(
        'This category was not submitted by a user',
      );
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
          const parentCategory = await this.categoryModel.findById(
            dto.parentId,
          );
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
      } else if (
        category.isMainstream === undefined ||
        category.isMainstream === null
      ) {
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
      if (
        category.isMainstream === undefined ||
        category.isMainstream === null
      ) {
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
      .populate({
        path: 'createdByUser',
        select: 'mail company',
        populate: {
          path: 'company',
          select: 'companyName founderName',
        },
      })
      .sort({ createdAt: -1 })
      .lean();

    return {
      categories: pendingCategories,
      total: pendingCategories.length,
    };
  }

  /**
   * Get pending user-submitted categories with linked product details
   * Returns products that are using each pending category
   */
  async getPendingUserCategoriesDetailed() {
    const pendingCategories = await this.categoryModel
      .find({
        createdByUser: { $exists: true, $ne: null },
        isActive: false,
        isDeleted: { $ne: true },
      })
      .populate('parent', 'name slug')
      .populate({
        path: 'createdByUser',
        select: 'mail company',
        populate: {
          path: 'company',
          select: 'companyName founderName',
        },
      })
      .sort({ createdAt: -1 })
      .lean();

    // For each pending category, find linked products
    const categoriesWithProducts = await Promise.all(
      pendingCategories.map(async (category) => {
        const linkedProducts = await this.productModel
          .find({
            categoryId: category._id.toString(),
            isDeleted: { $ne: true },
          })
          .select('_id name userId')
          .populate({
            path: 'userId',
            select: 'mail company',
            populate: {
              path: 'company',
              select: 'companyName founderName',
            },
          })
          .lean();

        return {
          ...category,
          linkedProducts: linkedProducts.map((p) => ({
            _id: p._id,
            name: p.name,
            user: p.userId,
          })),
          linkedProductCount: linkedProducts.length,
        };
      }),
    );

    return {
      categories: categoriesWithProducts,
      total: categoriesWithProducts.length,
    };
  }

  /**
   * Reject a user-submitted category with product reassignment
   * - Validates pending category exists
   * - Validates replacement category is a leaf (isMainstream !== null)
   * - Updates all products using the pending category
   * - Soft-deletes the pending category
   * - Sends email notification to the user
   */
  async rejectPendingCategory(id: string, dto: RejectCategoryDto) {
    // 1. Validate pending category exists
    const pendingCategory = await this.categoryModel.findById(id);
    if (!pendingCategory || pendingCategory.isDeleted) {
      throw new NotFoundException('Category not found');
    }

    if (!pendingCategory.createdByUser) {
      throw new BadRequestException(
        'This category was not submitted by a user',
      );
    }

    if (pendingCategory.isActive) {
      throw new BadRequestException(
        'This category is already approved, cannot reject',
      );
    }

    // 2. Validate replacement category exists and is a leaf
    const replacementCategory = await this.categoryModel.findById(
      dto.replacementCategoryId,
    );
    if (!replacementCategory || replacementCategory.isDeleted) {
      throw new NotFoundException('Replacement category not found');
    }

    if (
      replacementCategory.isMainstream === null ||
      replacementCategory.isMainstream === undefined
    ) {
      throw new BadRequestException(
        'Replacement category must be a leaf category (with mainstream/niche classification)',
      );
    }

    if (!replacementCategory.isActive) {
      throw new BadRequestException(
        'Replacement category must be an approved (active) category',
      );
    }

    // 3. Find all products using this pending category
    const affectedProducts = await this.productModel
      .find({
        categoryId: id,
        isDeleted: { $ne: true },
      })
      .lean();

    // 4. Update products to use replacement category
    const updateResult = await this.productModel.updateMany(
      { categoryId: id },
      {
        $set: {
          categoryId: dto.replacementCategoryId,
          category: replacementCategory.name,
          isNicheCommodity: !replacementCategory.isMainstream, // niche = true if isMainstream = false
        },
      },
    );

    // 5. Get user who created the pending category (populate company for name)
    const userId = pendingCategory.createdByUser.toString();
    const user = (await this.userModel
      .findById(userId)
      .populate('company', 'companyName founderName')
      .lean()) as any;

    // 6. Soft-delete the pending category
    pendingCategory.isDeleted = true;
    pendingCategory.deletedAt = new Date();
    await pendingCategory.save();

    // 7. Get replacement category path for email
    const replacementPath = await this.getCategoryPath(
      dto.replacementCategoryId,
    );

    // 8. Send email notification to user (for each affected product)
    if (user && affectedProducts.length > 0) {
      // User schema uses 'mail' for email, and name comes from Company
      const company = user.company;
      const userName = company?.founderName || company?.companyName || 'User';
      const userEmail = user.mail;

      // Send email for the first product (or all if needed)
      // Using the first product name as representative
      const firstProductName = affectedProducts[0]?.name || 'Your product';

      try {
        const emailHtml = emailTemplates.categoryRejection(
          userName,
          pendingCategory.name,
          replacementPath.join(' > '),
          firstProductName,
          dto.rejectionReason,
        );

        await this.mailService.sendTradeNotificationEmail(
          userEmail,
          'Category Suggestion Not Approved',
          emailHtml,
        );

        this.logger.log(`Category rejection email sent to ${userEmail}`);
      } catch (error) {
        this.logger.error(`Failed to send category rejection email: ${error}`);
        // Don't throw - rejection still succeeded
      }
    }

    return {
      rejected: true,
      categoryName: pendingCategory.name,
      replacementCategory: {
        _id: replacementCategory._id,
        name: replacementCategory.name,
        path: replacementPath.join(' > '),
      },
      affectedProductCount: updateResult.modifiedCount,
      affectedProducts: affectedProducts.map((p) => ({
        _id: p._id,
        name: p.name,
      })),
    };
  }

  /**
   * Get commodities for AI server classification
   * Returns a lightweight format optimized for the AI classifier
   * This is used by the internal endpoint for service-to-service communication
   */
  async getCommoditiesForAI(): Promise<{
    mainstream: Array<{
      name: string;
      aliases: string[];
      hsCodePrefix?: string;
      category?: string;
    }>;
    niche: Array<{
      name: string;
      aliases: string[];
      hsCodePrefix?: string;
      category?: string;
    }>;
  }> {
    const categories = await this.categoryModel
      .find({
        isDeleted: { $ne: true },
        isActive: true,
        isMainstream: { $ne: null },
      })
      .populate('parent', 'name')
      .select('name aliases hsCodePrefix parent isMainstream')
      .sort({ name: 1 })
      .lean();

    const mainstream: Array<{
      name: string;
      aliases: string[];
      hsCodePrefix?: string;
      category?: string;
    }> = [];
    const niche: Array<{
      name: string;
      aliases: string[];
      hsCodePrefix?: string;
      category?: string;
    }> = [];

    for (const cat of categories) {
      const parentDoc = cat.parent as { name?: string } | null;
      const entry = {
        name: cat.name,
        aliases: cat.aliases || [],
        hsCodePrefix: cat.hsCodePrefix || undefined,
        category: parentDoc?.name || undefined,
      };

      if (cat.isMainstream) {
        mainstream.push(entry);
      } else {
        niche.push(entry);
      }
    }

    return { mainstream, niche };
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
          mainstream: {
            $sum: { $cond: [{ $eq: ['$isMainstream', true] }, 1, 0] },
          },
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
   * Seed default categories with full hierarchy (4 levels)
   * Uses enhanced commodity data from seed-commodities-enhanced.ts
   *
   * Structure:
   * - Level 0: Root Category (isMainstream: null)
   * - Level 1: Sub-category (isMainstream: null)
   * - Level 2: Mainstream Commodity (isMainstream: true) - can also have children
   * - Level 3: Niche Variety (isMainstream: false)
   *
   * @param options.reset - If true, deletes ALL existing categories first (fresh start)
   * @param options.updateExisting - If true, updates existing categories with new data (aliases, HS codes)
   */
  async seedDefaultCategories(options?: {
    reset?: boolean;
    updateExisting?: boolean;
  }) {
    const { reset = false, updateExisting = false } = options || {};
    this.logger.log(
      `Starting enhanced commodity seed with ${commodityStats.total} commodities (${commodityStats.mainstream} mainstream, ${commodityStats.niche} niche, ${commodityStats.folders} folders)`,
    );
    this.logger.log(`Options: reset=${reset}, updateExisting=${updateExisting}`);

    let created = 0;
    let skipped = 0;
    let updated = 0;
    let deleted = 0;

    // If reset is true, delete ALL existing categories first
    if (reset) {
      this.logger.warn('RESET MODE: Deleting all existing categories...');

      // Check if any products reference categories
      const productsWithCategories = await this.productModel.countDocuments({
        categoryId: { $exists: true, $ne: null },
      });

      if (productsWithCategories > 0) {
        this.logger.warn(
          `Warning: ${productsWithCategories} products have category references. They will need re-assignment.`,
        );
      }

      // Hard delete all categories (not soft delete)
      const deleteResult = await this.categoryModel.deleteMany({});
      deleted = deleteResult.deletedCount;
      this.logger.log(`Deleted ${deleted} existing categories`);
    }

    // Helper function to create category and its children recursively
    const createCategoryWithChildren = async (
      cat: CommoditySeedItem,
      parentId: Types.ObjectId | null,
      level: number,
    ) => {
      // Check if category exists
      const exists = await this.categoryModel.findOne({
        slug: cat.slug,
        isDeleted: { $ne: true },
      });

      let categoryId: Types.ObjectId;

      // Determine isMainstream value:
      // - If explicitly set in the data, use that value
      // - If not set and is a leaf (no children), default to true (mainstream)
      // - If not set and has children, default to null (folder)
      const isLeafCategory = !cat.children || cat.children.length === 0;
      let isMainstream: boolean | null;

      if (cat.isMainstream !== undefined) {
        // Use explicit value from seed data
        isMainstream = cat.isMainstream;
      } else if (isLeafCategory) {
        // Default leaf categories to mainstream
        isMainstream = true;
      } else {
        // Default parent categories to null (folder)
        isMainstream = null;
      }

      if (!exists) {
        const newCat = await this.categoryModel.create({
          name: cat.name,
          slug: cat.slug,
          level,
          order: cat.order,
          parent: parentId,
          isActive: true,
          isDeleted: false,
          isMainstream,
          aliases: cat.aliases || [],
          hsCodePrefix: cat.hsCodePrefix,
        });
        categoryId = newCat._id;
        created++;
      } else {
        categoryId = exists._id;

        // If updateExisting is true, update the category with new seed data
        if (updateExisting) {
          const updateData: any = {};
          let hasChanges = false;

          // Update name if different
          if (exists.name !== cat.name) {
            updateData.name = cat.name;
            hasChanges = true;
          }

          // Update isMainstream if different
          if (exists.isMainstream !== isMainstream) {
            updateData.isMainstream = isMainstream;
            hasChanges = true;
          }

          // Update aliases (merge new aliases)
          const existingAliases = exists.aliases || [];
          const newAliases = cat.aliases || [];
          const mergedAliases = [
            ...new Set([...existingAliases, ...newAliases]),
          ];
          if (mergedAliases.length !== existingAliases.length) {
            updateData.aliases = mergedAliases;
            hasChanges = true;
          }

          // Update hsCodePrefix if not set or different
          if (cat.hsCodePrefix && exists.hsCodePrefix !== cat.hsCodePrefix) {
            updateData.hsCodePrefix = cat.hsCodePrefix;
            hasChanges = true;
          }

          // Update order if different
          if (exists.order !== cat.order) {
            updateData.order = cat.order;
            hasChanges = true;
          }

          if (hasChanges) {
            await this.categoryModel.updateOne({ _id: exists._id }, updateData);
            updated++;
          } else {
            skipped++;
          }
        } else {
          skipped++;
        }
      }

      // Create children recursively
      if (cat.children && cat.children.length > 0) {
        for (const child of cat.children) {
          await createCategoryWithChildren(child, categoryId, level + 1);
        }
      }
    };

    // Create all root categories and their children
    for (const rootCat of commodityHierarchy) {
      await createCategoryWithChildren(rootCat, null, 0);
    }

    const total = await this.categoryModel.countDocuments({
      isDeleted: { $ne: true },
    });

    // Get updated stats
    const stats = await this.getCommodityStats();

    this.logger.log(
      `Seed complete: ${created} created, ${updated} updated, ${skipped} skipped, ${deleted} deleted, ${total} total`,
    );

    return {
      created,
      updated,
      skipped,
      deleted,
      total,
      stats,
      expectedFromSeed: commodityStats,
    };
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
      },
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
