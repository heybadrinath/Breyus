import { useState } from 'react'
import {
  Coins,
  Search,
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Loader2,
  Check,
  X,
  Sparkles,
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
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/hooks/use-toast'
import {
  useCurrencies,
  useCreateCurrency,
  useUpdateCurrency,
  useDeleteCurrency,
  useSeedCurrencies,
} from '../hooks/useCurrencies'
import type { Currency, CurrenciesQueryParams, CreateCurrencyDto, UpdateCurrencyDto } from '../types'

type FormMode = 'create' | 'edit'

interface CurrencyFormData {
  code: string
  name: string
  symbol: string
  symbolPosition: 'before' | 'after'
  decimalPlaces: number
  isActive: boolean
}

const defaultFormData: CurrencyFormData = {
  code: '',
  name: '',
  symbol: '',
  symbolPosition: 'before',
  decimalPlaces: 2,
  isActive: true,
}

export function CurrenciesPage() {
  const { toast } = useToast()
  const [params, setParams] = useState<CurrenciesQueryParams>({})
  const [searchInput, setSearchInput] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [formMode, setFormMode] = useState<FormMode>('create')
  const [formData, setFormData] = useState<CurrencyFormData>(defaultFormData)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedCurrency, setSelectedCurrency] = useState<Currency | null>(null)

  const { data, isLoading, error } = useCurrencies(params)
  const createCurrency = useCreateCurrency()
  const updateCurrency = useUpdateCurrency()
  const deleteCurrency = useDeleteCurrency()
  const seedCurrencies = useSeedCurrencies()

  const handleSearch = () => {
    setParams((prev) => ({ ...prev, search: searchInput || undefined }))
  }

  const handleFilterChange = (key: keyof CurrenciesQueryParams, value: string) => {
    setParams((prev) => ({
      ...prev,
      [key]: value === 'all' ? undefined : value === 'true',
    }))
  }

  const openCreateForm = () => {
    setFormMode('create')
    setFormData(defaultFormData)
    setEditingId(null)
    setFormOpen(true)
  }

  const openEditForm = (currency: Currency) => {
    setFormMode('edit')
    setFormData({
      code: currency.code,
      name: currency.name,
      symbol: currency.symbol,
      symbolPosition: currency.symbolPosition,
      decimalPlaces: currency.decimalPlaces,
      isActive: currency.isActive,
    })
    setEditingId(currency._id)
    setFormOpen(true)
  }

  const handleFormSubmit = async () => {
    try {
      if (formMode === 'create') {
        const dto: CreateCurrencyDto = {
          code: formData.code.toUpperCase(),
          name: formData.name,
          symbol: formData.symbol,
          symbolPosition: formData.symbolPosition,
          decimalPlaces: formData.decimalPlaces,
          isActive: formData.isActive,
        }
        await createCurrency.mutateAsync(dto)
        toast({ title: 'Currency created successfully' })
      } else if (editingId) {
        const dto: UpdateCurrencyDto = {
          name: formData.name,
          symbol: formData.symbol,
          symbolPosition: formData.symbolPosition,
          decimalPlaces: formData.decimalPlaces,
          isActive: formData.isActive,
        }
        await updateCurrency.mutateAsync({ currencyId: editingId, data: dto })
        toast({ title: 'Currency updated successfully' })
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
    if (!selectedCurrency) return
    try {
      await deleteCurrency.mutateAsync(selectedCurrency._id)
      toast({ title: 'Currency deleted successfully' })
      setDeleteDialogOpen(false)
      setSelectedCurrency(null)
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.response?.data?.message || err.message || 'Failed to delete currency',
        variant: 'destructive',
      })
    }
  }

  const handleSeed = async () => {
    try {
      const result = await seedCurrencies.mutateAsync()
      if (!result.data) {
        throw new Error('No response data returned')
      }
      toast({
        title: 'Currencies seeded',
        description: `Created ${result.data.created}, skipped ${result.data.skipped} (already exist)`,
      })
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.response?.data?.message || err.message || 'Failed to seed currencies',
        variant: 'destructive',
      })
    }
  }

  const formatCurrencyPreview = (currency: Currency | CurrencyFormData) => {
    const amount = '1,234.56'.slice(0, -3 + (currency.decimalPlaces || 2))
    if (currency.symbolPosition === 'before') {
      return `${currency.symbol}${amount}`
    }
    return `${amount} ${currency.symbol}`
  }

  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Currencies</h2>
          <p className="text-sm text-muted-foreground">
            {data?.total || 0} currencies configured
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleSeed} disabled={seedCurrencies.isPending}>
            {seedCurrencies.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 mr-2" />
            )}
            Seed Defaults
          </Button>
          <Button onClick={openCreateForm}>
            <Plus className="h-4 w-4 mr-2" />
            Add Currency
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex-1 min-w-[200px] max-w-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by code or name..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-9"
            />
          </div>
        </div>

        <Select
          value={params.isActive === true ? 'true' : params.isActive === false ? 'false' : 'all'}
          onValueChange={(value) => handleFilterChange('isActive', value)}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="true">Active</SelectItem>
            <SelectItem value="false">Inactive</SelectItem>
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
              <TableHead>Currency</TableHead>
              <TableHead>Symbol</TableHead>
              <TableHead>Position</TableHead>
              <TableHead>Decimals</TableHead>
              <TableHead>Preview</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                  Failed to load currencies
                </TableCell>
              </TableRow>
            ) : data?.currencies.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12">
                  <div className="space-y-2">
                    <Coins className="h-12 w-12 mx-auto text-muted-foreground" />
                    <p className="text-muted-foreground">No currencies found</p>
                    <Button variant="outline" size="sm" onClick={handleSeed}>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Seed Default Currencies
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              data?.currencies.map((currency) => (
                <TableRow key={currency._id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center font-mono font-bold text-primary">
                        {currency.code.slice(0, 2)}
                      </div>
                      <div>
                        <div className="font-medium">{currency.code}</div>
                        <div className="text-sm text-muted-foreground">{currency.name}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-lg">{currency.symbol}</span>
                  </TableCell>
                  <TableCell className="capitalize">{currency.symbolPosition}</TableCell>
                  <TableCell>{currency.decimalPlaces}</TableCell>
                  <TableCell>
                    <span className="font-mono text-muted-foreground">
                      {formatCurrencyPreview(currency)}
                    </span>
                  </TableCell>
                  <TableCell>
                    {currency.isActive ? (
                      <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                        <Check className="h-3 w-3 mr-1" />
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        <X className="h-3 w-3 mr-1" />
                        Inactive
                      </Badge>
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
                        <DropdownMenuItem onClick={() => openEditForm(currency)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => {
                            setSelectedCurrency(currency)
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

      {/* Create/Edit Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {formMode === 'create' ? 'Add Currency' : 'Edit Currency'}
            </DialogTitle>
            <DialogDescription>
              {formMode === 'create'
                ? 'Add a new currency to the system.'
                : 'Update currency details.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="code" className="text-right">
                Code
              </Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))
                }
                placeholder="USD"
                maxLength={3}
                disabled={formMode === 'edit'}
                className="col-span-3 font-mono uppercase"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="US Dollar"
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="symbol" className="text-right">
                Symbol
              </Label>
              <Input
                id="symbol"
                value={formData.symbol}
                onChange={(e) => setFormData((prev) => ({ ...prev, symbol: e.target.value }))}
                placeholder="$"
                maxLength={10}
                className="col-span-3 font-mono"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="position" className="text-right">
                Position
              </Label>
              <Select
                value={formData.symbolPosition}
                onValueChange={(value: 'before' | 'after') =>
                  setFormData((prev) => ({ ...prev, symbolPosition: value }))
                }
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="before">Before amount ($100)</SelectItem>
                  <SelectItem value="after">After amount (100 $)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="decimals" className="text-right">
                Decimals
              </Label>
              <Select
                value={formData.decimalPlaces.toString()}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, decimalPlaces: parseInt(value) }))
                }
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">0 (JPY: 100)</SelectItem>
                  <SelectItem value="2">2 (USD: 100.00)</SelectItem>
                  <SelectItem value="3">3 (KWD: 100.000)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="active" className="text-right">
                Active
              </Label>
              <div className="col-span-3 flex items-center gap-2">
                <Switch
                  id="active"
                  checked={formData.isActive}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, isActive: checked }))
                  }
                />
                <span className="text-sm text-muted-foreground">
                  {formData.isActive ? 'Visible in dropdowns' : 'Hidden from users'}
                </span>
              </div>
            </div>
            {/* Preview */}
            <div className="grid grid-cols-4 items-center gap-4 pt-2 border-t">
              <Label className="text-right text-muted-foreground">Preview</Label>
              <div className="col-span-3 font-mono text-lg">
                {formatCurrencyPreview(formData) || '—'}
              </div>
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
                !formData.name ||
                !formData.symbol ||
                createCurrency.isPending ||
                updateCurrency.isPending
              }
            >
              {createCurrency.isPending || updateCurrency.isPending ? (
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
            <AlertDialogTitle>Delete Currency</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{' '}
              <strong>
                {selectedCurrency?.code} ({selectedCurrency?.name})
              </strong>
              ? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteCurrency.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
