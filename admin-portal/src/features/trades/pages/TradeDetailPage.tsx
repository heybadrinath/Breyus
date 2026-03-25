import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  AlertTriangle,
  MessageSquare,
  Plus,
  Trash2,
  Clock,
  Package,
  User,
  Building,
  FileText,
  Download,
  CheckCircle,
  XCircle,
  RefreshCw,
  Mail,
  Send,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import {
  useTrade,
  useTradeTimeline,
  useTradeNotes,
  useAddTradeNote,
  useDeleteTradeNote,
  useVerifyDocument,
  useForcePhaseChange,
  useDownloadDocument,
  useSendTradeReminder,
} from '../hooks/useTrades'
import type {
  AdminNote,
  TradeTimelineEvent,
  VerifiableDocumentType,
  TradePhaseType,
  ReminderRecipientType,
} from '../types'
import {
  DOCUMENT_TYPE_LABELS,
  TRADE_PHASES,
  TRADE_PHASE_LABELS,
} from '../types'

// Helper to get phase badge color (dark mode compatible)
function getPhaseColor(phase: string): string {
  switch (phase) {
    case 'PR':
      return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
    case 'SCO':
    case 'ICPO':
      return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
    case 'SPA':
    case 'PAYMENT':
      return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20'
    case 'BOL':
      return 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20'
    case 'COMPLETED':
      return 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20'
    case 'CANCELLED':
      return 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20'
    default:
      return 'bg-muted text-muted-foreground border-border'
  }
}

// Helper to get timeline event icon/color
function getTimelineEventStyle(type: string) {
  switch (type) {
    case 'trade_created':
      return { bg: 'bg-blue-100', text: 'text-blue-600' }
    case 'negotiation':
      return { bg: 'bg-amber-100', text: 'text-amber-600' }
    case 'trade_accepted':
      return { bg: 'bg-green-100', text: 'text-green-600' }
    case 'trade_rejected':
    case 'trade_cancelled':
      return { bg: 'bg-red-100', text: 'text-red-600' }
    case 'document_uploaded':
    case 'document_signed':
      return { bg: 'bg-purple-100', text: 'text-purple-600' }
    case 'payment_verified':
      return { bg: 'bg-indigo-100', text: 'text-indigo-600' }
    case 'trade_completed':
      return { bg: 'bg-green-100', text: 'text-green-600' }
    case 'admin_note':
      return { bg: 'bg-gray-100', text: 'text-gray-600' }
    default:
      return { bg: 'bg-gray-100', text: 'text-gray-600' }
  }
}

export function TradeDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()

  // State
  const [newNote, setNewNote] = useState('')
  const [deleteNoteDialog, setDeleteNoteDialog] = useState<{ open: boolean; note: AdminNote | null }>({
    open: false,
    note: null,
  })

  // Document verification state
  const [verifyDocDialog, setVerifyDocDialog] = useState<{
    open: boolean
    docType: VerifiableDocumentType | null
    action: 'approved' | 'rejected' | null
  }>({ open: false, docType: null, action: null })
  const [verifyNotes, setVerifyNotes] = useState('')

  // Force phase change state
  const [forcePhaseDialog, setForcePhaseDialog] = useState(false)
  const [newPhase, setNewPhase] = useState<TradePhaseType | ''>('')
  const [phaseReason, setPhaseReason] = useState('')
  const [notifyParties, setNotifyParties] = useState(false)

  // Send reminder state
  const [reminderRecipient, setReminderRecipient] = useState<ReminderRecipientType>('both')
  const [reminderMessage, setReminderMessage] = useState('')

  // Queries and mutations
  const { data: trade, isLoading, error } = useTrade(id!)
  const { data: timeline } = useTradeTimeline(id!)
  const { data: notes } = useTradeNotes(id!)
  const addNoteMutation = useAddTradeNote()
  const deleteNoteMutation = useDeleteTradeNote()
  const verifyDocMutation = useVerifyDocument()
  const forcePhaseChangeMutation = useForcePhaseChange()
  const downloadDocMutation = useDownloadDocument()
  const sendReminderMutation = useSendTradeReminder()

  const handleAddNote = async () => {
    if (!newNote.trim() || !id) return

    try {
      await addNoteMutation.mutateAsync({
        tradeId: id,
        data: { content: newNote.trim() },
      })
      toast({ title: 'Note added', description: 'Admin note has been added successfully.' })
      setNewNote('')
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err?.response?.data?.message || 'Failed to add note',
        variant: 'destructive',
      })
    }
  }

  const handleDeleteNote = async () => {
    if (!deleteNoteDialog.note || !id) return

    try {
      await deleteNoteMutation.mutateAsync({
        tradeId: id,
        noteId: deleteNoteDialog.note._id,
      })
      toast({ title: 'Note deleted', description: 'Admin note has been deleted.' })
      setDeleteNoteDialog({ open: false, note: null })
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err?.response?.data?.message || 'Failed to delete note',
        variant: 'destructive',
      })
    }
  }

  // Document verification handler
  const handleVerifyDocument = async () => {
    if (!verifyDocDialog.docType || !verifyDocDialog.action || !id) return

    // Require notes for rejection
    if (verifyDocDialog.action === 'rejected' && !verifyNotes.trim()) {
      toast({
        title: 'Notes required',
        description: 'Please provide a reason for rejecting the document.',
        variant: 'destructive',
      })
      return
    }

    try {
      await verifyDocMutation.mutateAsync({
        tradeId: id,
        data: {
          documentType: verifyDocDialog.docType,
          status: verifyDocDialog.action,
          notes: verifyNotes.trim() || undefined,
        },
      })
      toast({
        title: `Document ${verifyDocDialog.action}`,
        description: `The ${verifyDocDialog.docType.toUpperCase()} document has been ${verifyDocDialog.action}.`,
      })
      setVerifyDocDialog({ open: false, docType: null, action: null })
      setVerifyNotes('')
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err?.response?.data?.message || 'Failed to verify document',
        variant: 'destructive',
      })
    }
  }

  // Force phase change handler
  const handleForcePhaseChange = async () => {
    if (!newPhase || !phaseReason.trim() || !id) return

    if (phaseReason.trim().length < 10) {
      toast({
        title: 'Reason too short',
        description: 'Please provide a detailed reason (at least 10 characters).',
        variant: 'destructive',
      })
      return
    }

    try {
      await forcePhaseChangeMutation.mutateAsync({
        tradeId: id,
        data: {
          newPhase,
          reason: phaseReason.trim(),
          notifyParties,
        },
      })
      toast({
        title: 'Phase changed',
        description: `Trade phase has been changed to ${TRADE_PHASE_LABELS[newPhase]}.`,
      })
      setForcePhaseDialog(false)
      setNewPhase('')
      setPhaseReason('')
      setNotifyParties(false)
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err?.response?.data?.message || 'Failed to change phase',
        variant: 'destructive',
      })
    }
  }

  // Send reminder handler
  const handleSendReminder = async () => {
    if (!id) return

    try {
      const result = await sendReminderMutation.mutateAsync({
        tradeId: id,
        data: {
          recipientType: reminderRecipient,
          customMessage: reminderMessage.trim() || undefined,
        },
      })
      toast({
        title: 'Reminder sent',
        description: `Reminder email sent to ${result.data?.sentTo?.join(', ') || 'recipients'}.`,
      })
      setReminderMessage('')
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err?.response?.data?.message || 'Failed to send reminder',
        variant: 'destructive',
      })
    }
  }

  // Document download handler
  const handleDownloadDocument = async (docType: string) => {
    if (!id) return

    try {
      const response = await downloadDocMutation.mutateAsync({ tradeId: id, docType })
      const blob = response.data
      const contentDisposition = response.headers['content-disposition']
      let filename = `${docType}-document`
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="(.+)"/)
        if (match) filename = match[1]
      }

      // Create download link
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      toast({ title: 'Download started', description: `Downloading ${filename}` })
    } catch (err: any) {
      toast({
        title: 'Download failed',
        description: err?.response?.data?.message || 'Failed to download document',
        variant: 'destructive',
      })
    }
  }

  // Map schema field name to verifiable document type
  const getDocTypeKey = (schemaField: string): VerifiableDocumentType => {
    const mapping: Record<string, VerifiableDocumentType> = {
      scoDocument: 'sco',
      icpoDocument: 'icpo',
      spaDocument: 'spa',
      bolDocument: 'bol',
      paymentProof: 'payment-proof',
    }
    return mapping[schemaField]
  }

  // Get status badge color
  const getDocStatusColor = (status?: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-500/10 text-green-600 border-green-500/20'
      case 'rejected':
        return 'bg-red-500/10 text-red-600 border-red-500/20'
      case 'uploaded':
        return 'bg-blue-500/10 text-blue-600 border-blue-500/20'
      default:
        return 'bg-muted text-muted-foreground border-border'
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error || !trade) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-destructive">Failed to load trade</p>
        <Button variant="outline" onClick={() => navigate('/trades')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Trades
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/trades')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              Trade: {trade.product?.name || 'Unknown Product'}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className={getPhaseColor(trade.tradePhase)}>
                {trade.tradePhase}
              </Badge>
              <Badge variant="outline" className="text-gray-600 border-gray-300">
                {trade.negotiationStatus.replace('_', ' ')}
              </Badge>
              {trade.isStalled && (
                <Badge variant="outline" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  Stalled ({trade.daysSincePhaseChange} days)
                </Badge>
              )}
              {trade.activeDispute && (
                <Badge
                  variant="outline"
                  className="bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20 cursor-pointer"
                  onClick={() => navigate(`/disputes/${trade.activeDispute?._id}`)}
                >
                  <MessageSquare className="w-3 h-3 mr-1" />
                  Active Dispute
                </Badge>
              )}
            </div>
          </div>
        </div>
        <div className="text-sm text-muted-foreground">
          ID: <span className="font-mono">{trade._id}</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Trade Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Product Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Product Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Product Name</div>
                  <div className="font-medium">{trade.product?.name || '-'}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Price</div>
                  <div className="font-medium">
                    {trade.product?.currency || '$'} {trade.product?.price || '-'}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Quantity</div>
                  <div className="font-medium">
                    {trade.quantity} {trade.quantityUnit}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Negotiation Round</div>
                  <div className="font-medium">{trade.currentNegotiationRound}</div>
                </div>
              </div>
              {(trade.buyerOfferedPrice || trade.sellerOfferedPrice) && (
                <>
                  <Separator />
                  <div className="grid grid-cols-2 gap-4">
                    {trade.buyerOfferedPrice && (
                      <div>
                        <div className="text-sm text-muted-foreground">Buyer's Offer</div>
                        <div className="font-medium text-blue-600">${trade.buyerOfferedPrice}</div>
                      </div>
                    )}
                    {trade.sellerOfferedPrice && (
                      <div>
                        <div className="text-sm text-muted-foreground">Seller's Offer</div>
                        <div className="font-medium text-green-600">${trade.sellerOfferedPrice}</div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Parties */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <User className="h-4 w-4" />
                  Buyer
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-sm">{trade.buyer?.mail || '-'}</div>
                  <div className="flex items-center gap-1 text-muted-foreground text-sm">
                    <Building className="h-3 w-3" />
                    {trade.buyer?.company?.companyName || '-'}
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <User className="h-4 w-4" />
                  Seller
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-sm">{trade.seller?.mail || '-'}</div>
                  <div className="flex items-center gap-1 text-muted-foreground text-sm">
                    <Building className="h-3 w-3" />
                    {trade.seller?.company?.companyName || '-'}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs for Timeline, Negotiations, Documents */}
          <Card>
            <Tabs defaultValue="timeline">
              <CardHeader>
                <TabsList>
                  <TabsTrigger value="timeline">Timeline</TabsTrigger>
                  <TabsTrigger value="negotiations">Negotiations</TabsTrigger>
                  <TabsTrigger value="documents">Documents</TabsTrigger>
                </TabsList>
              </CardHeader>
              <CardContent>
                <TabsContent value="timeline" className="mt-0">
                  {timeline && timeline.length > 0 ? (
                    <div className="space-y-4">
                      {timeline.map((event: TradeTimelineEvent, index: number) => {
                        const style = getTimelineEventStyle(event.type)
                        return (
                          <div key={index} className="flex gap-4">
                            <div className={`w-8 h-8 rounded-full ${style.bg} flex items-center justify-center flex-shrink-0`}>
                              <Clock className={`w-4 h-4 ${style.text}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium">{event.description}</div>
                              <div className="text-sm text-muted-foreground">
                                {new Date(event.timestamp).toLocaleString()}
                                {event.actor && ` • ${event.actor}`}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground py-8">
                      No timeline events
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="negotiations" className="mt-0">
                  {trade.negotiationHistory && trade.negotiationHistory.length > 0 ? (
                    <div className="space-y-4">
                      {trade.negotiationHistory.map((entry, index) => (
                        <div key={index} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <Badge variant={entry.party === 'buyer' ? 'default' : 'secondary'}>
                              Round {entry.round} - {entry.party}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {new Date(entry.timestamp).toLocaleString()}
                            </span>
                          </div>
                          {entry.offeredPrice && (
                            <div className="mt-2 font-medium">
                              Offered: ${entry.offeredPrice}
                            </div>
                          )}
                          {entry.message && (
                            <div className="mt-2 text-sm text-muted-foreground">
                              "{entry.message}"
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground py-8">
                      No negotiation history
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="documents" className="mt-0">
                  <div className="space-y-4">
                    {['scoDocument', 'icpoDocument', 'spaDocument', 'bolDocument', 'paymentProof'].map((docField) => {
                      const doc = (trade as any)[docField]
                      const docTypeKey = getDocTypeKey(docField)
                      const docInfo = DOCUMENT_TYPE_LABELS[docTypeKey]

                      return (
                        <div key={docField} className="border rounded-lg p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <FileText className="h-5 w-5 text-muted-foreground" />
                              <div>
                                <div className="font-medium">{docInfo.label}</div>
                                <div className="text-xs text-muted-foreground">
                                  Uploaded by: {docInfo.uploadedBy}
                                </div>
                              </div>
                            </div>
                            {doc ? (
                              <Badge variant="outline" className={getDocStatusColor(doc.status)}>
                                {doc.status || 'Uploaded'}
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-muted-foreground">
                                Not uploaded
                              </Badge>
                            )}
                          </div>

                          {doc && (
                            <>
                              {/* Document details */}
                              <div className="grid grid-cols-2 gap-2 text-sm">
                                <div>
                                  <span className="text-muted-foreground">File: </span>
                                  <span className="font-medium">{doc.originalName || 'Unknown'}</span>
                                </div>
                                {doc.uploadedAt && (
                                  <div>
                                    <span className="text-muted-foreground">Uploaded: </span>
                                    <span>{new Date(doc.uploadedAt).toLocaleDateString()}</span>
                                  </div>
                                )}
                              </div>

                              {/* Rejection notes if rejected */}
                              {doc.status === 'rejected' && doc.notes && (
                                <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded p-2 text-sm">
                                  <span className="font-medium text-red-600">Rejection reason: </span>
                                  <span className="text-red-600">{doc.notes}</span>
                                </div>
                              )}

                              {/* Action buttons */}
                              <div className="flex items-center gap-2 pt-2 border-t">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDownloadDocument(docTypeKey)}
                                  disabled={downloadDocMutation.isPending}
                                >
                                  <Download className="h-4 w-4 mr-1" />
                                  Download
                                </Button>

                                {doc.status !== 'approved' && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-green-600 border-green-200 hover:bg-green-50"
                                    onClick={() => setVerifyDocDialog({ open: true, docType: docTypeKey, action: 'approved' })}
                                  >
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    Approve
                                  </Button>
                                )}

                                {doc.status !== 'rejected' && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-red-600 border-red-200 hover:bg-red-50"
                                    onClick={() => setVerifyDocDialog({ open: true, docType: docTypeKey, action: 'rejected' })}
                                  >
                                    <XCircle className="h-4 w-4 mr-1" />
                                    Reject
                                  </Button>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </TabsContent>
              </CardContent>
            </Tabs>
          </Card>
        </div>

        {/* Right Column - Admin Notes */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Admin Notes
              </CardTitle>
              <CardDescription>
                Internal notes (not visible to users)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add Note Form */}
              <div className="space-y-2">
                <Textarea
                  placeholder="Add an internal note..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  rows={3}
                />
                <Button
                  onClick={handleAddNote}
                  disabled={!newNote.trim() || addNoteMutation.isPending}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {addNoteMutation.isPending ? 'Adding...' : 'Add Note'}
                </Button>
              </div>

              <Separator />

              {/* Notes List */}
              {notes && notes.length > 0 ? (
                <div className="space-y-3">
                  {notes.map((note: AdminNote) => (
                    <div key={note._id} className="bg-muted/50 rounded-lg p-3 space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="text-sm">{note.content}</div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-muted-foreground hover:text-destructive"
                          onClick={() => setDeleteNoteDialog({ open: true, note })}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{note.addedByEmail}</span>
                        <span>{new Date(note.addedAt).toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-4">
                  No notes yet
                </div>
              )}
            </CardContent>
          </Card>

          {/* Timestamps */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Timestamps</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created</span>
                <span>{new Date(trade.createdAt).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Updated</span>
                <span>{new Date(trade.updatedAt).toLocaleString()}</span>
              </div>
              {trade.lastPhaseChangeAt && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Phase Changed</span>
                  <span>{new Date(trade.lastPhaseChangeAt).toLocaleString()}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Send Reminder Card - Only for stalled trades */}
          {trade.isStalled && (
            <Card className="border-amber-500/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base text-amber-600">
                  <Mail className="h-4 w-4" />
                  Send Reminder
                </CardTitle>
                <CardDescription>
                  This trade has been inactive for {trade.daysSincePhaseChange} days
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reminder-recipient">Send to</Label>
                  <Select
                    value={reminderRecipient}
                    onValueChange={(value) => setReminderRecipient(value as ReminderRecipientType)}
                  >
                    <SelectTrigger id="reminder-recipient">
                      <SelectValue placeholder="Select recipient" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="both">Both Parties</SelectItem>
                      <SelectItem value="buyer">Buyer Only</SelectItem>
                      <SelectItem value="seller">Seller Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reminder-message">Custom Message (Optional)</Label>
                  <Textarea
                    id="reminder-message"
                    placeholder="Add a custom message to include in the reminder email..."
                    value={reminderMessage}
                    onChange={(e) => setReminderMessage(e.target.value)}
                    rows={3}
                    maxLength={500}
                  />
                  <p className="text-xs text-muted-foreground text-right">
                    {reminderMessage.length}/500
                  </p>
                </div>

                <Button
                  className="w-full bg-amber-600 hover:bg-amber-700"
                  onClick={handleSendReminder}
                  disabled={sendReminderMutation.isPending}
                >
                  <Send className="h-4 w-4 mr-2" />
                  {sendReminderMutation.isPending ? 'Sending...' : 'Send Reminder Email'}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Force Phase Change Card */}
          {trade.tradePhase !== 'COMPLETED' && trade.tradePhase !== 'CANCELLED' && (
            <Card className="border-amber-200 dark:border-amber-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base text-amber-600">
                  <RefreshCw className="h-4 w-4" />
                  Force Phase Change
                </CardTitle>
                <CardDescription>
                  Manually change trade phase (admin override)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  variant="outline"
                  className="w-full border-amber-200 text-amber-600 hover:bg-amber-50 dark:border-amber-800 dark:hover:bg-amber-950"
                  onClick={() => setForcePhaseDialog(true)}
                >
                  Change Phase
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Delete Note Dialog */}
      <AlertDialog
        open={deleteNoteDialog.open}
        onOpenChange={(open) => !open && setDeleteNoteDialog({ open: false, note: null })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Note</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this note? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteNote}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteNoteMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Document Verification Dialog */}
      <Dialog
        open={verifyDocDialog.open}
        onOpenChange={(open) => {
          if (!open) {
            setVerifyDocDialog({ open: false, docType: null, action: null })
            setVerifyNotes('')
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {verifyDocDialog.action === 'approved' ? 'Approve' : 'Reject'} Document
            </DialogTitle>
            <DialogDescription>
              {verifyDocDialog.docType && (
                <>
                  You are about to {verifyDocDialog.action === 'approved' ? 'approve' : 'reject'} the{' '}
                  <strong>{DOCUMENT_TYPE_LABELS[verifyDocDialog.docType].label}</strong> document.
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {verifyDocDialog.action === 'rejected' && (
              <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm text-red-600">
                <AlertTriangle className="h-4 w-4 inline mr-2" />
                Rejection requires a reason to be provided to the user.
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="verify-notes">
                {verifyDocDialog.action === 'rejected' ? 'Rejection Reason (Required)' : 'Notes (Optional)'}
              </Label>
              <Textarea
                id="verify-notes"
                placeholder={
                  verifyDocDialog.action === 'rejected'
                    ? 'Please explain why this document is being rejected...'
                    : 'Add any verification notes...'
                }
                value={verifyNotes}
                onChange={(e) => setVerifyNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setVerifyDocDialog({ open: false, docType: null, action: null })
                setVerifyNotes('')
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleVerifyDocument}
              disabled={verifyDocMutation.isPending || (verifyDocDialog.action === 'rejected' && !verifyNotes.trim())}
              className={
                verifyDocDialog.action === 'approved'
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-red-600 hover:bg-red-700'
              }
            >
              {verifyDocMutation.isPending
                ? 'Processing...'
                : verifyDocDialog.action === 'approved'
                ? 'Approve Document'
                : 'Reject Document'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Force Phase Change Dialog */}
      <Dialog
        open={forcePhaseDialog}
        onOpenChange={(open) => {
          if (!open) {
            setForcePhaseDialog(false)
            setNewPhase('')
            setPhaseReason('')
            setNotifyParties(false)
          }
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-amber-600" />
              Force Phase Change
            </DialogTitle>
            <DialogDescription>
              Manually change the trade phase. This is an administrative override and will be logged.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Warning */}
            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 text-sm text-amber-700 dark:text-amber-400">
              <AlertTriangle className="h-4 w-4 inline mr-2" />
              This action bypasses normal trade workflow. Use only when absolutely necessary.
            </div>

            {/* Current Phase */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Current Phase:</span>
              <Badge variant="outline" className={getPhaseColor(trade.tradePhase)}>
                {TRADE_PHASE_LABELS[trade.tradePhase as TradePhaseType] || trade.tradePhase}
              </Badge>
            </div>

            {/* New Phase Selection */}
            <div className="space-y-2">
              <Label htmlFor="new-phase">New Phase</Label>
              <Select value={newPhase} onValueChange={(value) => setNewPhase(value as TradePhaseType)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select new phase..." />
                </SelectTrigger>
                <SelectContent>
                  {TRADE_PHASES.filter((phase) => phase !== trade.tradePhase).map((phase) => (
                    <SelectItem key={phase} value={phase}>
                      {TRADE_PHASE_LABELS[phase]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Reason */}
            <div className="space-y-2">
              <Label htmlFor="phase-reason">Reason (Required)</Label>
              <Textarea
                id="phase-reason"
                placeholder="Provide a detailed reason for this phase change (min 10 characters)..."
                value={phaseReason}
                onChange={(e) => setPhaseReason(e.target.value)}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                {phaseReason.length}/10 characters minimum
              </p>
            </div>

            {/* Notify Parties */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="notify-parties"
                checked={notifyParties}
                onCheckedChange={(checked: boolean | 'indeterminate') => setNotifyParties(checked === true)}
              />
              <Label htmlFor="notify-parties" className="text-sm font-normal cursor-pointer">
                Notify buyer and seller by email about this change
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setForcePhaseDialog(false)
                setNewPhase('')
                setPhaseReason('')
                setNotifyParties(false)
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleForcePhaseChange}
              disabled={forcePhaseChangeMutation.isPending || !newPhase || phaseReason.length < 10}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {forcePhaseChangeMutation.isPending ? 'Changing...' : 'Change Phase'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
