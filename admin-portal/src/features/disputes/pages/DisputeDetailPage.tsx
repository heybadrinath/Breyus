import { useState, useRef, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Send,
  UserPlus,
  CheckCircle,
  MessageSquare,
  ExternalLink,
  Lock,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
  useDispute,
  useDisputeMessages,
  useSelfAssignDispute,
  useUpdateDisputeStatus,
  useResolveDispute,
  useAddDisputeMessage,
} from '../hooks/useDisputes'
import type { DisputeMessage, DisputePriority, DisputeStatus } from '../types'

function getPriorityColorClass(priority: DisputePriority): string {
  switch (priority) {
    case 'urgent':
      return 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20'
    case 'high':
      return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
    case 'medium':
      return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
    case 'low':
      return 'bg-muted text-muted-foreground border-border'
    default:
      return 'bg-muted text-muted-foreground border-border'
  }
}

function getStatusColorClass(status: DisputeStatus): string {
  switch (status) {
    case 'open':
      return 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20'
    case 'under_review':
      return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
    case 'resolved':
      return 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20'
    case 'closed':
      return 'bg-muted text-muted-foreground border-border'
    default:
      return 'bg-muted text-muted-foreground border-border'
  }
}

function formatReasonText(reason: string): string {
  const reasonMap: Record<string, string> = {
    payment_issue: 'Payment Issue',
    quality_issue: 'Quality Issue',
    delivery_delay: 'Delivery Delay',
    documentation_problem: 'Documentation Problem',
    communication_issue: 'Communication Issue',
    pricing_dispute: 'Pricing Dispute',
    contract_breach: 'Contract Breach',
    other: 'Other',
  }
  return reasonMap[reason] || reason
}

export function DisputeDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // State
  const [newMessage, setNewMessage] = useState('')
  const [isInternalMessage, setIsInternalMessage] = useState(false)
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false)
  const [resolutionNotes, setResolutionNotes] = useState('')
  // Status change is handled via updateStatusMutation directly with the selected value

  // Queries and mutations
  const { data: dispute, isLoading, error } = useDispute(id!)
  const { data: messages } = useDisputeMessages(id!)
  const selfAssignMutation = useSelfAssignDispute()
  const updateStatusMutation = useUpdateDisputeStatus()
  const resolveMutation = useResolveDispute()
  const addMessageMutation = useAddDisputeMessage()

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSelfAssign = async () => {
    if (!id) return

    try {
      await selfAssignMutation.mutateAsync({ disputeId: id })
      toast({ title: 'Dispute assigned', description: 'The dispute has been assigned to you.' })
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err?.response?.data?.message || 'Failed to assign dispute',
        variant: 'destructive',
      })
    }
  }

  const handleStatusChange = async (status: DisputeStatus) => {
    if (!id || status === dispute?.status) return

    try {
      await updateStatusMutation.mutateAsync({
        disputeId: id,
        data: { status },
      })
      toast({ title: 'Status updated', description: `Dispute status changed to ${status.replace('_', ' ')}.` })
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err?.response?.data?.message || 'Failed to update status',
        variant: 'destructive',
      })
    }
  }

  const handleResolve = async () => {
    if (!id || !resolutionNotes.trim()) return

    try {
      await resolveMutation.mutateAsync({
        disputeId: id,
        data: { resolutionNotes: resolutionNotes.trim() },
      })
      toast({ title: 'Dispute resolved', description: 'The dispute has been marked as resolved.' })
      setResolveDialogOpen(false)
      setResolutionNotes('')
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err?.response?.data?.message || 'Failed to resolve dispute',
        variant: 'destructive',
      })
    }
  }

  const handleSendMessage = async () => {
    if (!id || !newMessage.trim()) return

    try {
      await addMessageMutation.mutateAsync({
        disputeId: id,
        data: {
          content: newMessage.trim(),
          isInternal: isInternalMessage,
        },
      })
      setNewMessage('')
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err?.response?.data?.message || 'Failed to send message',
        variant: 'destructive',
      })
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error || !dispute) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-destructive">Failed to load dispute</p>
        <Button variant="outline" onClick={() => navigate('/disputes')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Disputes
        </Button>
      </div>
    )
  }

  const isResolved = dispute.status === 'resolved' || dispute.status === 'closed'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/disputes')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              Dispute: {formatReasonText(dispute.reason)}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className={getStatusColorClass(dispute.status)}>
                {dispute.status.replace('_', ' ')}
              </Badge>
              <Badge variant="outline" className={getPriorityColorClass(dispute.priority)}>
                {dispute.priority}
              </Badge>
              {dispute.assignedAdmin ? (
                <Badge variant="outline" className="text-gray-600 border-gray-300">
                  Assigned: {dispute.assignedAdmin.email}
                </Badge>
              ) : (
                <Badge variant="outline" className="text-purple-600 dark:text-purple-400 border-purple-500/20 bg-purple-500/10">
                  Unassigned
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {!dispute.assignedAdmin && (
            <Button variant="outline" onClick={handleSelfAssign} disabled={selfAssignMutation.isPending}>
              <UserPlus className="h-4 w-4 mr-2" />
              Assign to Me
            </Button>
          )}
          {!isResolved && (
            <Button onClick={() => setResolveDialogOpen(true)}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Resolve
            </Button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Chat and Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Dispute Details */}
          <Card>
            <CardHeader>
              <CardTitle>Dispute Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Raised By</div>
                  <div className="font-medium">{dispute.raisedByEmail}</div>
                  <div className="text-sm text-muted-foreground capitalize">({dispute.raisedByRole})</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Trade</div>
                  <Button
                    variant="link"
                    className="h-auto p-0"
                    onClick={() => navigate(`/trades/${dispute.trade?._id}`)}
                  >
                    View Trade <ExternalLink className="h-3 w-3 ml-1" />
                  </Button>
                </div>
              </div>
              <Separator />
              <div>
                <div className="text-sm text-muted-foreground mb-2">Description</div>
                <div className="bg-muted/50 rounded-lg p-4">
                  {dispute.description}
                </div>
              </div>
              {dispute.resolutionNotes && (
                <>
                  <Separator />
                  <div>
                    <div className="text-sm text-muted-foreground mb-2 flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Resolution Notes
                    </div>
                    <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 text-green-700 dark:text-green-300">
                      {dispute.resolutionNotes}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Messages */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Messages
              </CardTitle>
              <CardDescription>
                Communication thread for this dispute
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Messages List */}
              <div className="h-[400px] overflow-y-auto border rounded-lg p-4 space-y-4 mb-4">
                {messages && messages.length > 0 ? (
                  messages.map((message: DisputeMessage) => (
                    <div
                      key={message._id}
                      className={`flex ${message.senderType === 'admin' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${
                          message.senderType === 'admin'
                            ? message.isInternal
                              ? 'bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300'
                              : 'bg-primary text-primary-foreground'
                            : message.senderType === 'buyer'
                            ? 'bg-blue-500/10 border border-blue-500/20 text-blue-700 dark:text-blue-300'
                            : 'bg-green-500/10 border border-green-500/20 text-green-700 dark:text-green-300'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium capitalize">
                            {message.senderType}
                          </span>
                          {message.isInternal && (
                            <Badge variant="outline" className="text-xs py-0 h-4">
                              <Lock className="h-2 w-2 mr-1" />
                              Internal
                            </Badge>
                          )}
                        </div>
                        <div className={message.senderType === 'admin' && !message.isInternal ? 'text-primary-foreground' : ''}>
                          {message.content}
                        </div>
                        <div className={`text-xs mt-1 ${message.senderType === 'admin' && !message.isInternal ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                          {new Date(message.createdAt).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    No messages yet
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Send Message Form */}
              {!isResolved && (
                <div className="space-y-3">
                  <Textarea
                    placeholder="Type your message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    rows={3}
                  />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Switch
                        id="internal"
                        checked={isInternalMessage}
                        onCheckedChange={setIsInternalMessage}
                      />
                      <Label htmlFor="internal" className="text-sm text-muted-foreground">
                        Internal note (not visible to users)
                      </Label>
                    </div>
                    <Button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim() || addMessageMutation.isPending}
                    >
                      <Send className="h-4 w-4 mr-2" />
                      {addMessageMutation.isPending ? 'Sending...' : 'Send'}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Status and Actions */}
        <div className="space-y-6">
          {/* Status Control */}
          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select
                value={dispute.status}
                onValueChange={(value) => handleStatusChange(value as DisputeStatus)}
                disabled={isResolved || updateStatusMutation.isPending}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="under_review">Under Review</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
              {isResolved && (
                <p className="text-sm text-muted-foreground">
                  This dispute has been resolved and cannot be modified.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Trade Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Trade Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {dispute.trade && (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Product</span>
                    <span>{dispute.trade.product?.name || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Phase</span>
                    <Badge variant="outline" className="text-xs">
                      {dispute.trade.tradePhase}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Buyer</span>
                    <span>{dispute.trade.buyer?.mail || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Seller</span>
                    <span>{dispute.trade.seller?.mail || '-'}</span>
                  </div>
                </>
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
                <span>{new Date(dispute.createdAt).toLocaleString()}</span>
              </div>
              {dispute.assignedAt && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Assigned</span>
                  <span>{new Date(dispute.assignedAt).toLocaleString()}</span>
                </div>
              )}
              {dispute.resolvedAt && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Resolved</span>
                  <span>{new Date(dispute.resolvedAt).toLocaleString()}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Resolve Dialog */}
      <Dialog open={resolveDialogOpen} onOpenChange={setResolveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolve Dispute</DialogTitle>
            <DialogDescription>
              Provide resolution notes to close this dispute. This will be visible to the user who raised the dispute.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Enter resolution notes..."
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResolveDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleResolve}
              disabled={resolutionNotes.trim().length < 10 || resolveMutation.isPending}
            >
              {resolveMutation.isPending ? 'Resolving...' : 'Resolve Dispute'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
