import { useState, useEffect } from 'react'
import { Loader2, Ship, Plane } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import type { Incoterm, CostAllocation, TransportMode, UpdateIncotermDto } from '../types'

// Cost allocation field labels
const COST_LABELS: { key: keyof CostAllocation; label: string; description: string }[] = [
  { key: 'commercialInvoice', label: 'Commercial Invoice', description: 'Documentation for the sale' },
  { key: 'packagingQualityControl', label: 'Packaging & QC', description: 'Product preparation and quality checks' },
  { key: 'loadingInlandDelivery', label: 'Loading/Inland Transport', description: 'Moving goods to port/terminal' },
  { key: 'exportDutyTaxes', label: 'Export Duty & Taxes', description: 'Export customs and duties' },
  { key: 'originTerminalHandling', label: 'Origin Terminal', description: 'Port/terminal handling at origin' },
  { key: 'insurance', label: 'Insurance', description: 'Cargo insurance during transport' },
  { key: 'carriageCharges', label: 'Carriage Charges', description: 'Main transport/freight costs' },
  { key: 'destinationTerminalHandling', label: 'Destination Terminal', description: 'Port/terminal handling at destination' },
  { key: 'deliveryToDestination', label: 'Delivery to Destination', description: 'Final delivery to buyer location' },
  { key: 'unloadingAtDestination', label: 'Unloading', description: 'Unloading at final destination' },
  { key: 'importDutyTaxes', label: 'Import Duty & Taxes', description: 'Import customs and duties' },
]

interface IncotermEditSheetProps {
  incoterm: Incoterm | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (code: string, data: UpdateIncotermDto) => Promise<void>
  isPending: boolean
}

export function IncotermEditSheet({
  incoterm,
  open,
  onOpenChange,
  onSave,
  isPending,
}: IncotermEditSheetProps) {
  const [form, setForm] = useState({
    name: '',
    description: '',
    riskTransferDescription: '',
    transportMode: 'any' as TransportMode,
    costAllocation: {} as CostAllocation,
  })

  // Initialize form when incoterm changes
  useEffect(() => {
    if (incoterm) {
      setForm({
        name: incoterm.name,
        description: incoterm.description,
        riskTransferDescription: incoterm.riskTransferDescription || '',
        transportMode: incoterm.transportMode,
        costAllocation: { ...incoterm.costAllocation },
      })
    }
  }, [incoterm])

  const toggleCostAllocation = (key: keyof CostAllocation) => {
    setForm((prev) => ({
      ...prev,
      costAllocation: {
        ...prev.costAllocation,
        [key]: prev.costAllocation[key] === 'Buyer' ? 'Seller' : 'Buyer',
      },
    }))
  }

  const handleSave = async () => {
    if (!incoterm) return
    await onSave(incoterm.code, form)
  }

  if (!incoterm) return null

  const isAnyMode = form.transportMode === 'any'

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg flex flex-col h-full">
        <SheetHeader className="pb-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            {/* Large code badge */}
            <span
              className={`text-2xl font-bold px-4 py-2 rounded-lg ${
                isAnyMode
                  ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                  : 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300'
              }`}
            >
              {incoterm.code}
            </span>
            {/* Transport mode badge */}
            <Badge
              variant="outline"
              className={`flex items-center gap-1.5 ${
                isAnyMode
                  ? 'border-purple-300 text-purple-700 dark:border-purple-700 dark:text-purple-300'
                  : 'border-cyan-300 text-cyan-700 dark:border-cyan-700 dark:text-cyan-300'
              }`}
            >
              {isAnyMode ? (
                <>
                  <Plane className="h-3.5 w-3.5" />
                  Any Transport
                </>
              ) : (
                <>
                  <Ship className="h-3.5 w-3.5" />
                  Sea/Inland
                </>
              )}
            </Badge>
          </div>
          <SheetTitle className="sr-only">Edit {incoterm.code}</SheetTitle>
          <SheetDescription>
            Edit incoterm details and cost allocation
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 py-4 flex-1 overflow-y-auto pr-2">
          {/* Basic Information Section */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Basic Information
            </h4>

            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g., Ex Works"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                placeholder="Describe what this incoterm means..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="riskTransfer">Risk Transfer Point</Label>
              <Textarea
                id="riskTransfer"
                value={form.riskTransferDescription}
                onChange={(e) =>
                  setForm({ ...form, riskTransferDescription: e.target.value })
                }
                rows={2}
                placeholder="When does risk transfer from seller to buyer?"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="transportMode">Transport Mode</Label>
              <Select
                value={form.transportMode}
                onValueChange={(value: TransportMode) =>
                  setForm({ ...form, transportMode: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">
                    <div className="flex items-center gap-2">
                      <Plane className="h-4 w-4 text-purple-500" />
                      Any Mode of Transport
                    </div>
                  </SelectItem>
                  <SelectItem value="sea_inland">
                    <div className="flex items-center gap-2">
                      <Ship className="h-4 w-4 text-cyan-500" />
                      Sea & Inland Waterway Only
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* Cost Allocation Section */}
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                Cost Allocation
              </h4>
              <p className="text-xs text-muted-foreground">
                Click to toggle between Buyer and Seller responsibility
              </p>
            </div>

            <div className="space-y-2">
              {COST_LABELS.map(({ key, label, description }) => {
                const party = form.costAllocation[key]
                const isSeller = party === 'Seller'
                return (
                  <div
                    key={key}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => toggleCostAllocation(key)}
                  >
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium block">{label}</span>
                      <span className="text-xs text-muted-foreground">{description}</span>
                    </div>
                    <div className="flex items-center gap-2 ml-3 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          if (!isSeller) toggleCostAllocation(key)
                        }}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                          isSeller
                            ? 'bg-blue-500 text-white shadow-sm'
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
                        }`}
                      >
                        Seller
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          if (isSeller) toggleCostAllocation(key)
                        }}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                          !isSeller
                            ? 'bg-orange-500 text-white shadow-sm'
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
                        }`}
                      >
                        Buyer
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <SheetFooter className="pt-4 border-t flex-shrink-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
