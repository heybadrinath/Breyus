import { useState, useMemo } from 'react'
import { AxiosError } from 'axios'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'
import { Loader2, RefreshCw, Database, Ship, Plane, AlertTriangle, Eye } from 'lucide-react'
import {
  useIncoterms,
  useSeedIncoterms,
  useResetIncoterms,
  useUpdateIncoterm,
} from '../hooks/useIncoterms'
import { IncotermCard } from '../components/IncotermCard'
import { IncotermEditSheet } from '../components/IncotermEditSheet'
import { IncotermsUserViewModal } from '../components/IncotermsUserViewModal'
import type { Incoterm, UpdateIncotermDto } from '../types'

// Helper to extract error message from various error types
function getErrorMessage(err: unknown): string {
  if (err instanceof AxiosError) {
    return err.response?.data?.message || err.message || 'Request failed'
  }
  if (err instanceof Error) {
    return err.message
  }
  return 'Unknown error'
}

// Section header component for transport mode groups
function TransportModeSection({
  title,
  icon: Icon,
  count,
  children,
}: {
  title: string
  icon: typeof Plane | typeof Ship
  count: number
  children: React.ReactNode
}) {
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-3">
        <Icon className="h-5 w-5 text-muted-foreground" />
        <div>
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="text-sm text-muted-foreground">{count} incoterms</p>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {children}
      </div>
    </section>
  )
}

// Loading skeleton for cards
function CardGridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <Card key={i} className="overflow-hidden">
          <CardContent className="p-5">
            <Skeleton className="h-10 w-16 rounded-lg mb-3" />
            <Skeleton className="h-5 w-32 mb-2" />
            <Skeleton className="h-4 w-full mb-1" />
            <Skeleton className="h-4 w-3/4 mb-4" />
            <Skeleton className="h-2 w-full mb-2" />
            <Skeleton className="h-3 w-24" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export function IncotermsPage() {
  const { toast } = useToast()
  const [selectedIncoterm, setSelectedIncoterm] = useState<Incoterm | null>(null)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false)
  const [isUserViewOpen, setIsUserViewOpen] = useState(false)

  const { data, isLoading, error } = useIncoterms()
  const seedMutation = useSeedIncoterms()
  const resetMutation = useResetIncoterms()
  const updateMutation = useUpdateIncoterm()

  // Group incoterms by transport mode
  const { anyModeIncoterms, seaInlandIncoterms } = useMemo(() => {
    if (!data?.incoterms) {
      return { anyModeIncoterms: [], seaInlandIncoterms: [] }
    }

    // Sort order based on typical trade progression
    const sortOrder: Record<string, number> = {
      EXW: 1,
      FCA: 2,
      CPT: 3,
      CIP: 4,
      DAP: 5,
      DPU: 6,
      DDP: 7,
      FAS: 1,
      FOB: 2,
      CFR: 3,
      CIF: 4,
    }

    const sortByOrder = (a: Incoterm, b: Incoterm) =>
      (sortOrder[a.code] || 99) - (sortOrder[b.code] || 99)

    return {
      anyModeIncoterms: data.incoterms
        .filter((inc) => inc.transportMode === 'any')
        .sort(sortByOrder),
      seaInlandIncoterms: data.incoterms
        .filter((inc) => inc.transportMode === 'sea_inland')
        .sort(sortByOrder),
    }
  }, [data?.incoterms])

  const handleSeed = async () => {
    try {
      const result = await seedMutation.mutateAsync()
      toast({
        title: 'Incoterms seeded',
        description: `Created: ${result.data?.created ?? 0}, Skipped: ${result.data?.skipped ?? 0}`,
      })
    } catch (err) {
      toast({
        title: 'Failed to seed incoterms',
        description: getErrorMessage(err),
        variant: 'destructive',
      })
    }
  }

  const handleReset = async () => {
    try {
      const result = await resetMutation.mutateAsync()
      toast({
        title: 'Incoterms reset to defaults',
        description: `${result.data?.updated ?? 0} incoterms updated`,
      })
      setIsResetDialogOpen(false)
    } catch (err) {
      toast({
        title: 'Failed to reset incoterms',
        description: getErrorMessage(err),
        variant: 'destructive',
      })
    }
  }

  const openEdit = (incoterm: Incoterm) => {
    setSelectedIncoterm(incoterm)
    setIsEditOpen(true)
  }

  const handleUpdate = async (code: string, updateData: UpdateIncotermDto) => {
    try {
      await updateMutation.mutateAsync({ code, data: updateData })
      toast({
        title: 'Incoterm updated',
        description: `${code} has been updated successfully`,
      })
      setIsEditOpen(false)
    } catch (err) {
      toast({
        title: 'Failed to update incoterm',
        description: getErrorMessage(err),
        variant: 'destructive',
      })
    }
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Incoterms</h2>
          <p className="text-muted-foreground">
            International Commercial Terms (Incoterms 2020)
          </p>
        </div>
        <Card className="border-destructive">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <CardTitle className="text-destructive">Error loading incoterms</CardTitle>
            </div>
            <CardDescription>{getErrorMessage(error)}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleSeed} disabled={seedMutation.isPending}>
              {seedMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Database className="mr-2 h-4 w-4" />
              Seed Default Incoterms
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Incoterms</h2>
          <p className="text-muted-foreground">
            {data?.total || 0} international trade terms • Incoterms 2020
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View as User button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsUserViewOpen(true)}
            disabled={!data?.incoterms?.length}
          >
            <Eye className="mr-2 h-4 w-4" />
            View as User
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsResetDialogOpen(true)}
            disabled={resetMutation.isPending || !data?.incoterms?.length}
          >
            {resetMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <RefreshCw className="mr-2 h-4 w-4" />
            Reset
          </Button>
          <Button size="sm" onClick={handleSeed} disabled={seedMutation.isPending}>
            {seedMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Database className="mr-2 h-4 w-4" />
            Seed Defaults
          </Button>
        </div>
      </div>

      {/* Loading state */}
      {isLoading ? (
        <CardGridSkeleton />
      ) : !data?.incoterms?.length ? (
        /* Empty state */
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="rounded-full bg-muted p-4 mb-4">
              <Database className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-1">No incoterms found</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Click "Seed Defaults" to populate the database with all 11 incoterms.
            </p>
            <Button onClick={handleSeed} disabled={seedMutation.isPending}>
              {seedMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Database className="mr-2 h-4 w-4" />
              Seed Default Incoterms
            </Button>
          </CardContent>
        </Card>
      ) : (
        /* Card Grid grouped by transport mode */
        <div className="space-y-8">
          {/* Any Mode of Transport Section */}
          {anyModeIncoterms.length > 0 && (
            <TransportModeSection
              title="Any Mode of Transport"
              icon={Plane}
              count={anyModeIncoterms.length}
            >
              {anyModeIncoterms.map((incoterm) => (
                <IncotermCard
                  key={incoterm._id}
                  incoterm={incoterm}
                  onEdit={openEdit}
                />
              ))}
            </TransportModeSection>
          )}

          {/* Sea & Inland Waterway Section */}
          {seaInlandIncoterms.length > 0 && (
            <TransportModeSection
              title="Sea & Inland Waterway Only"
              icon={Ship}
              count={seaInlandIncoterms.length}
            >
              {seaInlandIncoterms.map((incoterm) => (
                <IncotermCard
                  key={incoterm._id}
                  incoterm={incoterm}
                  onEdit={openEdit}
                />
              ))}
            </TransportModeSection>
          )}
        </div>
      )}

      {/* Edit Sheet */}
      <IncotermEditSheet
        incoterm={selectedIncoterm}
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        onSave={handleUpdate}
        isPending={updateMutation.isPending}
      />

      {/* Reset Confirmation Dialog */}
      <AlertDialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset all incoterms to defaults?</AlertDialogTitle>
            <AlertDialogDescription>
              This will overwrite all customizations you've made to incoterm descriptions and
              cost allocations. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReset}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {resetMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Reset to Defaults
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* User View Modal */}
      <IncotermsUserViewModal
        open={isUserViewOpen}
        onOpenChange={setIsUserViewOpen}
        incoterms={data?.incoterms || []}
      />
    </div>
  )
}
