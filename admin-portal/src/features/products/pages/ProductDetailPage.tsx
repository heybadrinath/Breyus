import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import {
  ArrowLeft,
  Star,
  StarOff,
  Ban,
  CheckCircle,
  Package,
  Tag,
  Calendar,
  User,
  FileText,
  Image,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import {
  useProduct,
  useDeactivateProduct,
  useReactivateProduct,
  useFeatureProduct,
  useUnfeatureProduct,
} from '../hooks/useAdminProducts'

function formatDate(dateStr: string) {
  try {
    return format(new Date(dateStr), 'MMM d, yyyy HH:mm')
  } catch {
    return dateStr
  }
}

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()

  // Dialog state
  const [deactivateDialog, setDeactivateDialog] = useState(false)
  const [deactivateReason, setDeactivateReason] = useState('')

  // Query and mutations
  const { data: product, isLoading, error } = useProduct(id || '')
  const deactivateMutation = useDeactivateProduct()
  const reactivateMutation = useReactivateProduct()
  const featureMutation = useFeatureProduct()
  const unfeatureMutation = useUnfeatureProduct()

  const handleDeactivate = async () => {
    if (!product || !deactivateReason.trim()) return

    try {
      await deactivateMutation.mutateAsync({
        productId: product._id,
        data: { reason: deactivateReason },
      })
      toast({
        title: 'Product deactivated',
        description: 'The product has been deactivated successfully.',
      })
      setDeactivateDialog(false)
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

  const handleReactivate = async () => {
    if (!product) return

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

  const handleFeature = async () => {
    if (!product) return

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

  const handleUnfeature = async () => {
    if (!product) return

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-destructive">Failed to load product</p>
        <Button variant="outline" onClick={() => navigate('/products')}>
          Back to Products
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/products')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              {product.name}
            </h1>
            <p className="text-muted-foreground">SKU: {product.sku}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {product.isFeatured ? (
            <Button
              variant="outline"
              onClick={handleUnfeature}
              disabled={unfeatureMutation.isPending}
            >
              <StarOff className="mr-2 h-4 w-4" />
              Remove Featured
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={handleFeature}
              disabled={featureMutation.isPending}
            >
              <Star className="mr-2 h-4 w-4" />
              Feature
            </Button>
          )}
          {product.isDeactivated ? (
            <Button
              onClick={handleReactivate}
              disabled={reactivateMutation.isPending}
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Reactivate
            </Button>
          ) : (
            <Button
              variant="destructive"
              onClick={() => setDeactivateDialog(true)}
            >
              <Ban className="mr-2 h-4 w-4" />
              Deactivate
            </Button>
          )}
        </div>
      </div>

      {/* Status Banners */}
      {product.isDeactivated && (
        <div className="bg-destructive/10 border border-destructive rounded-lg p-4">
          <div className="flex items-center gap-2 text-destructive font-medium">
            <Ban className="h-5 w-5" />
            Product Deactivated
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Deactivated on {formatDate(product.deactivatedAt!)} - Reason:{' '}
            {product.deactivationReason}
          </p>
        </div>
      )}

      {product.isFeatured && (
        <div className="bg-yellow-500/10 border border-yellow-500 rounded-lg p-4">
          <div className="flex items-center gap-2 text-yellow-600 font-medium">
            <Star className="h-5 w-5" />
            Featured Product
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Featured on {formatDate(product.featuredAt!)}
          </p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Product Images */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Image className="h-5 w-5" />
                Product Images
              </CardTitle>
            </CardHeader>
            <CardContent>
              {product.productImages && product.productImages.length > 0 ? (
                <div className="grid grid-cols-3 gap-4">
                  {product.productImages.map((img, index) => (
                    <img
                      key={index}
                      src={img}
                      alt={`${product.name} ${index + 1}`}
                      className="rounded-lg object-cover h-32 w-full"
                    />
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-32 bg-muted rounded-lg">
                  <p className="text-muted-foreground">No images uploaded</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tabs */}
          <Tabs defaultValue="details">
            <TabsList>
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="trade">Trade Terms</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Product Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">
                      Description
                    </h4>
                    <p className="mt-1">{product.description}</p>
                  </div>
                  <Separator />
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">
                      Detailed Description
                    </h4>
                    <p className="mt-1">{product.detailedDescription}</p>
                  </div>
                  {product.application && (
                    <>
                      <Separator />
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground">
                          Application
                        </h4>
                        <p className="mt-1">{product.application}</p>
                      </div>
                    </>
                  )}
                  {product.qualityAssurance && (
                    <>
                      <Separator />
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground">
                          Quality Assurance
                        </h4>
                        <p className="mt-1">{product.qualityAssurance}</p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="trade" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Trade Terms</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    {product.exportLocation && (
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground">
                          Export Location
                        </h4>
                        <p className="mt-1">{product.exportLocation}</p>
                      </div>
                    )}
                    {product.nearestPort && (
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground">
                          Nearest Port
                        </h4>
                        <p className="mt-1">{product.nearestPort}</p>
                      </div>
                    )}
                    {product.selectedIncoterm && (
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground">
                          Incoterm
                        </h4>
                        <p className="mt-1">
                          <Badge>{product.selectedIncoterm}</Badge>
                        </p>
                      </div>
                    )}
                    {product.paymentTerms && (
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground">
                          Payment Terms
                        </h4>
                        <p className="mt-1">{product.paymentTerms}</p>
                      </div>
                    )}
                    {product.logisticsTerms && (
                      <div className="col-span-2">
                        <h4 className="text-sm font-medium text-muted-foreground">
                          Logistics Terms
                        </h4>
                        <p className="mt-1">{product.logisticsTerms}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="documents" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Test Reports
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {product.testReports && product.testReports.length > 0 ? (
                    <ul className="space-y-2">
                      {product.testReports.map((report, index) => (
                        <li key={index}>
                          <a
                            href={report}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline flex items-center gap-2"
                          >
                            <FileText className="h-4 w-4" />
                            Test Report {index + 1}
                          </a>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-muted-foreground">No test reports uploaded</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Info */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Category:</span>
                <Badge variant="outline">{product.category}</Badge>
              </div>
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">HSN Code:</span>
                <span>{product.hsnCode}</span>
              </div>
              <Separator />
              <div>
                <span className="text-sm text-muted-foreground">Price:</span>
                <p className="text-xl font-bold">
                  {product.currency} {product.price}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-muted-foreground">Stock:</span>
                  <p className="font-medium">
                    {product.stock} {product.stockUnit}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">MOQ:</span>
                  <p className="font-medium">
                    {product.moq} {product.moqUnit}
                  </p>
                </div>
              </div>
              {product.onSale && (
                <>
                  <Separator />
                  <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                    <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                      On Sale
                    </p>
                    {product.salePrice && (
                      <p className="text-lg font-bold text-green-600 dark:text-green-400">
                        {product.currency} {product.salePrice}
                      </p>
                    )}
                    {product.discount && (
                      <p className="text-sm text-muted-foreground">
                        {product.discount}% off
                      </p>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Tags */}
          {product.tags && product.tags.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Tags</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {product.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle>Metadata</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Seller ID:</span>
                <span className="font-mono text-xs">{product.userId}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Created:</span>
                <span>{formatDate(product.createdAt)}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Updated:</span>
                <span>{formatDate(product.updatedAt)}</span>
              </div>
              {product.isNicheCommodity && (
                <div className="mt-2">
                  <Badge variant="secondary">Niche Commodity</Badge>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Deactivate Dialog */}
      <Dialog open={deactivateDialog} onOpenChange={setDeactivateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deactivate Product</DialogTitle>
            <DialogDescription>
              Are you sure you want to deactivate "{product.name}"? The product
              will be hidden from all users until reactivated.
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
              onClick={() => setDeactivateDialog(false)}
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
