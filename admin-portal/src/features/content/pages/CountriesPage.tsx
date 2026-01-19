import { useState } from 'react'
import {
  Globe,
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
  useCountries,
  useCreateCountry,
  useUpdateCountry,
  useDeleteCountry,
  useSeedCountries,
} from '../hooks/useCountries'
import type { Country, CountriesQueryParams, CreateCountryDto, UpdateCountryDto, Continent } from '../types'

type FormMode = 'create' | 'edit'

const CONTINENTS: Continent[] = [
  'Africa',
  'Asia',
  'Europe',
  'North America',
  'South America',
  'Oceania',
  'Antarctica',
]

interface CountryFormData {
  isoCode: string
  isoCode3: string
  name: string
  flagEmoji: string
  continent: Continent
  isActive: boolean
}

const defaultFormData: CountryFormData = {
  isoCode: '',
  isoCode3: '',
  name: '',
  flagEmoji: '',
  continent: 'Asia',
  isActive: true,
}

export function CountriesPage() {
  const { toast } = useToast()
  const [params, setParams] = useState<CountriesQueryParams>({})
  const [searchInput, setSearchInput] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [formMode, setFormMode] = useState<FormMode>('create')
  const [formData, setFormData] = useState<CountryFormData>(defaultFormData)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null)

  const { data, isLoading, error } = useCountries(params)
  const createCountry = useCreateCountry()
  const updateCountry = useUpdateCountry()
  const deleteCountry = useDeleteCountry()
  const seedCountries = useSeedCountries()

  const handleSearch = () => {
    setParams((prev) => ({ ...prev, search: searchInput || undefined }))
  }

  const handleFilterChange = (key: keyof CountriesQueryParams, value: string) => {
    if (key === 'continent') {
      setParams((prev) => ({
        ...prev,
        continent: value === 'all' ? undefined : (value as Continent),
      }))
    } else if (key === 'isActive') {
      setParams((prev) => ({
        ...prev,
        isActive: value === 'all' ? undefined : value === 'true',
      }))
    }
  }

  const openCreateForm = () => {
    setFormMode('create')
    setFormData(defaultFormData)
    setEditingId(null)
    setFormOpen(true)
  }

  const openEditForm = (country: Country) => {
    setFormMode('edit')
    setFormData({
      isoCode: country.isoCode,
      isoCode3: country.isoCode3,
      name: country.name,
      flagEmoji: country.flagEmoji || '',
      continent: country.continent,
      isActive: country.isActive,
    })
    setEditingId(country._id)
    setFormOpen(true)
  }

  const handleFormSubmit = async () => {
    try {
      if (formMode === 'create') {
        const dto: CreateCountryDto = {
          isoCode: formData.isoCode.toUpperCase(),
          isoCode3: formData.isoCode3.toUpperCase(),
          name: formData.name,
          flagEmoji: formData.flagEmoji || undefined,
          continent: formData.continent,
          isActive: formData.isActive,
        }
        await createCountry.mutateAsync(dto)
        toast({ title: 'Country created successfully' })
      } else if (editingId) {
        const dto: UpdateCountryDto = {
          name: formData.name,
          flagEmoji: formData.flagEmoji || undefined,
          continent: formData.continent,
          isActive: formData.isActive,
        }
        await updateCountry.mutateAsync({ countryId: editingId, data: dto })
        toast({ title: 'Country updated successfully' })
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
    if (!selectedCountry) return
    try {
      await deleteCountry.mutateAsync(selectedCountry._id)
      toast({ title: 'Country deleted successfully' })
      setDeleteDialogOpen(false)
      setSelectedCountry(null)
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.response?.data?.message || err.message || 'Failed to delete country',
        variant: 'destructive',
      })
    }
  }

  const handleSeed = async () => {
    try {
      const result = await seedCountries.mutateAsync()
      if (!result.data) {
        throw new Error('No response data returned')
      }
      toast({
        title: 'Countries seeded',
        description: `Created ${result.data.created}, skipped ${result.data.skipped} (already exist)`,
      })
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.response?.data?.message || err.message || 'Failed to seed countries',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Countries</h2>
          <p className="text-sm text-muted-foreground">
            {data?.total || 0} countries configured
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleSeed} disabled={seedCountries.isPending}>
            {seedCountries.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 mr-2" />
            )}
            Seed Defaults
          </Button>
          <Button onClick={openCreateForm}>
            <Plus className="h-4 w-4 mr-2" />
            Add Country
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
          value={params.continent || 'all'}
          onValueChange={(value) => handleFilterChange('continent', value)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Continent" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Continents</SelectItem>
            {CONTINENTS.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

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
              <TableHead>Country</TableHead>
              <TableHead>ISO Codes</TableHead>
              <TableHead>Continent</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                  Failed to load countries
                </TableCell>
              </TableRow>
            ) : data?.countries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12">
                  <div className="space-y-2">
                    <Globe className="h-12 w-12 mx-auto text-muted-foreground" />
                    <p className="text-muted-foreground">No countries found</p>
                    <Button variant="outline" size="sm" onClick={handleSeed}>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Seed Default Countries
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              data?.countries.map((country) => (
                <TableRow key={country._id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{country.flagEmoji || '🏳️'}</span>
                      <span className="font-medium">{country.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Badge variant="outline" className="font-mono">
                        {country.isoCode}
                      </Badge>
                      <Badge variant="secondary" className="font-mono">
                        {country.isoCode3}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>{country.continent}</TableCell>
                  <TableCell>
                    {country.isActive ? (
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
                        <DropdownMenuItem onClick={() => openEditForm(country)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => {
                            setSelectedCountry(country)
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
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>
              {formMode === 'create' ? 'Add Country' : 'Edit Country'}
            </DialogTitle>
            <DialogDescription>
              {formMode === 'create'
                ? 'Add a new country to the system.'
                : 'Update country details.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="isoCode">ISO 2-Letter Code</Label>
                <Input
                  id="isoCode"
                  value={formData.isoCode}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, isoCode: e.target.value.toUpperCase() }))
                  }
                  placeholder="US"
                  maxLength={2}
                  disabled={formMode === 'edit'}
                  className="font-mono uppercase"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="isoCode3">ISO 3-Letter Code</Label>
                <Input
                  id="isoCode3"
                  value={formData.isoCode3}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, isoCode3: e.target.value.toUpperCase() }))
                  }
                  placeholder="USA"
                  maxLength={3}
                  disabled={formMode === 'edit'}
                  className="font-mono uppercase"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Country Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="United States"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="flagEmoji">Flag Emoji</Label>
                <Input
                  id="flagEmoji"
                  value={formData.flagEmoji}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, flagEmoji: e.target.value }))
                  }
                  placeholder="🇺🇸"
                  maxLength={10}
                  className="text-center text-2xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="continent">Continent</Label>
                <Select
                  value={formData.continent}
                  onValueChange={(value: Continent) =>
                    setFormData((prev) => ({ ...prev, continent: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CONTINENTS.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
                !formData.isoCode ||
                !formData.isoCode3 ||
                !formData.name ||
                !formData.continent ||
                createCountry.isPending ||
                updateCountry.isPending
              }
            >
              {createCountry.isPending || updateCountry.isPending ? (
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
            <AlertDialogTitle>Delete Country</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{' '}
              <strong>
                {selectedCountry?.flagEmoji} {selectedCountry?.name}
              </strong>
              ? This will also affect any ports linked to this country.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteCountry.isPending ? (
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
