import { Pencil, Ship, Plane } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { Incoterm, CostAllocation } from '../types'

interface IncotermCardProps {
  incoterm: Incoterm
  onEdit: (incoterm: Incoterm) => void
}

/**
 * Calculate the percentage of costs assigned to the seller
 * This creates the visual progress bar showing cost responsibility split
 */
function calculateSellerPercentage(costAllocation: CostAllocation): {
  percentage: number
  sellerCount: number
  total: number
} {
  const values = Object.values(costAllocation)
  const sellerCount = values.filter((v) => v === 'Seller').length
  const total = values.length
  const percentage = Math.round((sellerCount / total) * 100)
  return { percentage, sellerCount, total }
}

export function IncotermCard({ incoterm, onEdit }: IncotermCardProps) {
  const { percentage, sellerCount, total } = calculateSellerPercentage(
    incoterm.costAllocation
  )
  const isAnyMode = incoterm.transportMode === 'any'

  return (
    <Card
      className="group cursor-pointer relative overflow-hidden transition-all duration-300
        bg-gradient-to-br from-slate-800/80 to-slate-900/80
        border border-slate-700/50
        hover:border-primary/50 hover:shadow-xl hover:shadow-primary/10
        hover:-translate-y-1"
      onClick={() => onEdit(incoterm)}
    >
      <CardContent className="p-5">
        {/* Transport mode icon - top right with glow */}
        <div
          className={`absolute top-3 right-3 p-1.5 rounded-full ${
            isAnyMode
              ? 'bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30'
              : 'bg-sky-500/20 text-sky-400 ring-1 ring-sky-500/30'
          }`}
        >
          {isAnyMode ? (
            <Plane className="h-4 w-4" />
          ) : (
            <Ship className="h-4 w-4" />
          )}
        </div>

        {/* Code badge - more prominent */}
        <div className="mb-3">
          <span
            className={`inline-flex items-center justify-center text-2xl font-bold px-4 py-2 rounded-xl ${
              isAnyMode
                ? 'bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 text-emerald-300 ring-1 ring-emerald-500/40'
                : 'bg-gradient-to-br from-sky-500/20 to-sky-600/10 text-sky-300 ring-1 ring-sky-500/40'
            }`}
          >
            {incoterm.code}
          </span>
        </div>

        {/* Name */}
        <h3 className="font-semibold text-foreground mb-1.5">{incoterm.name}</h3>

        {/* Description - truncated to 2 lines */}
        <p className="text-sm text-muted-foreground line-clamp-2 mb-4 min-h-[2.5rem]">
          {incoterm.description}
        </p>

        {/* Cost allocation visualization - dual color */}
        <div className="mt-4 space-y-3">
          {/* Dual progress bar */}
          <div className="relative h-3 rounded-full overflow-hidden bg-slate-700/50">
            <div
              className="absolute left-0 top-0 h-full bg-gradient-to-r from-sky-500 to-sky-400 transition-all duration-300"
              style={{ width: `${percentage}%` }}
            />
            <div
              className="absolute right-0 top-0 h-full bg-gradient-to-l from-amber-500 to-amber-400"
              style={{ width: `${100 - percentage}%` }}
            />
          </div>

          {/* Labels */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-sky-400" />
              <span className="text-slate-300">Seller: {sellerCount}/{total}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-300">Buyer: {total - sellerCount}/{total}</span>
              <div className="w-2 h-2 rounded-full bg-amber-400" />
            </div>
          </div>
        </div>

        {/* Edit button - appears on hover */}
        <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="secondary"
            size="sm"
            className="shadow-sm"
            onClick={(e) => {
              e.stopPropagation()
              onEdit(incoterm)
            }}
          >
            <Pencil className="h-3.5 w-3.5 mr-1.5" />
            Edit
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
