import { useState, useCallback } from 'react'
import {
  FileCode,
  Search,
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Loader2,
  Upload,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react'
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/hooks/use-toast'
import {
  useHSNCodes,
  useHSNStats,
  useHSNCategories,
  useCreateHSNCode,
  useUpdateHSNCode,
  useDeleteHSNCode,
  useBulkImportHSNCodes,
} from '../hooks/useHSNCodes'
import type { HSNCode, HSNCodesQueryParams, CreateHSNCodeDto, UpdateHSNCodeDto, BulkImportResult } from '../types'

type FormMode = 'create' | 'edit'

interface HSNFormData {
  code: string
  description: string
  category: string
}

const defaultFormData: HSNFormData = {
  code: '',
  description: '',
  category: '',
}

export function HSNCodesPage() {
  const { toast } = useToast()
  const [params, setParams] = useState<HSNCodesQueryParams>({ page: 1, limit: 50 })
  const [searchInput, setSearchInput] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [formMode, setFormMode] = useState<FormMode>('create')
  const [formData, setFormData] = useState<HSNFormData>(defaultFormData)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedHSN, setSelectedHSN] = useState<HSNCode | null>(null)

  // Import modal state
  const [importOpen, setImportOpen] = useState(false)
  const [csvText, setCsvText] = useState('')
  const [skipDuplicates, setSkipDuplicates] = useState(true)
  const [importResult, setImportResult] = useState<BulkImportResult | null>(null)

  const { data, isLoading, error } = useHSNCodes(params)
  const { data: stats } = useHSNStats()
  const { data: categories } = useHSNCategories()
  const createHSN = useCreateHSNCode()
  const updateHSN = useUpdateHSNCode()
  const deleteHSN = useDeleteHSNCode()
  const bulkImport = useBulkImportHSNCodes()

  const handleSearch = () => {
    setParams((prev) => ({ ...prev, search: searchInput || undefined, page: 1 }))
  }

  const handleFilterChange = (key: keyof HSNCodesQueryParams, value: string) => {
    if (key === 'category') {
      setParams((prev) => ({
        ...prev,
        category: value === 'all' ? undefined : value,
        page: 1,
      }))
    }
  }

  const openCreateForm = () => {
    setFormMode('create')
    setFormData(defaultFormData)
    setEditingId(null)
    setFormOpen(true)
  }

  const openEditForm = (hsn: HSNCode) => {
    setFormMode('edit')
    setFormData({
      code: hsn.code,
      description: hsn.description,
      category: hsn.category || '',
    })
    setEditingId(hsn._id)
    setFormOpen(true)
  }

  const handleFormSubmit = async () => {
    try {
      if (formMode === 'create') {
        const dto: CreateHSNCodeDto = {
          code: formData.code.trim(),
          description: formData.description.trim(),
          category: formData.category.trim() || undefined,
        }
        await createHSN.mutateAsync(dto)
        toast({ title: 'HSN code created successfully' })
      } else if (editingId) {
        const dto: UpdateHSNCodeDto = {
          description: formData.description.trim(),
          category: formData.category.trim() || undefined,
        }
        await updateHSN.mutateAsync({ hsnId: editingId, data: dto })
        toast({ title: 'HSN code updated successfully' })
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

  const handleDelete = async () => {
    if (!selectedHSN) return
    try {
      await deleteHSN.mutateAsync(selectedHSN._id)
      toast({ title: 'HSN code deleted successfully' })
      setDeleteDialogOpen(false)
      setSelectedHSN(null)
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.response?.data?.message || err.message || 'Failed to delete HSN code',
        variant: 'destructive',
      })
    }
  }

  // Parse CSV and import
  const parseCSV = useCallback((text: string): Array<{ code: string; description: string; category?: string }> => {
    const lines = text.split('\n').filter(line => line.trim())
    const result: Array<{ code: string; description: string; category?: string }> = []

    // Try to detect if first line is header
    const firstLine = lines[0]?.toLowerCase() || ''
    const hasHeader = firstLine.includes('code') || firstLine.includes('hsn') || firstLine.includes('description')
    const startIndex = hasHeader ? 1 : 0

    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue

      // Support both comma and tab delimited
      const parts = line.includes('\t') ? line.split('\t') : line.split(',')

      if (parts.length >= 2) {
        result.push({
          code: parts[0]?.trim().replace(/"/g, '') || '',
          description: parts[1]?.trim().replace(/"/g, '') || '',
          category: parts[2]?.trim().replace(/"/g, '') || undefined,
        })
      }
    }

    return result
  }, [])

  const handleImport = async () => {
    const parsed = parseCSV(csvText)

    if (parsed.length === 0) {
      toast({
        title: 'Error',
        description: 'No valid data found in CSV. Format: code,description,category (one per line)',
        variant: 'destructive',
      })
      return
    }

    try {
      const result = await bulkImport.mutateAsync({ data: parsed, skipDuplicates })
      if (!result.data) {
        throw new Error('No response data returned')
      }
      setImportResult(result.data)
      toast({
        title: 'Import completed',
        description: `${result.data.success} codes imported, ${result.data.failed} failed`,
      })
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.response?.data?.message || err.message || 'Import failed',
        variant: 'destructive',
      })
    }
  }

  const resetImport = () => {
    setCsvText('')
    setImportResult(null)
    setSkipDuplicates(true)
  }

  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">HSN Codes</h2>
          <p className="text-sm text-muted-foreground">
            {stats?.total || data?.total || 0} HSN codes in database
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => { setImportOpen(true); resetImport(); }}>
            <Upload className="h-4 w-4 mr-2" />
            Import CSV
          </Button>
          <Button onClick={openCreateForm}>
            <Plus className="h-4 w-4 mr-2" />
            Add HSN Code
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex-1 min-w-[200px] max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by code or description..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-9"
            />
          </div>
        </div>

        <Select
          value={params.category || 'all'}
          onValueChange={(value) => handleFilterChange('category', value)}
        >
          <SelectTrigger className="w-[200px]">
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

        <Button variant="outline" onClick={handleSearch}>
          Search
        </Button>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[150px]">HSN Code</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="w-[200px]">Category</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                  Failed to load HSN codes
                </TableCell>
              </TableRow>
            ) : data?.hsnCodes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-12">
                  <div className="space-y-2">
                    <FileCode className="h-12 w-12 mx-auto text-muted-foreground" />
                    <p className="text-muted-foreground">No HSN codes found</p>
                    <Button variant="outline" size="sm" onClick={() => { setImportOpen(true); resetImport(); }}>
                      <Upload className="h-4 w-4 mr-2" />
                      Import from CSV
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              data?.hsnCodes.map((hsn) => (
                <TableRow key={hsn._id}>
                  <TableCell>
                    <Badge variant="outline" className="font-mono text-base">
                      {hsn.code}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-[400px] truncate">
                    {hsn.description}
                  </TableCell>
                  <TableCell>
                    {hsn.category ? (
                      <Badge variant="secondary">{hsn.category}</Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditForm(hsn)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => {
                            setSelectedHSN(hsn)
                            setDeleteDialogOpen(true)
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {data && (data.totalPages ?? 1) > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {(() => {
              const page = data.page ?? params.page ?? 1
              const limit = data.limit ?? params.limit ?? 50
              const total = data.total ?? 0
              return (
                <>
                  Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} codes
                </>
              )
            })()}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={(data.page ?? params.page ?? 1) === 1}
              onClick={() => setParams((prev) => ({ ...prev, page: (prev.page || 1) - 1 }))}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={(data.page ?? params.page ?? 1) === (data.totalPages ?? 1)}
              onClick={() => setParams((prev) => ({ ...prev, page: (prev.page || 1) + 1 }))}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {formMode === 'create' ? 'Add HSN Code' : 'Edit HSN Code'}
            </DialogTitle>
            <DialogDescription>
              {formMode === 'create'
                ? 'Add a new HSN code to the database.'
                : 'Update HSN code details.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="code">HSN Code</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, code: e.target.value.replace(/\D/g, '') }))
                }
                placeholder="0101"
                maxLength={12}
                disabled={formMode === 'edit'}
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">
                Harmonized System code (digits only)
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Live horses, asses, mules and hinnies"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category (Optional)</Label>
              <Input
                id="category"
                value={formData.category}
                onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
                placeholder="Animals"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleFormSubmit}
              disabled={
                !formData.code ||
                !formData.description ||
                createHSN.isPending ||
                updateHSN.isPending
              }
            >
              {createHSN.isPending || updateHSN.isPending ? (
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
            <AlertDialogTitle>Delete HSN Code</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete HSN code{' '}
              <strong className="font-mono">{selectedHSN?.code}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteHSN.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Import Dialog */}
      <Dialog open={importOpen} onOpenChange={(open) => { setImportOpen(open); if (!open) resetImport(); }}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Import HSN Codes from CSV
            </DialogTitle>
            <DialogDescription>
              Paste CSV data with columns: code, description, category (optional)
            </DialogDescription>
          </DialogHeader>

          {!importResult ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>CSV Data</Label>
                <Textarea
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                  placeholder={`0101,Live horses,Animals\n0102,Live bovine animals,Animals\n0103,Live swine,Animals`}
                  rows={10}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  One code per line. Supports comma or tab-separated values. Header row is auto-detected.
                </p>
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="skip-duplicates">Skip existing codes</Label>
                <Switch
                  id="skip-duplicates"
                  checked={skipDuplicates}
                  onCheckedChange={setSkipDuplicates}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-lg border p-4 space-y-3">
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="font-medium">{importResult.success} codes imported successfully</span>
                </div>
                {importResult.failed > 0 && (
                  <div className="flex items-center gap-2 text-amber-600">
                    <AlertTriangle className="h-5 w-5" />
                    <span className="font-medium">{importResult.failed} failed</span>
                  </div>
                )}
              </div>

              {importResult.errors.length > 0 && (
                <div className="space-y-2">
                  <Label>Errors</Label>
                  <div className="max-h-[200px] overflow-y-auto rounded border bg-muted/50 p-2 text-sm font-mono">
                    {importResult.errors.slice(0, 20).map((err, i) => (
                      <div key={i} className="text-red-600">
                        Row {err.row}: {err.error}
                      </div>
                    ))}
                    {importResult.errors.length > 20 && (
                      <div className="text-muted-foreground mt-2">
                        ... and {importResult.errors.length - 20} more errors
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            {!importResult ? (
              <>
                <Button variant="outline" onClick={() => setImportOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={!csvText.trim() || bulkImport.isPending}
                >
                  {bulkImport.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Upload className="h-4 w-4 mr-2" />
                  )}
                  Import
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={resetImport}>
                  Import More
                </Button>
                <Button onClick={() => setImportOpen(false)}>
                  Done
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
