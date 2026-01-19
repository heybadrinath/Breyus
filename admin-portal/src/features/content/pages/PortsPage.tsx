import { useState } from 'react'
import {
  Ship,
  Plane,
  Truck,
  Search,
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Loader2,
  Check,
  X,
  Sparkles,
  ChevronLeft,
  ChevronRight,
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
  usePorts,
  useCreatePort,
  useUpdatePort,
  useDeletePort,
  useSeedPorts,
} from '../hooks/usePorts'
import { useCountries } from '../hooks/useCountries'
import type { Port, PortsQueryParams, CreatePortDto, UpdatePortDto, PortType, Country } from '../types'

type FormMode = 'create' | 'edit'

const PORT_TYPES: { value: PortType; label: string; icon: typeof Ship }[] = [
  { value: 'sea', label: 'Sea Port', icon: Ship },
  { value: 'air', label: 'Airport', icon: Plane },
  { value: 'land', label: 'Land Port', icon: Truck },
]

interface PortFormData {
  name: string
  code: string
  country: string
  type: PortType
  city: string
  isActive: boolean
}

const defaultFormData: PortFormData = {
  name: '',
  code: '',
  country: '',
  type: 'sea',
  city: '',
  isActive: true,
}

function getPortIcon(type: PortType) {
  switch (type) {
    case 'sea':
      return Ship
    case 'air':
      return Plane
    case 'land':
      return Truck
    default:
      return Ship
  }
}

export function PortsPage() {
  const { toast } = useToast()
  const [params, setParams] = useState<PortsQueryParams>({ page: 1, limit: 20 })
  const [searchInput, setSearchInput] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [formMode, setFormMode] = useState<FormMode>('create')
  const [formData, setFormData] = useState<PortFormData>(defaultFormData)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedPort, setSelectedPort] = useState<Port | null>(null)

  const { data, isLoading, error } = usePorts(params)
  const { data: countriesData } = useCountries({ isActive: true })
  const createPort = useCreatePort()
  const updatePort = useUpdatePort()
  const deletePort = useDeletePort()
  const seedPorts = useSeedPorts()

  const handleSearch = () => {
    setParams((prev) => ({ ...prev, search: searchInput || undefined, page: 1 }))
  }

  const handleFilterChange = (key: keyof PortsQueryParams, value: string) => {
    if (key === 'type') {
      setParams((prev) => ({
        ...prev,
        type: value === 'all' ? undefined : (value as PortType),
        page: 1,
      }))
    } else if (key === 'country') {
      setParams((prev) => ({
        ...prev,
        country: value === 'all' ? undefined : value,
        page: 1,
      }))
    } else if (key === 'isActive') {
      setParams((prev) => ({
        ...prev,
        isActive: value === 'all' ? undefined : value === 'true',
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

  const openEditForm = (port: Port) => {
    setFormMode('edit')
    const countryId = typeof port.country === 'string' ? port.country : (port.country as Country)._id
    setFormData({
      name: port.name,
      code: port.code,
      country: countryId,
      type: port.type,
      city: port.city || '',
      isActive: port.isActive,
    })
    setEditingId(port._id)
    setFormOpen(true)
  }

  const handleFormSubmit = async () => {
    try {
      if (formMode === 'create') {
        const dto: CreatePortDto = {
          name: formData.name,
          code: formData.code.toUpperCase(),
          country: formData.country,
          type: formData.type,
          city: formData.city || undefined,
          isActive: formData.isActive,
        }
        await createPort.mutateAsync(dto)
        toast({ title: 'Port created successfully' })
      } else if (editingId) {
        const dto: UpdatePortDto = {
          name: formData.name,
          code: formData.code.toUpperCase(),
          country: formData.country,
          type: formData.type,
          city: formData.city || undefined,
          isActive: formData.isActive,
        }
        await updatePort.mutateAsync({ portId: editingId, data: dto })
        toast({ title: 'Port updated successfully' })
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
    if (!selectedPort) return
    try {
      await deletePort.mutateAsync(selectedPort._id)
      toast({ title: 'Port deleted successfully' })
      setDeleteDialogOpen(false)
      setSelectedPort(null)
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.response?.data?.message || err.message || 'Failed to delete port',
        variant: 'destructive',
      })
    }
  }

  const handleSeed = async () => {
    try {
      const result = await seedPorts.mutateAsync()
      if (!result.data) {
        throw new Error('No response data returned')
      }
      toast({
        title: 'Ports seeded',
        description: `Created ${result.data.created}, skipped ${result.data.skipped} (already exist or country missing)`,
      })
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.response?.data?.message || err.message || 'Failed to seed ports',
        variant: 'destructive',
      })
    }
  }

  const getCountryDisplay = (port: Port) => {
    if (typeof port.country === 'string') {
      return port.country
    }
    const country = port.country as Country
    return (
      <span className="flex items-center gap-1.5">
        <span>{country.flagEmoji || '🏳️'}</span>
        <span>{country.name}</span>
      </span>
    )
  }

  const page = data?.page ?? params.page ?? 1
  const limit = data?.limit ?? params.limit ?? 20
  const total = data?.total ?? 0
  const totalPages = data?.totalPages ?? 1

  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Ports</h2>
          <p className="text-sm text-muted-foreground">
            {data?.total || 0} ports configured
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleSeed} disabled={seedPorts.isPending}>
            {seedPorts.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 mr-2" />
            )}
            Seed Defaults
          </Button>
          <Button onClick={openCreateForm}>
            <Plus className="h-4 w-4 mr-2" />
            Add Port
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex-1 min-w-[200px] max-w-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by code, name, or city..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-9"
            />
          </div>
        </div>

        <Select
          value={params.country || 'all'}
          onValueChange={(value) => handleFilterChange('country', value)}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Country" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Countries</SelectItem>
            {countriesData?.countries.map((country) => (
              <SelectItem key={country._id} value={country._id}>
                {country.flagEmoji} {country.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={params.type || 'all'}
          onValueChange={(value) => handleFilterChange('type', value)}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {PORT_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
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
              <TableHead>Port</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Country</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                  Failed to load ports
                </TableCell>
              </TableRow>
            ) : data?.ports.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12">
                  <div className="space-y-2">
                    <Ship className="h-12 w-12 mx-auto text-muted-foreground" />
                    <p className="text-muted-foreground">No ports found</p>
                    <p className="text-sm text-muted-foreground">
                      Seed countries first, then seed ports
                    </p>
                    <Button variant="outline" size="sm" onClick={handleSeed}>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Seed Default Ports
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              data?.ports.map((port) => {
                const PortIcon = getPortIcon(port.type)
                return (
                  <TableRow key={port._id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                          <PortIcon className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium">{port.name}</div>
                          {port.city && (
                            <div className="text-sm text-muted-foreground">{port.city}</div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono">
                        {port.code}
                      </Badge>
                    </TableCell>
                    <TableCell>{getCountryDisplay(port)}</TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={
                          port.type === 'sea'
                            ? 'bg-blue-100 text-blue-800'
                            : port.type === 'air'
                            ? 'bg-sky-100 text-sky-800'
                            : 'bg-amber-100 text-amber-800'
                        }
                      >
                        {port.type === 'sea' ? 'Sea' : port.type === 'air' ? 'Air' : 'Land'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {port.isActive ? (
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
                          <DropdownMenuItem onClick={() => openEditForm(port)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => {
                              setSelectedPort(port)
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

      {/* Pagination */}
      {data && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} ports
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setParams((prev) => ({ ...prev, page: (prev.page || 1) - 1 }))}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page === totalPages}
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
            <DialogTitle>{formMode === 'create' ? 'Add Port' : 'Edit Port'}</DialogTitle>
            <DialogDescription>
              {formMode === 'create'
                ? 'Add a new port to the system.'
                : 'Update port details.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Port Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Port of Los Angeles"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="code">UN/LOCODE</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))
                  }
                  placeholder="USLAX"
                  maxLength={10}
                  className="font-mono uppercase"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Select
                  value={formData.country}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, country: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    {countriesData?.countries.map((country) => (
                      <SelectItem key={country._id} value={country._id}>
                        {country.flagEmoji} {country.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Port Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: PortType) =>
                    setFormData((prev) => ({ ...prev, type: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PORT_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">City (Optional)</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => setFormData((prev) => ({ ...prev, city: e.target.value }))}
                placeholder="Los Angeles"
              />
            </div>
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleFormSubmit}
              disabled={
                !formData.name ||
                !formData.code ||
                !formData.country ||
                createPort.isPending ||
                updatePort.isPending
              }
            >
              {createPort.isPending || updatePort.isPending ? (
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
            <AlertDialogTitle>Delete Port</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{' '}
              <strong>{selectedPort?.name}</strong> ({selectedPort?.code})?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              {deletePort.isPending ? (
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
