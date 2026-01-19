import { useState } from 'react'
import { format } from 'date-fns'
import {
  Bell,
  Plus,
  MoreHorizontal,
  Trash2,
  Edit,
  Play,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import {
  useAlertRules,
  useAlertHistory,
  useCreateAlertRule,
  useUpdateAlertRule,
  useDeleteAlertRule,
  useToggleAlertRule,
  useSendTestAlert,
} from '../hooks/useAlerts'
import {
  AlertEventType,
  AlertEmailStatus,
  EVENT_TYPE_LABELS,
  EVENT_TYPE_DESCRIPTIONS,
} from '../types'
import type { AlertRule, AlertHistoryQueryParams, CreateAlertRuleDto } from '../types'

function formatDate(dateStr: string) {
  try {
    return format(new Date(dateStr), 'MMM d, yyyy HH:mm')
  } catch {
    return dateStr
  }
}

export function AlertsPage() {
  const { toast } = useToast()

  // Dialog states
  const [ruleDialog, setRuleDialog] = useState<{
    open: boolean
    mode: 'create' | 'edit'
    rule: AlertRule | null
  }>({ open: false, mode: 'create', rule: null })
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean
    rule: AlertRule | null
  }>({ open: false, rule: null })

  // Form state
  const [formData, setFormData] = useState<CreateAlertRuleDto>({
    name: '',
    eventType: AlertEventType.USER_SUSPENDED,
    recipients: [],
    cooldownMinutes: 60,
  })
  const [recipientInput, setRecipientInput] = useState('')

  // History query params
  const [historyParams, setHistoryParams] = useState<AlertHistoryQueryParams>({
    page: 1,
    limit: 20,
  })

  // Queries and mutations
  const { data: rules, isLoading: rulesLoading } = useAlertRules()
  const { data: history, isLoading: historyLoading } = useAlertHistory(historyParams)
  const createMutation = useCreateAlertRule()
  const updateMutation = useUpdateAlertRule()
  const deleteMutation = useDeleteAlertRule()
  const toggleMutation = useToggleAlertRule()
  const testMutation = useSendTestAlert()

  const openCreateDialog = () => {
    setFormData({
      name: '',
      eventType: AlertEventType.USER_SUSPENDED,
      recipients: [],
      cooldownMinutes: 60,
    })
    setRecipientInput('')
    setRuleDialog({ open: true, mode: 'create', rule: null })
  }

  const openEditDialog = (rule: AlertRule) => {
    setFormData({
      name: rule.name,
      eventType: rule.eventType,
      threshold: rule.threshold,
      timeWindowMinutes: rule.timeWindowMinutes,
      recipients: rule.recipients,
      cooldownMinutes: rule.cooldownMinutes,
    })
    setRecipientInput('')
    setRuleDialog({ open: true, mode: 'edit', rule })
  }

  const addRecipient = () => {
    const email = recipientInput.trim().toLowerCase()
    if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      if (!formData.recipients.includes(email)) {
        setFormData((prev) => ({
          ...prev,
          recipients: [...prev.recipients, email],
        }))
      }
      setRecipientInput('')
    }
  }

  const removeRecipient = (email: string) => {
    setFormData((prev) => ({
      ...prev,
      recipients: prev.recipients.filter((r) => r !== email),
    }))
  }

  const handleSaveRule = async () => {
    if (!formData.name.trim() || formData.recipients.length === 0) {
      toast({
        title: 'Validation Error',
        description: 'Name and at least one recipient are required',
        variant: 'destructive',
      })
      return
    }

    try {
      if (ruleDialog.mode === 'create') {
        await createMutation.mutateAsync(formData)
        toast({ title: 'Alert rule created successfully' })
      } else {
        await updateMutation.mutateAsync({
          ruleId: ruleDialog.rule!._id,
          data: formData,
        })
        toast({ title: 'Alert rule updated successfully' })
      }
      setRuleDialog({ open: false, mode: 'create', rule: null })
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err?.response?.data?.message || 'Operation failed',
        variant: 'destructive',
      })
    }
  }

  const handleDelete = async () => {
    if (!deleteDialog.rule) return

    try {
      await deleteMutation.mutateAsync(deleteDialog.rule._id)
      toast({ title: 'Alert rule deleted successfully' })
      setDeleteDialog({ open: false, rule: null })
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err?.response?.data?.message || 'Failed to delete rule',
        variant: 'destructive',
      })
    }
  }

  const handleToggle = async (rule: AlertRule) => {
    try {
      await toggleMutation.mutateAsync(rule._id)
      toast({
        title: rule.isEnabled ? 'Alert rule disabled' : 'Alert rule enabled',
      })
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err?.response?.data?.message || 'Failed to toggle rule',
        variant: 'destructive',
      })
    }
  }

  const handleSendTest = async (rule: AlertRule) => {
    try {
      await testMutation.mutateAsync(rule._id)
      toast({ title: 'Test alert sent successfully' })
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err?.response?.data?.message || 'Failed to send test alert',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Alerts</h1>
          <p className="text-muted-foreground">
            Configure email alerts for critical platform events
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Create Alert Rule
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="rules">
        <TabsList>
          <TabsTrigger value="rules">Alert Rules</TabsTrigger>
          <TabsTrigger value="history">Alert History</TabsTrigger>
        </TabsList>

        {/* Rules Tab */}
        <TabsContent value="rules" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Alert Rules ({rules?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {rulesLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : rules && rules.length > 0 ? (
                <div className="space-y-4">
                  {rules.map((rule) => (
                    <div
                      key={rule._id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <Switch
                          checked={rule.isEnabled}
                          onCheckedChange={() => handleToggle(rule)}
                        />
                        <div>
                          <p className="font-medium">{rule.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline">
                              {EVENT_TYPE_LABELS[rule.eventType]}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {rule.recipients?.length ?? 0} recipient(s)
                            </span>
                            {rule.lastTriggeredAt && (
                              <span className="text-sm text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                Last: {formatDate(rule.lastTriggeredAt)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditDialog(rule)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleSendTest(rule)}
                            disabled={testMutation.isPending}
                          >
                            <Play className="mr-2 h-4 w-4" />
                            Send Test Alert
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() =>
                              setDeleteDialog({ open: true, rule })
                            }
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No alert rules configured</p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={openCreateDialog}
                  >
                    Create your first alert rule
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Alert History</CardTitle>
            </CardHeader>
            <CardContent>
              {historyLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                            Triggered
                          </th>
                          <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                            Rule
                          </th>
                          <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                            Event Type
                          </th>
                          <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                            Recipients
                          </th>
                          <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {history?.data?.map((item) => (
                          <tr key={item._id} className="border-b hover:bg-muted/50">
                            <td className="py-3 px-4 text-sm">
                              {formatDate(item.triggeredAt)}
                            </td>
                            <td className="py-3 px-4">{item.ruleName}</td>
                            <td className="py-3 px-4">
                              <Badge variant="outline">
                                {EVENT_TYPE_LABELS[item.eventType]}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 text-sm">
                              {item.recipientsSent?.length ?? 0} sent
                            </td>
                            <td className="py-3 px-4">
                              {item.emailStatus === AlertEmailStatus.SENT ? (
                                <Badge
                                  variant="outline"
                                  className="text-green-600 border-green-600"
                                >
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Sent
                                </Badge>
                              ) : (
                                <Badge variant="destructive">
                                  <XCircle className="h-3 w-3 mr-1" />
                                  Failed
                                </Badge>
                              )}
                            </td>
                          </tr>
                        ))}
                        {(history?.data?.length ?? 0) === 0 && (
                          <tr>
                            <td
                              colSpan={5}
                              className="py-8 text-center text-muted-foreground"
                            >
                              No alert history found
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {history && history.totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4 pt-4 border-t">
                      <div className="text-sm text-muted-foreground">
                        Page {history.page} of {history.totalPages}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={history.page <= 1}
                          onClick={() =>
                            setHistoryParams((prev) => ({
                              ...prev,
                              page: prev.page! - 1,
                            }))
                          }
                        >
                          <ChevronLeft className="h-4 w-4" />
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={history.page >= history.totalPages}
                          onClick={() =>
                            setHistoryParams((prev) => ({
                              ...prev,
                              page: prev.page! + 1,
                            }))
                          }
                        >
                          Next
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create/Edit Dialog */}
      <Dialog
        open={ruleDialog.open}
        onOpenChange={(open) =>
          !open && setRuleDialog({ open: false, mode: 'create', rule: null })
        }
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {ruleDialog.mode === 'create' ? 'Create Alert Rule' : 'Edit Alert Rule'}
            </DialogTitle>
            <DialogDescription>
              Configure when and how alerts are sent
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Rule Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="e.g., KYC Backlog Alert"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="eventType">Event Type</Label>
              <Select
                value={formData.eventType}
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    eventType: value as AlertEventType,
                  }))
                }
                disabled={ruleDialog.mode === 'edit'}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(AlertEventType).map((type) => (
                    <SelectItem key={type} value={type}>
                      <div>
                        <p>{EVENT_TYPE_LABELS[type]}</p>
                        <p className="text-xs text-muted-foreground">
                          {EVENT_TYPE_DESCRIPTIONS[type]}
                        </p>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {[
              AlertEventType.KYC_PENDING_THRESHOLD,
              AlertEventType.TRADE_STALLED,
              AlertEventType.FAILED_LOGIN_SPIKE,
            ].includes(formData.eventType) && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="threshold">Threshold</Label>
                  <Input
                    id="threshold"
                    type="number"
                    value={formData.threshold || ''}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        threshold: parseInt(e.target.value) || undefined,
                      }))
                    }
                    placeholder="e.g., 50"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="timeWindow">Time Window (min)</Label>
                  <Input
                    id="timeWindow"
                    type="number"
                    value={formData.timeWindowMinutes || ''}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        timeWindowMinutes: parseInt(e.target.value) || undefined,
                      }))
                    }
                    placeholder="e.g., 60"
                    className="mt-1"
                  />
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="cooldown">Cooldown (minutes)</Label>
              <Input
                id="cooldown"
                type="number"
                value={formData.cooldownMinutes}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    cooldownMinutes: parseInt(e.target.value) || 60,
                  }))
                }
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Minimum time between alerts (default: 60 min)
              </p>
            </div>

            <div>
              <Label>Recipients</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  value={recipientInput}
                  onChange={(e) => setRecipientInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addRecipient()}
                  placeholder="email@example.com"
                />
                <Button type="button" onClick={addRecipient}>
                  Add
                </Button>
              </div>
              {formData.recipients.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.recipients.map((email) => (
                    <Badge key={email} variant="secondary">
                      {email}
                      <button
                        type="button"
                        className="ml-1 hover:text-destructive"
                        onClick={() => removeRecipient(email)}
                      >
                        &times;
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setRuleDialog({ open: false, mode: 'create', rule: null })
              }
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveRule}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending
                ? 'Saving...'
                : ruleDialog.mode === 'create'
                  ? 'Create Rule'
                  : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={deleteDialog.open}
        onOpenChange={(open) =>
          !open && setDeleteDialog({ open: false, rule: null })
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Alert Rule</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteDialog.rule?.name}"? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
