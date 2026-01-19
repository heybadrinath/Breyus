import { Pencil } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
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
      className="group relative cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
      onClick={() => onEdit(incoterm)}
    >
      <CardContent className="p-5">
        {/* Code - large and bold, no color */}
        <div className="text-2xl font-bold text-foreground mb-1">
          {incoterm.code}
        </div>

        {/* Name */}
        <h3 className="font-medium text-foreground mb-1">{incoterm.name}</h3>

        {/* Transport mode - muted text */}
        <p className="text-xs text-muted-foreground mb-3">
          {isAnyMode ? 'Any Transport Mode' : 'Sea & Inland Waterway'}
        </p>

        {/* Description - truncated to 2 lines */}
        <p className="text-sm text-muted-foreground line-clamp-2 mb-4 min-h-[2.5rem]">
          {incoterm.description}
        </p>

        {/* Single-color progress bar */}
        <div className="space-y-1.5">
          <Progress value={percentage} className="h-2" />
          <p className="text-xs text-muted-foreground">
            Seller responsibility: {sellerCount}/{total} ({percentage}%)
          </p>
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
