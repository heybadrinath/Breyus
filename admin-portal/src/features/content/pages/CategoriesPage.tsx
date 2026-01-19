import { useState } from 'react'
import {
  FolderTree,
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Loader2,
  ChevronRight,
  ChevronDown,
  Sparkles,
  Folder,
  FolderOpen,
  X,
  Tag,
  Check,
  Clock,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import {
  useCategoryTree,
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
  useSeedCategories,
  useSeedMainstreamClassification,
  useToggleCategoryMainstream,
  usePendingCategories,
  useApproveCategory,
} from '../hooks/useCategories'
import type { ProductCategory, CreateCategoryDto, UpdateCategoryDto } from '../types'

type FormMode = 'create' | 'edit'

interface CategoryFormData {
  name: string
  slug: string
  description: string
  parent: string | null
  isActive: boolean
  // Mainstream/Niche classification fields
  isMainstream: boolean | null
  aliases: string
  hsCodePrefix: string
}

const defaultFormData: CategoryFormData = {
  name: '',
  slug: '',
  description: '',
  parent: null,
  isActive: true,
  isMainstream: null, // Default to null (parent category)
  aliases: '',
  hsCodePrefix: '',
}

interface TreeNodeProps {
  category: ProductCategory & { children?: ProductCategory[] }
  level: number
  onEdit: (category: ProductCategory) => void
  onDelete: (category: ProductCategory) => void
  onAddChild: (parent: ProductCategory) => void
  onToggleMainstream: (category: ProductCategory, isMainstream: boolean) => void
  expandedIds: Set<string>
  toggleExpand: (id: string) => void
}

function TreeNode({
  category,
  level,
  onEdit,
  onDelete,
  onAddChild,
  onToggleMainstream,
  expandedIds,
  toggleExpand,
}: TreeNodeProps) {
  const hasChildren = category.children && category.children.length > 0
  const isExpanded = expandedIds.has(category._id)
  const canAddChild = level < 2 // Max 3 levels (0, 1, 2)

  // Leaf node = can be classified as mainstream/niche
  const isLeafNode = !hasChildren
  const isMainstream = category.isMainstream
  const isPendingApproval = category.createdByUser && !category.isActive

  return (
    <div>
      <div
        className={cn(
          'flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-muted/50 group',
          level === 0 && 'bg-muted/30',
          level === 1 && 'ml-6',
          level === 2 && 'ml-12',
          isPendingApproval && 'border-l-4 border-amber-500 bg-amber-50/50'
        )}
      >
        {/* Expand/Collapse button */}
        <button
          onClick={() => hasChildren && toggleExpand(category._id)}
          className={cn(
            'h-5 w-5 flex items-center justify-center rounded hover:bg-muted',
            !hasChildren && 'invisible'
          )}
        >
          {isExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>

        {/* Folder icon */}
        {isExpanded && hasChildren ? (
          <FolderOpen className="h-4 w-4 text-amber-500" />
        ) : (
          <Folder className="h-4 w-4 text-amber-500" />
        )}

        {/* Category name and details */}
        <div className="flex-1 flex items-center gap-2">
          <span className={cn('font-medium', level === 0 && 'text-base')}>
            {category.name}
          </span>
          <span className="text-xs text-muted-foreground font-mono">
            /{category.slug}
          </span>

          {/* Mainstream/Niche Badge for leaf nodes */}
          {isLeafNode && isMainstream !== null && (
            <Badge
              variant="outline"
              className={cn(
                'text-xs',
                isMainstream
                  ? 'bg-green-100 text-green-700 border-green-300'
                  : 'bg-orange-100 text-orange-700 border-orange-300'
              )}
            >
              <Tag className="h-3 w-3 mr-1" />
              {isMainstream ? 'Mainstream' : 'Niche'}
            </Badge>
          )}

          {/* HS Code prefix if set */}
          {category.hsCodePrefix && (
            <Badge variant="secondary" className="text-xs font-mono">
              HS: {category.hsCodePrefix}
            </Badge>
          )}

          {/* Aliases count */}
          {category.aliases && category.aliases.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {category.aliases.length} alias{category.aliases.length > 1 ? 'es' : ''}
            </Badge>
          )}

          {/* Pending approval badge */}
          {isPendingApproval && (
            <Badge variant="outline" className="text-xs bg-amber-100 text-amber-700 border-amber-300">
              <Clock className="h-3 w-3 mr-1" />
              Pending
            </Badge>
          )}

          {!category.isActive && !isPendingApproval && (
            <Badge variant="secondary" className="text-xs">
              <X className="h-3 w-3 mr-1" />
              Inactive
            </Badge>
          )}
        </div>

        {/* Level badge */}
        <Badge variant="outline" className="text-xs">
          L{level}
        </Badge>

        {/* Actions */}
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
          {/* Quick toggle for mainstream/niche */}
          {isLeafNode && isMainstream !== null && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => onToggleMainstream(category, !isMainstream)}
              title={`Switch to ${isMainstream ? 'Niche' : 'Mainstream'}`}
            >
              {isMainstream ? (
                <ToggleRight className="h-4 w-4 text-green-600" />
              ) : (
                <ToggleLeft className="h-4 w-4 text-orange-600" />
              )}
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {canAddChild && (
                <DropdownMenuItem onClick={() => onAddChild(category)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Subcategory
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => onEdit(category)}>
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              {isLeafNode && isMainstream !== null && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onToggleMainstream(category, !isMainstream)}>
                    {isMainstream ? (
                      <>
                        <ToggleLeft className="h-4 w-4 mr-2 text-orange-600" />
                        Mark as Niche
                      </>
                    ) : (
                      <>
                        <ToggleRight className="h-4 w-4 mr-2 text-green-600" />
                        Mark as Mainstream
                      </>
                    )}
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-600"
                onClick={() => onDelete(category)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Children */}
      {isExpanded && hasChildren && (
        <div className="mt-1">
          {category.children?.map((child) => (
            <TreeNode
              key={child._id}
              category={child}
              level={level + 1}
              onEdit={onEdit}
              onDelete={onDelete}
              onAddChild={onAddChild}
              onToggleMainstream={onToggleMainstream}
              expandedIds={expandedIds}
              toggleExpand={toggleExpand}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// Approval form data structure
interface ApproveFormData {
  name: string
  parentId: string | null
  isMainstream: boolean
  aliases: string
  hsCodePrefix: string
}

const defaultApproveFormData: ApproveFormData = {
  name: '',
  parentId: null,
  isMainstream: false, // Default to niche
  aliases: '',
  hsCodePrefix: '',
}

export function CategoriesPage() {
  const { toast } = useToast()
  const [formOpen, setFormOpen] = useState(false)
  const [formMode, setFormMode] = useState<FormMode>('create')
  const [formData, setFormData] = useState<CategoryFormData>(defaultFormData)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | null>(null)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  // Approval dialog state
  const [approveDialogOpen, setApproveDialogOpen] = useState(false)
  const [categoryToApprove, setCategoryToApprove] = useState<ProductCategory | null>(null)
  const [approveFormData, setApproveFormData] = useState<ApproveFormData>(defaultApproveFormData)

  const { data: treeData, isLoading, error } = useCategoryTree()
  const { data: flatData } = useCategories({ isActive: true })
  const { data: pendingData } = usePendingCategories()
  const createCategory = useCreateCategory()
  const updateCategory = useUpdateCategory()
  const deleteCategory = useDeleteCategory()
  const seedCategories = useSeedCategories()
  const seedMainstream = useSeedMainstreamClassification()
  const toggleMainstream = useToggleCategoryMainstream()
  const approveCategory = useApproveCategory()

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const expandAll = () => {
    if (treeData?.tree) {
      const allIds = new Set<string>()
      const collectIds = (cats: ProductCategory[]) => {
        cats.forEach((cat) => {
          allIds.add(cat._id)
          if ((cat as any).children) {
            collectIds((cat as any).children)
          }
        })
      }
      collectIds(treeData.tree as any)
      setExpandedIds(allIds)
    }
  }

  const collapseAll = () => {
    setExpandedIds(new Set())
  }

  const openCreateForm = (parent?: ProductCategory) => {
    setFormMode('create')
    setFormData({
      ...defaultFormData,
      parent: parent?._id || null,
    })
    setEditingId(null)
    setFormOpen(true)
  }

  const openEditForm = (category: ProductCategory) => {
    setFormMode('edit')
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      parent: typeof category.parent === 'string' ? category.parent : (category.parent as any)?._id || null,
      isActive: category.isActive,
      isMainstream: category.isMainstream ?? null,
      aliases: category.aliases?.join(', ') || '',
      hsCodePrefix: category.hsCodePrefix || '',
    })
    setEditingId(category._id)
    setFormOpen(true)
  }

  const handleFormSubmit = async () => {
    try {
      // Parse aliases from comma-separated string
      const aliasesArray = formData.aliases
        .split(',')
        .map((a) => a.trim())
        .filter((a) => a.length > 0)

      if (formMode === 'create') {
        const dto: CreateCategoryDto = {
          name: formData.name.trim(),
          slug: formData.slug.trim() || undefined,
          description: formData.description.trim() || undefined,
          parent: formData.parent || undefined,
          isActive: formData.isActive,
          isMainstream: formData.isMainstream,
          aliases: aliasesArray.length > 0 ? aliasesArray : undefined,
          hsCodePrefix: formData.hsCodePrefix.trim() || undefined,
        }
        await createCategory.mutateAsync(dto)
        toast({ title: 'Category created successfully' })
      } else if (editingId) {
        const dto: UpdateCategoryDto = {
          name: formData.name.trim(),
          slug: formData.slug.trim() || undefined,
          description: formData.description.trim() || undefined,
          isActive: formData.isActive,
          isMainstream: formData.isMainstream,
          aliases: aliasesArray,
          hsCodePrefix: formData.hsCodePrefix.trim() || undefined,
        }
        await updateCategory.mutateAsync({ categoryId: editingId, data: dto })
        toast({ title: 'Category updated successfully' })
      }
      setFormOpen(false)
      setFormData(defaultFormData)
      setEditingId(null)
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.response?.data?.message || err.message || 'Operation failed',
        variant: 'destructive',
      })
    }
  }

  const handleToggleMainstream = async (category: ProductCategory, isMainstream: boolean) => {
    try {
      await toggleMainstream.mutateAsync({ categoryId: category._id, isMainstream })
      toast({
        title: `Category marked as ${isMainstream ? 'Mainstream' : 'Niche'}`,
        description: `${category.name} classification has been updated.`,
      })
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.response?.data?.message || err.message || 'Failed to toggle classification',
        variant: 'destructive',
      })
    }
  }

  // Open approve dialog with category data
  const openApproveDialog = (category: ProductCategory) => {
    setCategoryToApprove(category)
    setApproveFormData({
      name: category.name,
      parentId: typeof category.parent === 'object' ? category.parent?._id || null : category.parent || null,
      isMainstream: category.isMainstream ?? false,
      aliases: category.aliases?.join(', ') || '',
      hsCodePrefix: category.hsCodePrefix || '',
    })
    setApproveDialogOpen(true)
  }

  // Handle the actual approval with edits
  const handleApproveCategory = async () => {
    if (!categoryToApprove) return

    try {
      const edits = {
        name: approveFormData.name !== categoryToApprove.name ? approveFormData.name : undefined,
        parentId: approveFormData.parentId,
        isMainstream: approveFormData.isMainstream,
        aliases: approveFormData.aliases
          ? approveFormData.aliases.split(',').map((a) => a.trim()).filter(Boolean)
          : [],
        hsCodePrefix: approveFormData.hsCodePrefix || undefined,
      }

      await approveCategory.mutateAsync({
        categoryId: categoryToApprove._id,
        edits,
      })
      setApproveDialogOpen(false)
      setCategoryToApprove(null)
      setApproveFormData(defaultApproveFormData)
      toast({ title: 'Category approved successfully' })
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.response?.data?.message || err.message || 'Failed to approve category',
        variant: 'destructive',
      })
    }
  }

  const handleDelete = async () => {
    if (!selectedCategory) return
    try {
      await deleteCategory.mutateAsync(selectedCategory._id)
      toast({ title: 'Category deleted successfully' })
      setDeleteDialogOpen(false)
      setSelectedCategory(null)
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.response?.data?.message || err.message || 'Failed to delete category',
        variant: 'destructive',
      })
    }
  }

  const handleSeed = async () => {
    try {
      const result = await seedCategories.mutateAsync()
      if (!result.data) {
        throw new Error('No response data returned')
      }
      toast({
        title: 'Categories seeded',
        description: `Created ${result.data.created}, skipped ${result.data.skipped} (already exist)`,
      })
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.response?.data?.message || err.message || 'Failed to seed categories',
        variant: 'destructive',
      })
    }
  }

  const handleSeedMainstream = async () => {
    try {
      const result = await seedMainstream.mutateAsync()
      if (!result.data) {
        throw new Error('No response data returned')
      }
      toast({
        title: 'Mainstream classification seeded',
        description: `${result.data.updated} categories classified as mainstream (${result.data.mainstream} total mainstream, ${result.data.niche} niche)`,
      })
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.response?.data?.message || err.message || 'Failed to seed mainstream classification',
        variant: 'destructive',
      })
    }
  }

  // Generate slug from name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
  }

  // Get parent options (only level 0 and 1)
  const parentOptions = flatData?.categories.filter((cat) => cat.level < 2) || []

  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Product Categories & Commodities</h2>
          <p className="text-sm text-muted-foreground">
            {treeData?.total || 0} categories (max 3 levels)
            {pendingData?.total && pendingData.total > 0 && (
              <span className="ml-2 inline-flex items-center">
                •
                <Badge variant="outline" className="ml-2 bg-amber-100 text-amber-700 border-amber-300">
                  <Clock className="h-3 w-3 mr-1" />
                  {pendingData.total} pending
                </Badge>
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleSeed} disabled={seedCategories.isPending}>
            {seedCategories.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 mr-2" />
            )}
            Seed Defaults
          </Button>
          <Button variant="outline" onClick={handleSeedMainstream} disabled={seedMainstream.isPending}>
            {seedMainstream.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Tag className="h-4 w-4 mr-2" />
            )}
            Seed Mainstream
          </Button>
          <Button onClick={() => openCreateForm()}>
            <Plus className="h-4 w-4 mr-2" />
            Add Category
          </Button>
        </div>
      </div>

      {/* Pending User Submissions */}
      {pendingData?.categories && pendingData.categories.length > 0 && (
        <div className="border border-amber-200 bg-amber-50 rounded-lg p-4">
          <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
            <Clock className="h-4 w-4 text-amber-600" />
            Pending User Submissions ({pendingData.total})
          </h3>
          <div className="space-y-2">
            {pendingData.categories.map((cat) => (
              <div
                key={cat._id}
                className="flex items-center justify-between bg-white rounded-lg p-3 border border-amber-200"
              >
                <div className="flex items-center gap-3">
                  <Folder className="h-4 w-4 text-amber-500" />
                  <div>
                    <p className="font-medium">{cat.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Suggested by: {typeof cat.createdByUser === 'object'
                        ? `${(cat.createdByUser as any).firstName} ${(cat.createdByUser as any).lastName}`
                        : 'Unknown'}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openEditForm(cat)}
                  >
                    <Pencil className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => openApproveDialog(cat)}
                  >
                    <Check className="h-3 w-3 mr-1" />
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => {
                      setSelectedCategory(cat)
                      setDeleteDialogOpen(true)
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={expandAll}>
          Expand All
        </Button>
        <Button variant="outline" size="sm" onClick={collapseAll}>
          Collapse All
        </Button>
      </div>

      {/* Tree View */}
      <div className="border rounded-lg p-4 min-h-[400px]">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="text-center py-12 text-muted-foreground">
            Failed to load categories
          </div>
        ) : !treeData?.tree || treeData.tree.length === 0 ? (
          <div className="text-center py-12">
            <FolderTree className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">No categories yet</p>
            <Button variant="outline" onClick={handleSeed}>
              <Sparkles className="h-4 w-4 mr-2" />
              Seed Default Categories
            </Button>
          </div>
        ) : (
          <div className="space-y-1">
            {(treeData.tree as (ProductCategory & { children?: ProductCategory[] })[]).map((category) => (
              <TreeNode
                key={category._id}
                category={category}
                level={0}
                onEdit={openEditForm}
                onDelete={(cat) => {
                  setSelectedCategory(cat)
                  setDeleteDialogOpen(true)
                }}
                onAddChild={(cat) => openCreateForm(cat)}
                onToggleMainstream={handleToggleMainstream}
                expandedIds={expandedIds}
                toggleExpand={toggleExpand}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>
              {formMode === 'create' ? 'Add Category' : 'Edit Category'}
            </DialogTitle>
            <DialogDescription>
              {formMode === 'create'
                ? 'Create a new product category.'
                : 'Update category details.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 overflow-y-auto flex-1 pr-2">
            <div className="space-y-2">
              <Label htmlFor="name">Category Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => {
                  const name = e.target.value
                  setFormData((prev) => ({
                    ...prev,
                    name,
                    slug: prev.slug || generateSlug(name),
                  }))
                }}
                placeholder="Agricultural Products"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))
                }
                placeholder="agricultural-products"
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">
                Auto-generated from name. Used in URLs.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Products related to agriculture..."
                rows={2}
              />
            </div>
            {formMode === 'create' && (
              <div className="space-y-2">
                <Label htmlFor="parent">Parent Category (Optional)</Label>
                <Select
                  value={formData.parent || 'none'}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, parent: value === 'none' ? null : value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select parent (or leave empty for root)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None (Root Category)</SelectItem>
                    {parentOptions.map((cat) => (
                      <SelectItem key={cat._id} value={cat._id}>
                        {cat.level === 0 ? '' : '— '}{cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="flex items-center justify-between pt-2">
              <Label htmlFor="active">Active</Label>
              <div className="flex items-center gap-2">
                <Switch
                  id="active"
                  checked={formData.isActive}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, isActive: checked }))
                  }
                />
                <span className="text-sm text-muted-foreground">
                  {formData.isActive ? 'Visible' : 'Hidden'}
                </span>
              </div>
            </div>

            {/* Classification section (only show for leaf categories or when no parent) */}
            <div className="border-t pt-4 mt-4">
              <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Commodity Classification
              </h4>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Classification Type</Label>
                  <Select
                    value={formData.isMainstream === null ? 'parent' : formData.isMainstream ? 'mainstream' : 'niche'}
                    onValueChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        isMainstream: value === 'parent' ? null : value === 'mainstream',
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select classification" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="parent">Parent Category (no classification)</SelectItem>
                      <SelectItem value="mainstream">Mainstream Commodity</SelectItem>
                      <SelectItem value="niche">Niche Commodity</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Only leaf categories (no children) should be classified as Mainstream or Niche.
                  </p>
                </div>

                {formData.isMainstream !== null && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="aliases">Aliases (comma-separated)</Label>
                      <Input
                        id="aliases"
                        value={formData.aliases}
                        onChange={(e) => setFormData((prev) => ({ ...prev, aliases: e.target.value }))}
                        placeholder="Maize, Indian Corn"
                      />
                      <p className="text-xs text-muted-foreground">
                        Alternative names for this commodity, used for search matching.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="hsCodePrefix">HS Code Prefix</Label>
                      <Input
                        id="hsCodePrefix"
                        value={formData.hsCodePrefix}
                        onChange={(e) => setFormData((prev) => ({ ...prev, hsCodePrefix: e.target.value.replace(/[^0-9]/g, '').slice(0, 4) }))}
                        placeholder="1001"
                        maxLength={4}
                        className="font-mono"
                      />
                      <p className="text-xs text-muted-foreground">
                        4-digit HS code prefix (e.g., "1001" for Wheat).
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
          <DialogFooter className="flex-shrink-0 border-t pt-4 mt-2">
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleFormSubmit}
              disabled={
                !formData.name ||
                createCategory.isPending ||
                updateCategory.isPending
              }
            >
              {createCategory.isPending || updateCategory.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              {formMode === 'create' ? 'Create' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{selectedCategory?.name}</strong>?
              {(selectedCategory as any)?.children?.length > 0 && (
                <span className="block mt-2 text-amber-600">
                  This category has subcategories. Delete those first.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteCategory.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Approve Category Dialog */}
      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Approve Category</DialogTitle>
            <DialogDescription>
              Review and optionally edit this user-submitted category before approving.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Category Name */}
            <div className="space-y-2">
              <Label htmlFor="approve-name">Category Name</Label>
              <Input
                id="approve-name"
                value={approveFormData.name}
                onChange={(e) =>
                  setApproveFormData({ ...approveFormData, name: e.target.value })
                }
                placeholder="Enter category name"
              />
            </div>

            {/* Parent Category */}
            <div className="space-y-2">
              <Label htmlFor="approve-parent">Parent Category</Label>
              <Select
                value={approveFormData.parentId || 'none'}
                onValueChange={(value) =>
                  setApproveFormData({
                    ...approveFormData,
                    parentId: value === 'none' ? null : value,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select parent category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No parent (Root level)</SelectItem>
                  {flatData?.categories
                    .filter((cat) => cat._id !== categoryToApprove?._id)
                    .map((cat) => (
                      <SelectItem key={cat._id} value={cat._id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* Classification */}
            <div className="space-y-2">
              <Label>Classification</Label>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() =>
                    setApproveFormData({ ...approveFormData, isMainstream: true })
                  }
                  className={cn(
                    'flex-1 py-2 px-4 rounded-lg border-2 transition-all text-sm font-medium',
                    approveFormData.isMainstream
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  )}
                >
                  Mainstream
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setApproveFormData({ ...approveFormData, isMainstream: false })
                  }
                  className={cn(
                    'flex-1 py-2 px-4 rounded-lg border-2 transition-all text-sm font-medium',
                    !approveFormData.isMainstream
                      ? 'border-orange-500 bg-orange-50 text-orange-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  )}
                >
                  Niche
                </button>
              </div>
            </div>

            {/* Aliases */}
            <div className="space-y-2">
              <Label htmlFor="approve-aliases">Aliases (comma-separated)</Label>
              <Input
                id="approve-aliases"
                value={approveFormData.aliases}
                onChange={(e) =>
                  setApproveFormData({ ...approveFormData, aliases: e.target.value })
                }
                placeholder="e.g., Maize, Corn on cob"
              />
              <p className="text-xs text-muted-foreground">
                Alternative names for this commodity
              </p>
            </div>

            {/* HS Code Prefix */}
            <div className="space-y-2">
              <Label htmlFor="approve-hs">HS Code Prefix</Label>
              <Input
                id="approve-hs"
                value={approveFormData.hsCodePrefix}
                onChange={(e) =>
                  setApproveFormData({ ...approveFormData, hsCodePrefix: e.target.value })
                }
                placeholder="e.g., 1001"
                maxLength={10}
              />
              <p className="text-xs text-muted-foreground">
                4-digit harmonized system code prefix
              </p>
            </div>

            {/* Submitted By Info */}
            {categoryToApprove?.createdByUser && (
              <div className="p-3 bg-gray-50 rounded-lg text-sm">
                <p className="text-muted-foreground">
                  Submitted by:{' '}
                  <span className="font-medium text-foreground">
                    {typeof categoryToApprove.createdByUser === 'object'
                      ? `${(categoryToApprove.createdByUser as any).firstName} ${(categoryToApprove.createdByUser as any).lastName}`
                      : 'Unknown User'}
                  </span>
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setApproveDialogOpen(false)
                setCategoryToApprove(null)
                setApproveFormData(defaultApproveFormData)
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleApproveCategory}
              disabled={approveCategory.isPending || !approveFormData.name}
            >
              {approveCategory.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Check className="h-4 w-4 mr-2" />
              )}
              Approve Category
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
