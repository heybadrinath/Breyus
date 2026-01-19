import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import {
  Search,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Star,
  StarOff,
  Ban,
  CheckCircle,
  Eye,
  Package,
  AlertTriangle,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { PremiumStatCard, PremiumStatCardGrid } from '@/components/shared/PremiumStatCard'
import { generateMockSparklineData } from '@/components/shared/Sparkline'
import {
  useProducts,
  useProductStats,
  useProductCategories,
  useDeactivateProduct,
  useReactivateProduct,
  useFeatureProduct,
  useUnfeatureProduct,
} from '../hooks/useAdminProducts'
import type { Product, ProductsQueryParams } from '../types'

// Helper to format date
function formatDate(dateStr: string) {
  try {
    return format(new Date(dateStr), 'MMM d, yyyy')
  } catch {
    return dateStr
  }
}

export function ProductsPage() {
  const navigate = useNavigate()
  const { toast } = useToast()

  // Query params state
  const [params, setParams] = useState<ProductsQueryParams>({
    page: 1,
    limit: 20,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  })
  const [searchInput, setSearchInput] = useState('')

  // Dialog states
  const [deactivateDialog, setDeactivateDialog] = useState<{
    open: boolean
    product: Product | null
  }>({ open: false, product: null })
  const [deactivateReason, setDeactivateReason] = useState('')

  // Queries and mutations
  const { data, isLoading, error } = useProducts(params)
  const { data: stats, isLoading: statsLoading } = useProductStats()
  const { data: categories } = useProductCategories()
  const deactivateMutation = useDeactivateProduct()
  const reactivateMutation = useReactivateProduct()
  const featureMutation = useFeatureProduct()
  const unfeatureMutation = useUnfeatureProduct()

  // Generate sparkline data for trend visualization
  const sparklineData = useMemo(() => ({
    total: generateMockSparklineData(7, stats?.total ?? 100, 0.08),
    active: generateMockSparklineData(7, stats?.active ?? 80, 0.1),
    deactivated: generateMockSparklineData(7, stats?.deactivated ?? 5, 0.2),
    featured: generateMockSparklineData(7, stats?.featured ?? 10, 0.15),
  }), [stats])

  const handleSearch = () => {
    setParams((prev) => ({ ...prev, search: searchInput, page: 1 }))
  }

  const handleCategoryFilter = (value: string) => {
    setParams((prev) => ({
      ...prev,
      category: value === 'all' ? undefined : value,
      page: 1,
    }))
  }

  const handleStatusFilter = (value: string) => {
    setParams((prev) => {
      const newParams = { ...prev, page: 1 }
      delete newParams.isActive
      delete newParams.isDeactivated
      delete newParams.isFeatured

      if (value === 'active') {
        newParams.isActive = true
        newParams.isDeactivated = false
      } else if (value === 'deactivated') {
        newParams.isDeactivated = true
      } else if (value === 'featured') {
        newParams.isFeatured = true
      } else if (value === 'inactive') {
        newParams.isActive = false
      }

      return newParams
    })
  }

  const handleDeactivate = async () => {
    if (!deactivateDialog.product || !deactivateReason.trim()) return

    try {
      await deactivateMutation.mutateAsync({
        productId: deactivateDialog.product._id,
        data: { reason: deactivateReason },
      })
      toast({
        title: 'Product deactivated',
        description: 'The product has been deactivated successfully.',
      })
      setDeactivateDialog({ open: false, product: null })
      setDeactivateReason('')
    } catch (err: any) {
      toast({
        title: 'Error',
        description:
          err?.response?.data?.message || 'Failed to deactivate product',
        variant: 'destructive',
      })
    }
  }

  const handleReactivate = async (product: Product) => {
    try {
      await reactivateMutation.mutateAsync(product._id)
      toast({
        title: 'Product reactivated',
        description: 'The product has been reactivated successfully.',
      })
    } catch (err: any) {
      toast({
        title: 'Error',
        description:
          err?.response?.data?.message || 'Failed to reactivate product',
        variant: 'destructive',
      })
    }
  }

  const handleFeature = async (product: Product) => {
    try {
      await featureMutation.mutateAsync(product._id)
      toast({
        title: 'Product featured',
        description: 'The product has been featured successfully.',
      })
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err?.response?.data?.message || 'Failed to feature product',
        variant: 'destructive',
      })
    }
  }

  const handleUnfeature = async (product: Product) => {
    try {
      await unfeatureMutation.mutateAsync(product._id)
      toast({
        title: 'Product unfeatured',
        description: 'Featured status removed successfully.',
      })
    } catch (err: any) {
      toast({
        title: 'Error',
        description:
          err?.response?.data?.message || 'Failed to unfeature product',
        variant: 'destructive',
      })
    }
  }

  const getStatusBadge = (product: Product) => {
    if (product.isDeactivated) {
      return <Badge variant="destructive">Deactivated</Badge>
    }
    if (product.isFeatured) {
      return (
        <Badge className="bg-yellow-500 hover:bg-yellow-600">
          <Star className="h-3 w-3 mr-1" />
          Featured
        </Badge>
      )
    }
    if (product.isActive) {
      return (
        <Badge variant="outline" className="text-green-600 border-green-600">
          Active
        </Badge>
      )
    }
    return <Badge variant="secondary">Inactive</Badge>
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Products</h1>
        <p className="text-muted-foreground">
          Manage and moderate platform products
        </p>
      </div>

      {/* Premium Stats Cards */}
      <PremiumStatCardGrid columns={4}>
        <PremiumStatCard
          title="Total Products"
          subtitle={`${stats?.recentlyAdded ?? 0} added last 30 days`}
          value={stats?.total ?? 0}
          icon={Package}
          iconColor="text-blue-500"
          iconBgColor="bg-blue-500/10"
          sparklineData={sparklineData.total}
          isLoading={statsLoading}
        />
        <PremiumStatCard
          title="Active"
          subtitle={stats?.total ? `${Math.round((stats.active / stats.total) * 100)}% of total` : 'Available for sale'}
          value={stats?.active ?? 0}
          icon={CheckCircle}
          iconColor="text-green-500"
          iconBgColor="bg-green-500/10"
          sparklineData={sparklineData.active}
          isLoading={statsLoading}
        />
        <PremiumStatCard
          title="Deactivated"
          subtitle="By admin moderation"
          value={stats?.deactivated ?? 0}
          icon={AlertTriangle}
          iconColor="text-red-500"
          iconBgColor="bg-red-500/10"
          sparklineData={sparklineData.deactivated}
          isLoading={statsLoading}
        />
        <PremiumStatCard
          title="Featured"
          subtitle="Highlighted products"
          value={stats?.featured ?? 0}
          icon={Star}
          iconColor="text-yellow-500"
          iconBgColor="bg-yellow-500/10"
          sparklineData={sparklineData.featured}
          isLoading={statsLoading}
        />
      </PremiumStatCardGrid>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            {/* Search */}
            <div className="flex gap-2 flex-1 min-w-[250px]">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, SKU, or HSN code..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-9"
                />
              </div>
              <Button onClick={handleSearch}>Search</Button>
            </div>

            {/* Category Filter */}
            <Select
              value={params.category || 'all'}
              onValueChange={handleCategoryFilter}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories?.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select
              value={
                params.isDeactivated
                  ? 'deactivated'
                  : params.isFeatured
                    ? 'featured'
                    : params.isActive === false
                      ? 'inactive'
                      : params.isActive
                        ? 'active'
                        : 'all'
              }
              onValueChange={handleStatusFilter}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="deactivated">Deactivated</SelectItem>
                <SelectItem value="featured">Featured</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>Products ({data?.total || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-64 text-destructive">
              Failed to load products
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                        Product
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                        Category
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                        Price
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                        Stock
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                        Status
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                        Created
                      </th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data?.products.map((product) => (
                      <tr
                        key={product._id}
                        className="border-b hover:bg-muted/50 cursor-pointer"
                        onClick={() => navigate(`/products/${product._id}`)}
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            {product.productImages?.[0] ? (
                              <img
                                src={product.productImages[0]}
                                alt={product.name}
                                className="h-10 w-10 rounded object-cover"
                              />
                            ) : (
                              <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                                <Package className="h-5 w-5 text-muted-foreground" />
                              </div>
                            )}
                            <div>
                              <p className="font-medium">{product.name}</p>
                              <p className="text-sm text-muted-foreground">
                                SKU: {product.sku}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="outline">{product.category}</Badge>
                        </td>
                        <td className="py-3 px-4">
                          {product.currency} {product.price}
                        </td>
                        <td className="py-3 px-4">
                          {product.stock} {product.stockUnit}
                        </td>
                        <td className="py-3 px-4">{getStatusBadge(product)}</td>
                        <td className="py-3 px-4 text-muted-foreground">
                          {formatDate(product.createdAt)}
                        </td>
                        <td
                          className="py-3 px-4 text-right"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() =>
                                  navigate(`/products/${product._id}`)
                                }
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {product.isFeatured ? (
                                <DropdownMenuItem
                                  onClick={() => handleUnfeature(product)}
                                >
                                  <StarOff className="mr-2 h-4 w-4" />
                                  Remove Featured
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem
                                  onClick={() => handleFeature(product)}
                                >
                                  <Star className="mr-2 h-4 w-4" />
                                  Feature Product
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              {product.isDeactivated ? (
                                <DropdownMenuItem
                                  onClick={() => handleReactivate(product)}
                                >
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  Reactivate
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() =>
                                    setDeactivateDialog({
                                      open: true,
                                      product,
                                    })
                                  }
                                >
                                  <Ban className="mr-2 h-4 w-4" />
                                  Deactivate
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                    {data?.products.length === 0 && (
                      <tr>
                        <td
                          colSpan={7}
                          className="py-8 text-center text-muted-foreground"
                        >
                          No products found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {data && data.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    Showing {(data.page - 1) * data.limit + 1} to{' '}
                    {Math.min(data.page * data.limit, data.total)} of{' '}
                    {data.total}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={data.page <= 1}
                      onClick={() =>
                        setParams((prev) => ({ ...prev, page: prev.page! - 1 }))
                      }
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={data.page >= data.totalPages}
                      onClick={() =>
                        setParams((prev) => ({ ...prev, page: prev.page! + 1 }))
                      }
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Deactivate Dialog */}
      <Dialog
        open={deactivateDialog.open}
        onOpenChange={(open) =>
          !open && setDeactivateDialog({ open: false, product: null })
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deactivate Product</DialogTitle>
            <DialogDescription>
              Are you sure you want to deactivate "{deactivateDialog.product?.name}
              "? The product will be hidden from all users until reactivated.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="reason">Deactivation Reason</Label>
              <Textarea
                id="reason"
                value={deactivateReason}
                onChange={(e) => setDeactivateReason(e.target.value)}
                placeholder="Enter the reason for deactivation (min 10 characters)..."
                className="mt-2"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeactivateDialog({ open: false, product: null })}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeactivate}
              disabled={
                deactivateReason.trim().length < 10 ||
                deactivateMutation.isPending
              }
            >
              {deactivateMutation.isPending ? 'Deactivating...' : 'Deactivate'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
