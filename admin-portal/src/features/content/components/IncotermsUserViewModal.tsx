import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import type { Incoterm, CostAllocation } from '../types'

interface IncotermsUserViewModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  incoterms: Incoterm[]
}

// All incoterm codes in display order
const INCOTERM_ORDER = ['EXW', 'FCA', 'FAS', 'FOB', 'CFR', 'CIF', 'CPT', 'CIP', 'DAP', 'DPU', 'DDP'] as const

// Cost allocation row labels (matching user-facing component)
const COST_ROWS: { key: keyof CostAllocation; label: string }[] = [
  { key: 'commercialInvoice', label: 'Commercial Invoice' },
  { key: 'packagingQualityControl', label: 'Packaging, Quality Control, Marking' },
  { key: 'loadingInlandDelivery', label: 'Loading & Inland Delivery' },
  { key: 'exportDutyTaxes', label: 'Export Duty & Taxes' },
  { key: 'originTerminalHandling', label: 'Origin Terminal Handling' },
  { key: 'insurance', label: 'Insurance' },
  { key: 'carriageCharges', label: 'Carriage Charges' },
  { key: 'destinationTerminalHandling', label: '*Destination Terminal Handling' },
  { key: 'deliveryToDestination', label: 'Delivery to Destination' },
  { key: 'unloadingAtDestination', label: 'Unloading at Destination' },
  { key: 'importDutyTaxes', label: 'Import Duty & Taxes' },
]

export function IncotermsUserViewModal({
  open,
  onOpenChange,
  incoterms,
}: IncotermsUserViewModalProps) {
  // Create a map for quick lookup
  const incotermMap = new Map(incoterms.map((i) => [i.code, i]))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] max-h-[90vh] overflow-hidden p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle className="flex items-center gap-3">
            <span>User View: Incoterms Table</span>
            <Badge variant="secondary">Read-only</Badge>
          </DialogTitle>
          <DialogDescription>
            This is how buyers and sellers see incoterms on the platform
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-auto max-h-[calc(90vh-120px)]">
          <table className="min-w-[1200px] w-full border-collapse text-xs">
            {/* Header Row 1: Transport Mode Groups */}
            <thead>
              <tr>
                <th
                  rowSpan={2}
                  className="sticky left-0 z-20 bg-muted text-foreground px-3 py-3 border w-48"
                />
                <th
                  colSpan={2}
                  className="bg-muted text-foreground px-2 py-2 border text-xs font-semibold uppercase tracking-wide"
                >
                  Any Transport Mode
                </th>
                <th
                  colSpan={4}
                  className="bg-muted text-foreground px-2 py-2 border text-xs font-semibold uppercase tracking-wide"
                >
                  Sea/Inland Waterway Transport
                </th>
                <th
                  colSpan={5}
                  className="bg-muted text-foreground px-2 py-2 border text-xs font-semibold uppercase tracking-wide"
                >
                  Any Transport Mode
                </th>
              </tr>
              {/* Header Row 2: Incoterm Codes */}
              <tr>
                {INCOTERM_ORDER.map((code) => (
                  <th
                    key={code}
                    className="bg-muted/70 text-foreground px-2 py-2 border text-xs font-semibold"
                  >
                    {code}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {/* Name Row */}
              <tr>
                <td className="sticky left-0 z-10 bg-muted text-foreground px-3 py-2 border font-semibold">
                  Charges/Fees
                </td>
                {INCOTERM_ORDER.map((code) => {
                  const incoterm = incotermMap.get(code)
                  return (
                    <td
                      key={code}
                      className="bg-background text-muted-foreground px-2 py-2 border text-center text-[10px] leading-tight"
                    >
                      {incoterm?.name || code}
                    </td>
                  )
                })}
              </tr>

              {/* Cost Allocation Rows */}
              {COST_ROWS.map(({ key, label }) => (
                <tr key={key}>
                  <td className="sticky left-0 z-10 bg-muted text-foreground px-3 py-2 border font-semibold text-xs">
                    {label}
                  </td>
                  {INCOTERM_ORDER.map((code) => {
                    const incoterm = incotermMap.get(code)
                    const value = incoterm?.costAllocation?.[key] || 'Buyer'
                    const isSeller = value === 'Seller'
                    return (
                      <td
                        key={code}
                        className={`px-2 py-2 border text-center font-medium ${
                          isSeller
                            ? 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300'
                            : 'bg-amber-50 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
                        }`}
                      >
                        {value}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className="px-6 py-3 border-t bg-muted/30 flex items-center gap-6 text-xs">
          <span className="font-medium text-muted-foreground">Legend:</span>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-cyan-100 dark:bg-cyan-900/30 border border-cyan-300 dark:border-cyan-700" />
            <span>Seller Responsibility</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-amber-50 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-700" />
            <span>Buyer Responsibility</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
