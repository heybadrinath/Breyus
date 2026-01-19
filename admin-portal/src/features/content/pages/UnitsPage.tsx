import { useState } from 'react'
import {
  Ruler,
  Search,
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Loader2,
  Check,
  X,
  Sparkles,
  Scale,
  Droplet,
  Hash,
  MoveHorizontal,
  Square,
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
  useUnits,
  useCreateUnit,
  useUpdateUnit,
  useDeleteUnit,
  useSeedUnits,
} from '../hooks/useUnits'
import type {
  Unit,
  UnitsQueryParams,
  CreateUnitDto,
  UpdateUnitDto,
  UnitType,
} from '../types'
import { UNIT_TYPES } from '../types'

type FormMode = 'create' | 'edit'

interface UnitFormData {
  code: string
  name: string
  pluralName: string
  symbol: string
  type: UnitType
  baseUnit: string
  conversionFactor: string
  isActive: boolean
}

const defaultFormData: UnitFormData = {
  code: '',
  name: '',
  pluralName: '',
  symbol: '',
  type: 'weight',
  baseUnit: '',
  conversionFactor: '',
  isActive: true,
}

const typeIcons: Record<UnitType, typeof Scale> = {
  weight: Scale,
  volume: Droplet,
  count: Hash,
  length: MoveHorizontal,
  area: Square,
}

const typeLabels: Record<UnitType, string> = {
  weight: 'Weight',
  volume: 'Volume',
  count: 'Count',
  length: 'Length',
  area: 'Area',
}

export function UnitsPage() {
  const { toast } = useToast()
  const [params, setParams] = useState<UnitsQueryParams>({})
  const [searchInput, setSearchInput] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [formMode, setFormMode] = useState<FormMode>('create')
  const [formData, setFormData] = useState<UnitFormData>(defaultFormData)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null)

  const { data, isLoading, error } = useUnits(params)
  const createUnit = useCreateUnit()
  const updateUnit = useUpdateUnit()
  const deleteUnit = useDeleteUnit()
  const seedUnits = useSeedUnits()

  const handleSearch = () => {
    setParams((prev) => ({ ...prev, search: searchInput || undefined }))
  }

  const handleFilterChange = (key: keyof UnitsQueryParams, value: string) => {
    if (key === 'isActive') {
      setParams((prev) => ({
        ...prev,
        [key]: value === 'all' ? undefined : value === 'true',
      }))
    } else if (key === 'type') {
      setParams((prev) => ({
        ...prev,
        [key]: value === 'all' ? undefined : (value as UnitType),
      }))
    }
  }

  const openCreateForm = () => {
    setFormMode('create')
    setFormData(defaultFormData)
    setEditingId(null)
    setFormOpen(true)
  }

  const openEditForm = (unit: Unit) => {
    setFormMode('edit')
    setFormData({
      code: unit.code,
      name: unit.name,
      pluralName: unit.pluralName,
      symbol: unit.symbol,
      type: unit.type,
      baseUnit: unit.baseUnit || '',
      conversionFactor: unit.conversionFactor?.toString() || '',
      isActive: unit.isActive,
    })
    setEditingId(unit._id)
    setFormOpen(true)
  }

  const handleFormSubmit = async () => {
    try {
      if (formMode === 'create') {
        const dto: CreateUnitDto = {
          code: formData.code.toUpperCase(),
          name: formData.name,
          pluralName: formData.pluralName,
          symbol: formData.symbol,
          type: formData.type,
          baseUnit: formData.baseUnit || undefined,
          conversionFactor: formData.conversionFactor
            ? parseFloat(formData.conversionFactor)
            : undefined,
          isActive: formData.isActive,
        }
        await createUnit.mutateAsync(dto)
        toast({ title: 'Unit created successfully' })
      } else if (editingId) {
        const dto: UpdateUnitDto = {
          name: formData.name,
          pluralName: formData.pluralName,
          symbol: formData.symbol,
          type: formData.type,
          baseUnit: formData.baseUnit || undefined,
          conversionFactor: formData.conversionFactor
            ? parseFloat(formData.conversionFactor)
            : undefined,
          isActive: formData.isActive,
        }
        await updateUnit.mutateAsync({ unitId: editingId, data: dto })
        toast({ title: 'Unit updated successfully' })
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
    if (!selectedUnit) return
    try {
      await deleteUnit.mutateAsync(selectedUnit._id)
      toast({ title: 'Unit deleted successfully' })
      setDeleteDialogOpen(false)
      setSelectedUnit(null)
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.response?.data?.message || err.message || 'Failed to delete unit',
        variant: 'destructive',
      })
    }
  }

  const handleSeed = async () => {
    try {
      const result = await seedUnits.mutateAsync()
      if (!result.data) {
        throw new Error('No response data returned')
      }
      toast({
        title: 'Units seeded',
        description: `Created ${result.data.created}, skipped ${result.data.skipped} (already exist)`,
      })
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.response?.data?.message || err.message || 'Failed to seed units',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Units of Measurement</h2>
          <p className="text-sm text-muted-foreground">
            {data?.total || 0} units configured
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleSeed} disabled={seedUnits.isPending}>
            {seedUnits.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 mr-2" />
            )}
            Seed Defaults
          </Button>
          <Button onClick={openCreateForm}>
            <Plus className="h-4 w-4 mr-2" />
            Add Unit
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex-1 min-w-[200px] max-w-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by code, name, or symbol..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-9"
            />
          </div>
        </div>

        <Select
          value={params.type || 'all'}
          onValueChange={(value) => handleFilterChange('type', value)}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {UNIT_TYPES.map((type) => (
              <SelectItem key={type} value={type}>
                {typeLabels[type]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={params.isActive === true ? 'true' : params.isActive === false ? 'false' : 'all'}
          onValueChange={(value) => handleFilterChange('isActive', value)}
        >
          <SelectTrigger className="w-[130px]">
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
              <TableHead>Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Symbol</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Conversion</TableHead>
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
                  Failed to load units
                </TableCell>
              </TableRow>
            ) : data?.units.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12">
                  <div className="space-y-2">
                    <Ruler className="h-12 w-12 mx-auto text-muted-foreground" />
                    <p className="text-muted-foreground">No units found</p>
                    <Button variant="outline" size="sm" onClick={handleSeed}>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Seed Default Units
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              data?.units.map((unit) => {
                const TypeIcon = typeIcons[unit.type]
                return (
                  <TableRow key={unit._id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center font-mono font-bold text-primary text-sm">
                          {unit.code.slice(0, 3)}
                        </div>
                        <span className="font-mono font-medium">{unit.code}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{unit.name}</div>
                        <div className="text-sm text-muted-foreground">{unit.pluralName}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-lg">{unit.symbol}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="gap-1">
                        <TypeIcon className="h-3 w-3" />
                        {typeLabels[unit.type]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {unit.baseUnit && unit.conversionFactor ? (
                        <span className="text-sm text-muted-foreground font-mono">
                          1 {unit.code} = {unit.conversionFactor} {unit.baseUnit}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">Base unit</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {unit.isActive ? (
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
                          <DropdownMenuItem onClick={() => openEditForm(unit)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => {
                              setSelectedUnit(unit)
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
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>{formMode === 'create' ? 'Add Unit' : 'Edit Unit'}</DialogTitle>
            <DialogDescription>
              {formMode === 'create'
                ? 'Add a new unit of measurement.'
                : 'Update unit details.'}
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
                placeholder="KG"
                maxLength={10}
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
                placeholder="Kilogram"
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="pluralName" className="text-right">
                Plural
              </Label>
              <Input
                id="pluralName"
                value={formData.pluralName}
                onChange={(e) => setFormData((prev) => ({ ...prev, pluralName: e.target.value }))}
                placeholder="Kilograms"
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
                placeholder="kg"
                maxLength={10}
                className="col-span-3 font-mono"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="type" className="text-right">
                Type
              </Label>
              <Select
                value={formData.type}
                onValueChange={(value: UnitType) =>
                  setFormData((prev) => ({ ...prev, type: value }))
                }
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UNIT_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {typeLabels[type]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="baseUnit" className="text-right">
                Base Unit
              </Label>
              <Input
                id="baseUnit"
                value={formData.baseUnit}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, baseUnit: e.target.value.toUpperCase() }))
                }
                placeholder="KG"
                maxLength={10}
                className="col-span-3 font-mono"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="conversionFactor" className="text-right">
                Factor
              </Label>
              <Input
                id="conversionFactor"
                type="number"
                step="any"
                value={formData.conversionFactor}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, conversionFactor: e.target.value }))
                }
                placeholder="0.001"
                className="col-span-3 font-mono"
              />
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
                !formData.pluralName ||
                !formData.symbol ||
                createUnit.isPending ||
                updateUnit.isPending
              }
            >
              {createUnit.isPending || updateUnit.isPending ? (
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
            <AlertDialogTitle>Delete Unit</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{' '}
              <strong>
                {selectedUnit?.code} ({selectedUnit?.name})
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
              {deleteUnit.isPending ? (
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
