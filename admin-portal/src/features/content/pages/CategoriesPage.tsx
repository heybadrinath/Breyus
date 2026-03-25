import { useState, useMemo, useCallback } from 'react'
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
  XCircle,
  Tag,
  Check,
  Clock,
  ToggleLeft,
  ToggleRight,
  AlertTriangle,
  MoveRight,
  Search,
  Leaf,
  Hash,
  FileText,
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
  usePendingCategoriesDetailed,
  useApproveCategory,
  useRejectCategory,
} from '../hooks/useCategories'
import type { ProductCategory, CreateCategoryDto, UpdateCategoryDto } from '../types'

type FormMode = 'create' | 'edit'

interface CategoryFormData {
  name: string
  slug: string
  description: string
  parent: string | null
  isActive: boolean
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
  isMainstream: null,
  aliases: '',
  hsCodePrefix: '',
}

interface TreeNodeProps {
  category: ProductCategory & { children?: ProductCategory[] }
  level: number
  onEdit: (category: ProductCategory) => void
  onDelete: (category: ProductCategory) => void
  onAddChild: (parent: ProductCategory) => void
  onMove: (category: ProductCategory) => void
  onToggleMainstream: (category: ProductCategory, isMainstream: boolean) => void
  expandedIds: Set<string>
  toggleExpand: (id: string) => void
  isLast: boolean
  parentIsLast: boolean[]
  searchQuery: string
}

// Check if a category or its children match the search query
function categoryMatchesSearch(
  category: ProductCategory & { children?: ProductCategory[] },
  query: string
): boolean {
  const lowerQuery = query.toLowerCase()
  const nameMatch = category.name.toLowerCase().includes(lowerQuery)
  const slugMatch = category.slug.toLowerCase().includes(lowerQuery)
  const aliasMatch = category.aliases?.some(a => a.toLowerCase().includes(lowerQuery))
  const hsMatch = category.hsCodePrefix?.includes(query)

  if (nameMatch || slugMatch || aliasMatch || hsMatch) return true

  // Check children
  if (category.children) {
    return category.children.some(child => categoryMatchesSearch(child, query))
  }

  return false
}

function TreeNode({
  category,
  level,
  onEdit,
  onDelete,
  onAddChild,
  onMove,
  onToggleMainstream,
  expandedIds,
  toggleExpand,
  isLast,
  parentIsLast,
  searchQuery,
}: TreeNodeProps) {
  const hasChildren = category.children && category.children.length > 0
  const isExpanded = expandedIds.has(category._id)
  const canAddChild = level < 4

  const isLeafNode = !hasChildren
  const isMainstream = category.isMainstream
  const isPendingApproval = category.createdByUser && !category.isActive

  // Check if this item matches search
  const matchesSearch = searchQuery && (
    category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    category.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
    category.aliases?.some(a => a.toLowerCase().includes(searchQuery.toLowerCase())) ||
    category.hsCodePrefix?.includes(searchQuery)
  )

  // Level-based styling
  const getLevelStyles = () => {
    switch (level) {
      case 0:
        return {
          text: 'text-base font-semibold text-foreground',
          bg: 'bg-muted/40 hover:bg-muted/60',
          icon: 'text-amber-500',
          padding: 'py-3',
        }
      case 1:
        return {
          text: 'text-sm font-medium text-foreground',
          bg: 'hover:bg-muted/40',
          icon: 'text-amber-400',
          padding: 'py-2.5',
        }
      case 2:
        return {
          text: 'text-sm font-medium text-foreground/90',
          bg: 'hover:bg-muted/30',
          icon: 'text-amber-400/80',
          padding: 'py-2',
        }
      default:
        return {
          text: 'text-sm text-foreground/80',
          bg: 'hover:bg-muted/20',
          icon: 'text-amber-400/60',
          padding: 'py-1.5',
        }
    }
  }

  const styles = getLevelStyles()

  // Generate tree connector lines
  const renderTreeLines = () => {
    const lines = []

    // Vertical lines from ancestors
    for (let i = 0; i < level; i++) {
      const isAncestorLast = parentIsLast[i]
      lines.push(
        <div
          key={`vline-${i}`}
          className="w-6 flex-shrink-0 relative"
        >
          {!isAncestorLast && (
            <div className="absolute left-3 top-0 bottom-0 w-px bg-border" />
          )}
        </div>
      )
    }

    // Current level connector
    if (level > 0) {
      lines.push(
        <div key="connector" className="w-6 flex-shrink-0 relative">
          {/* Vertical line (if not last) */}
          {!isLast && (
            <div className="absolute left-3 top-1/2 bottom-0 w-px bg-border" />
          )}
          {/* Horizontal branch */}
          <div className="absolute left-3 top-1/2 w-3 h-px bg-border" />
          {/* Vertical line above */}
          <div className="absolute left-3 top-0 h-1/2 w-px bg-border" />
        </div>
      )
    }

    return lines
  }

  return (
    <div>
      <div
        className={cn(
          'flex items-start gap-1 px-2 rounded-lg group transition-colors',
          styles.bg,
          styles.padding,
          isPendingApproval && 'border-l-4 border-amber-500 bg-amber-500/5',
          matchesSearch && 'ring-2 ring-primary/50 bg-primary/5'
        )}
      >
        {/* Tree connector lines */}
        {renderTreeLines()}

        {/* Expand/Collapse button */}
        <button
          onClick={() => hasChildren && toggleExpand(category._id)}
          className={cn(
            'h-6 w-6 flex items-center justify-center rounded hover:bg-muted flex-shrink-0 mt-0.5',
            !hasChildren && 'invisible'
          )}
        >
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
        </button>

        {/* Icon */}
        <div className="flex-shrink-0 mt-0.5">
          {isLeafNode ? (
            <Leaf className={cn('h-4 w-4', isMainstream ? 'text-green-500' : 'text-orange-400')} />
          ) : isExpanded ? (
            <FolderOpen className={cn('h-4 w-4', styles.icon)} />
          ) : (
            <Folder className={cn('h-4 w-4', styles.icon)} />
          )}
        </div>

        {/* Content - Two Lines */}
        <div className="flex-1 min-w-0 ml-1">
          {/* Primary Line: Name + Badge */}
          <div className="flex items-center gap-2">
            <span className={cn(styles.text, 'truncate')}>
              {category.name}
            </span>

            {/* Classification Badge - Only for leaf nodes */}
            {isLeafNode && isMainstream !== null && (
              <Badge
                variant="outline"
                className={cn(
                  'text-[10px] px-1.5 py-0 h-5 flex-shrink-0',
                  isMainstream
                    ? 'bg-green-500/10 text-green-600 border-green-500/30'
                    : 'bg-orange-500/10 text-orange-600 border-orange-500/30'
                )}
              >
                {isMainstream ? 'Mainstream' : 'Niche'}
              </Badge>
            )}

            {/* Pending badge */}
            {isPendingApproval && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 bg-amber-500/10 text-amber-600 border-amber-500/30 flex-shrink-0">
                <Clock className="h-3 w-3 mr-0.5" />
                Pending
              </Badge>
            )}

            {!category.isActive && !isPendingApproval && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5 flex-shrink-0">
                Inactive
              </Badge>
            )}
          </div>

          {/* Secondary Line: Slug, HS Code, Aliases */}
          <div className="flex items-center gap-2 mt-0.5 text-[11px] text-muted-foreground">
            <span className="font-mono text-muted-foreground/70">/{category.slug}</span>

            {category.hsCodePrefix && (
              <>
                <span className="text-muted-foreground/40">•</span>
                <span className="flex items-center gap-0.5">
                  <Hash className="h-3 w-3" />
                  {category.hsCodePrefix}
                </span>
              </>
            )}

            {category.aliases && category.aliases.length > 0 && (
              <>
                <span className="text-muted-foreground/40">•</span>
                <span className="flex items-center gap-0.5" title={category.aliases.join(', ')}>
                  <FileText className="h-3 w-3" />
                  {category.aliases.length} alias{category.aliases.length > 1 ? 'es' : ''}
                </span>
              </>
            )}

            {hasChildren && (
              <>
                <span className="text-muted-foreground/40">•</span>
                <span>{category.children?.length} items</span>
              </>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 flex-shrink-0">
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
              <DropdownMenuItem onClick={() => onMove(category)}>
                <MoveRight className="h-4 w-4 mr-2" />
                Move
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
        <div>
          {category.children
            ?.filter((child) => !(child.createdByUser && !child.isActive))
            .filter((child) => !searchQuery || categoryMatchesSearch(child, searchQuery))
            .map((child, index, filteredArray) => (
              <TreeNode
                key={child._id}
                category={child}
                level={level + 1}
                onEdit={onEdit}
                onDelete={onDelete}
                onAddChild={onAddChild}
                onMove={onMove}
                onToggleMainstream={onToggleMainstream}
                expandedIds={expandedIds}
                toggleExpand={toggleExpand}
                isLast={index === filteredArray.length - 1}
                parentIsLast={[...parentIsLast, isLast]}
                searchQuery={searchQuery}
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
  isMainstream: false,
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
  const [searchQuery, setSearchQuery] = useState('')

  // Approval dialog state
  const [approveDialogOpen, setApproveDialogOpen] = useState(false)
  const [categoryToApprove, setCategoryToApprove] = useState<ProductCategory | null>(null)
  const [approveFormData, setApproveFormData] = useState<ApproveFormData>(defaultApproveFormData)

  // Rejection dialog state
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [categoryToReject, setCategoryToReject] = useState<ProductCategory | null>(null)
  const [rejectFormData, setRejectFormData] = useState({
    replacementCategoryId: '',
    rejectionReason: '',
  })

  // Move dialog state
  const [moveDialogOpen, setMoveDialogOpen] = useState(false)
  const [categoryToMove, setCategoryToMove] = useState<ProductCategory | null>(null)
  const [moveTargetParentId, setMoveTargetParentId] = useState<string | null>(null)

  const { data: treeData, isLoading, error } = useCategoryTree()
  const { data: flatData } = useCategories({ isActive: true })
  const { data: _pendingData } = usePendingCategories()
  const { data: pendingDetailedData } = usePendingCategoriesDetailed()
  const createCategory = useCreateCategory()
  const updateCategory = useUpdateCategory()
  const deleteCategory = useDeleteCategory()
  const seedCategories = useSeedCategories()
  const seedMainstream = useSeedMainstreamClassification()
  const toggleMainstream = useToggleCategoryMainstream()
  const approveCategory = useApproveCategory()
  const rejectCategory = useRejectCategory()

  // Helper function to recursively filter out pending categories from the tree
  const filterPendingFromTree = (
    categories: (ProductCategory & { children?: ProductCategory[] })[]
  ): (ProductCategory & { children?: ProductCategory[] })[] => {
    return categories
      .filter((cat) => {
        const isPending = cat.createdByUser && !cat.isActive
        return !isPending
      })
      .map((cat) => ({
        ...cat,
        children: cat.children ? filterPendingFromTree(cat.children) : undefined,
      }))
  }

  // Memoized filtered tree that excludes pending categories
  const filteredTreeData = useMemo(() => {
    if (!treeData?.tree) return null
    return filterPendingFromTree(treeData.tree as (ProductCategory & { children?: ProductCategory[] })[])
  }, [treeData])

  // Filter tree by search query
  const searchFilteredTree = useMemo(() => {
    if (!filteredTreeData || !searchQuery) return filteredTreeData
    return filteredTreeData.filter(cat => categoryMatchesSearch(cat, searchQuery))
  }, [filteredTreeData, searchQuery])

  // Calculate stats
  const stats = useMemo(() => {
    if (!flatData?.categories) return { total: 0, mainstream: 0, niche: 0, folders: 0 }

    let mainstream = 0
    let niche = 0
    let folders = 0

    flatData.categories.forEach(cat => {
      if (cat.isMainstream === true) mainstream++
      else if (cat.isMainstream === false) niche++
      else folders++
    })

    return {
      total: flatData.categories.length,
      mainstream,
      niche,
      folders,
    }
  }, [flatData])

  // Build a map of category ID to full path
  const categoryPathMap = useMemo(() => {
    const pathMap = new Map<string, string>()
    if (!flatData?.categories) return pathMap

    const parentLookup = new Map<string, ProductCategory>()
    flatData.categories.forEach((cat) => {
      parentLookup.set(cat._id, cat)
    })

    const buildPath = (cat: ProductCategory): string => {
      const parts: string[] = [cat.name]
      let current = cat

      while (current.parent) {
        const parentId = typeof current.parent === 'string'
          ? current.parent
          : (current.parent as ProductCategory)?._id

        if (!parentId) break

        const parentCat = parentLookup.get(parentId)
        if (!parentCat) break

        parts.unshift(parentCat.name)
        current = parentCat
      }

      return parts.join(' > ')
    }

    flatData.categories.forEach((cat) => {
      pathMap.set(cat._id, buildPath(cat))
    })

    return pathMap
  }, [flatData])

  // Get categories with their full paths for selection dropdowns
  const categoriesWithPaths = useMemo(() => {
    if (!flatData?.categories) return []
    return flatData.categories
      .filter((cat) => cat.isActive && !cat.isDeleted)
      .map((cat) => ({
        ...cat,
        fullPath: categoryPathMap.get(cat._id) || cat.name,
      }))
      .sort((a, b) => a.fullPath.localeCompare(b.fullPath))
  }, [flatData, categoryPathMap])

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
    if (filteredTreeData) {
      const allIds = new Set<string>()
      const collectIds = (cats: (ProductCategory & { children?: ProductCategory[] })[]) => {
        cats.forEach((cat) => {
          allIds.add(cat._id)
          if (cat.children) {
            collectIds(cat.children as (ProductCategory & { children?: ProductCategory[] })[])
          }
        })
      }
      collectIds(filteredTreeData)
      setExpandedIds(allIds)
    }
  }

  const collapseAll = () => {
    setExpandedIds(new Set())
  }

  // Auto-expand when searching
  useMemo(() => {
    if (searchQuery && filteredTreeData) {
      expandAll()
    }
  }, [searchQuery])

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

  const openRejectDialog = (category: ProductCategory) => {
    setCategoryToReject(category)
    setRejectFormData({
      replacementCategoryId: '',
      rejectionReason: '',
    })
    setRejectDialogOpen(true)
  }

  const handleRejectCategory = async () => {
    if (!categoryToReject || !rejectFormData.replacementCategoryId) return

    try {
      const result = await rejectCategory.mutateAsync({
        categoryId: categoryToReject._id,
        replacementCategoryId: rejectFormData.replacementCategoryId,
        rejectionReason: rejectFormData.rejectionReason || undefined,
      })
      setRejectDialogOpen(false)
      setCategoryToReject(null)
      setRejectFormData({ replacementCategoryId: '', rejectionReason: '' })
      toast({
        title: 'Category rejected',
        description: `${result.data?.affectedProductCount || 0} products reassigned to ${result.data?.replacementCategory?.name || 'replacement category'}`,
      })
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.response?.data?.message || err.message || 'Failed to reject category',
        variant: 'destructive',
      })
    }
  }

  const openMoveDialog = (category: ProductCategory) => {
    setCategoryToMove(category)
    const currentParentId = typeof category.parent === 'string'
      ? category.parent
      : (category.parent as ProductCategory)?._id || null
    setMoveTargetParentId(currentParentId)
    setMoveDialogOpen(true)
  }

  const handleMoveCategory = async () => {
    if (!categoryToMove) return

    try {
      const currentParentId = typeof categoryToMove.parent === 'string'
        ? categoryToMove.parent
        : (categoryToMove.parent as ProductCategory)?._id || null

      if (moveTargetParentId === currentParentId) {
        setMoveDialogOpen(false)
        setCategoryToMove(null)
        return
      }

      await updateCategory.mutateAsync({
        categoryId: categoryToMove._id,
        data: {
          parent: moveTargetParentId || undefined,
        } as UpdateCategoryDto,
      })

      const targetName = moveTargetParentId
        ? categoriesWithPaths.find((c) => c._id === moveTargetParentId)?.name || 'selected location'
        : 'root level'

      toast({
        title: 'Category moved successfully',
        description: `"${categoryToMove.name}" has been moved to ${targetName}.`,
      })
      setMoveDialogOpen(false)
      setCategoryToMove(null)
      setMoveTargetParentId(null)
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.response?.data?.message || err.message || 'Failed to move category',
        variant: 'destructive',
      })
    }
  }

  const getValidMoveTargets = useCallback((categoryId: string) => {
    if (!flatData?.categories) return []

    const getDescendantIds = (parentId: string): Set<string> => {
      const descendants = new Set<string>()
      const children = flatData.categories.filter((c) => {
        const pId = typeof c.parent === 'string' ? c.parent : (c.parent as ProductCategory)?._id
        return pId === parentId
      })
      children.forEach((child) => {
        descendants.add(child._id)
        getDescendantIds(child._id).forEach((id) => descendants.add(id))
      })
      return descendants
    }

    const descendantIds = getDescendantIds(categoryId)

    return categoriesWithPaths.filter((cat) => {
      if (cat._id === categoryId) return false
      if (descendantIds.has(cat._id)) return false
      if (cat.level >= 4) return false
      return true
    })
  }, [flatData, categoriesWithPaths])

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

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
  }

  const parentOptions = useMemo(() => {
    return categoriesWithPaths.filter((cat) => cat.level < 4)
  }, [categoriesWithPaths])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Product Categories</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage commodity categories and classifications
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

      {/* Stats Bar */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-muted/30 rounded-lg px-4 py-3">
          <p className="text-2xl font-bold">{stats.total}</p>
          <p className="text-xs text-muted-foreground">Total Categories</p>
        </div>
        <div className="bg-green-500/10 rounded-lg px-4 py-3">
          <p className="text-2xl font-bold text-green-600">{stats.mainstream}</p>
          <p className="text-xs text-green-600/70">Mainstream</p>
        </div>
        <div className="bg-orange-500/10 rounded-lg px-4 py-3">
          <p className="text-2xl font-bold text-orange-600">{stats.niche}</p>
          <p className="text-xs text-orange-600/70">Niche</p>
        </div>
        <div className="bg-amber-500/10 rounded-lg px-4 py-3">
          <p className="text-2xl font-bold text-amber-600">{stats.folders}</p>
          <p className="text-xs text-amber-600/70">Folders</p>
        </div>
      </div>

      {/* Pending User Submissions */}
      {pendingDetailedData?.categories && pendingDetailedData.categories.length > 0 && (
        <div className="border border-amber-500/30 bg-amber-500/5 rounded-lg p-4">
          <h3 className="text-sm font-semibold flex items-center gap-2 mb-3 text-amber-700 dark:text-amber-400">
            <Clock className="h-4 w-4" />
            Pending User Submissions ({pendingDetailedData.total})
          </h3>
          <div className="space-y-2">
            {pendingDetailedData.categories.map((cat) => (
              <div
                key={cat._id}
                className="bg-background rounded-lg p-3 border border-border flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <Folder className="h-5 w-5 text-amber-500" />
                  <div>
                    <p className="font-medium">{cat.name}</p>
                    <p className="text-xs text-muted-foreground">
                      by {typeof cat.createdByUser === 'object' && cat.createdByUser
                        ? ((cat.createdByUser as any).company?.founderName || (cat.createdByUser as any).mail || 'Unknown')
                        : 'Unknown'}
                      {cat.linkedProductCount > 0 && (
                        <span className="ml-2 text-blue-600">• {cat.linkedProductCount} products</span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => openEditForm(cat)}>
                    <Pencil className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                  <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => openApproveDialog(cat)}>
                    <Check className="h-3 w-3 mr-1" />
                    Approve
                  </Button>
                  <Button size="sm" variant="outline" className="border-red-300 text-red-600 hover:bg-red-500/10" onClick={() => openRejectDialog(cat)}>
                    <XCircle className="h-3 w-3 mr-1" />
                    Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search & Toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={expandAll}>
          Expand All
        </Button>
        <Button variant="outline" size="sm" onClick={collapseAll}>
          Collapse All
        </Button>
      </div>

      {/* Tree View */}
      <div className="border rounded-lg p-4 min-h-[400px] bg-background">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="text-center py-12 text-muted-foreground">
            Failed to load categories
          </div>
        ) : !searchFilteredTree || searchFilteredTree.length === 0 ? (
          <div className="text-center py-12">
            <FolderTree className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">
              {searchQuery ? 'No categories match your search' : 'No categories yet'}
            </p>
            {!searchQuery && (
              <Button variant="outline" onClick={handleSeed}>
                <Sparkles className="h-4 w-4 mr-2" />
                Seed Default Categories
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-0.5">
            {searchFilteredTree
              .filter((category) => !(category.createdByUser && !category.isActive))
              .map((category, index, array) => (
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
                  onMove={openMoveDialog}
                  onToggleMainstream={handleToggleMainstream}
                  expandedIds={expandedIds}
                  toggleExpand={toggleExpand}
                  isLast={index === array.length - 1}
                  parentIsLast={[]}
                  searchQuery={searchQuery}
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
                  <SelectContent className="max-h-[300px]">
                    <SelectItem value="none">None (Root Category)</SelectItem>
                    {parentOptions.map((cat) => (
                      <SelectItem key={cat._id} value={cat._id}>
                        <span className="text-sm">{cat.fullPath}</span>
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

            {/* Classification section */}
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
                <SelectContent className="max-h-[300px]">
                  <SelectItem value="none">No parent (Root level)</SelectItem>
                  {categoriesWithPaths
                    .filter((cat) => cat._id !== categoryToApprove?._id && cat.level < 4)
                    .map((cat) => (
                      <SelectItem key={cat._id} value={cat._id}>
                        <span className="text-sm">{cat.fullPath}</span>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

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
                      ? 'border-green-500 bg-green-500/10 text-green-700 dark:text-green-400'
                      : 'border-border text-muted-foreground hover:border-muted-foreground/50'
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
                      ? 'border-orange-500 bg-orange-500/10 text-orange-700 dark:text-orange-400'
                      : 'border-border text-muted-foreground hover:border-muted-foreground/50'
                  )}
                >
                  Niche
                </button>
              </div>
            </div>

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
            </div>

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
            </div>

            {categoryToApprove?.createdByUser && (
              <div className="p-3 bg-muted rounded-lg text-sm">
                <p className="text-muted-foreground">
                  Submitted by:{' '}
                  <span className="font-medium text-foreground">
                    {typeof categoryToApprove.createdByUser === 'object' && categoryToApprove.createdByUser
                      ? ((categoryToApprove.createdByUser as any).company?.founderName || (categoryToApprove.createdByUser as any).mail || 'Unknown')
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

      {/* Reject Category Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <XCircle className="h-5 w-5" />
              Reject Category
            </DialogTitle>
            <DialogDescription>
              Reject this user-submitted category and reassign any linked products.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {categoryToReject && (
              <div className="p-3 bg-red-500/10 rounded-lg border border-red-500/30">
                <p className="text-sm text-red-600 dark:text-red-400">
                  Rejecting: <span className="font-semibold">{categoryToReject.name}</span>
                </p>
                {(() => {
                  const detailed = pendingDetailedData?.categories.find(c => c._id === categoryToReject._id)
                  if (detailed?.linkedProductCount && detailed.linkedProductCount > 0) {
                    return (
                      <div className="mt-2 flex items-center gap-2 text-sm">
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                        <span className="text-amber-600">
                          {detailed.linkedProductCount} products will be reassigned
                        </span>
                      </div>
                    )
                  }
                  return null
                })()}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="replacement-category">
                Replacement Category <span className="text-red-500">*</span>
              </Label>
              <Select
                value={rejectFormData.replacementCategoryId}
                onValueChange={(value) =>
                  setRejectFormData({ ...rejectFormData, replacementCategoryId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a replacement category" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {categoriesWithPaths
                    .filter((c) => c.isMainstream !== null && c.isMainstream !== undefined)
                    .map((cat) => (
                    <SelectItem key={cat._id} value={cat._id}>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{cat.fullPath}</span>
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-[10px] px-1',
                            cat.isMainstream
                              ? 'bg-green-500/10 text-green-600 border-green-500/30'
                              : 'bg-orange-500/10 text-orange-600 border-orange-500/30'
                          )}
                        >
                          {cat.isMainstream ? 'Mainstream' : 'Niche'}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="rejection-reason">Rejection Reason (Optional)</Label>
              <Textarea
                id="rejection-reason"
                value={rejectFormData.rejectionReason}
                onChange={(e) =>
                  setRejectFormData({ ...rejectFormData, rejectionReason: e.target.value })
                }
                placeholder="Explain why this category was not approved..."
                rows={3}
              />
            </div>

            {rejectFormData.replacementCategoryId && (
              <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/30">
                <p className="text-sm text-blue-600">
                  Products will be reassigned to:{' '}
                  <span className="font-semibold">
                    {categoriesWithPaths.find(c => c._id === rejectFormData.replacementCategoryId)?.fullPath || 'Unknown'}
                  </span>
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRejectDialogOpen(false)
                setCategoryToReject(null)
                setRejectFormData({ replacementCategoryId: '', rejectionReason: '' })
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectCategory}
              disabled={rejectCategory.isPending || !rejectFormData.replacementCategoryId}
            >
              {rejectCategory.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <XCircle className="h-4 w-4 mr-2" />
              )}
              Reject & Reassign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Move Category Dialog */}
      <Dialog open={moveDialogOpen} onOpenChange={setMoveDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MoveRight className="h-5 w-5" />
              Move Category
            </DialogTitle>
            <DialogDescription>
              Select a new location for this category.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {categoryToMove && (
              <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/30">
                <p className="text-sm text-blue-700">
                  Moving: <span className="font-semibold">{categoryToMove.name}</span>
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  Current: {categoryPathMap.get(categoryToMove._id) || categoryToMove.name}
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="move-target">New Parent Category</Label>
              <Select
                value={moveTargetParentId || 'root'}
                onValueChange={(value) =>
                  setMoveTargetParentId(value === 'root' ? null : value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select destination" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  <SelectItem value="root">
                    <span className="font-medium">Root Level (No Parent)</span>
                  </SelectItem>
                  {categoryToMove && getValidMoveTargets(categoryToMove._id).map((cat) => (
                    <SelectItem key={cat._id} value={cat._id}>
                      <div className="flex items-center gap-2">
                        <Folder className="h-3 w-3 text-amber-500" />
                        <span className="text-sm">{cat.fullPath}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {(moveTargetParentId || categoryToMove) && (
              <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/30">
                <p className="text-sm text-green-700">
                  New location:{' '}
                  <span className="font-semibold">
                    {moveTargetParentId
                      ? `${categoriesWithPaths.find((c) => c._id === moveTargetParentId)?.fullPath || 'Root'} > ${categoryToMove?.name}`
                      : `${categoryToMove?.name} (at root)`}
                  </span>
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setMoveDialogOpen(false)
                setCategoryToMove(null)
                setMoveTargetParentId(null)
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleMoveCategory}
              disabled={updateCategory.isPending}
            >
              {updateCategory.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <MoveRight className="h-4 w-4 mr-2" />
              )}
              Move Category
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
