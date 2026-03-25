import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Send,
  Eye,
  Loader2,
  Image as ImageIcon,
  Tag,
  Folder,
  Hash,
  Globe,
  Lock,
  Pin,
  Star,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronDown,
  Check,
  Settings2,
  Search,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { TiptapEditor } from '../components/TiptapEditor';
import {
  useBlogPost,
  useCreateBlogPost,
  useUpdateBlogPost,
  usePublishBlogPost,
  useApproveBlogPost,
  useRejectBlogPost,
  useRequestRevision,
  useTogglePinned,
  useToggleFeatured,
  useUploadBlogImage,
  useCheckSlugAvailability,
} from '../hooks/useBlogs';
import type { BlogFormData, BlogAccessLevel } from '../types';
import { defaultBlogFormData, defaultTiptapContent, STATUS_LABELS, STATUS_COLORS } from '../types';

/**
 * BlogEditorPage - Streamlined Admin Blog Editor
 *
 * Clean 2-column layout with:
 * - Inline title (no card wrapper)
 * - Editor flows naturally
 * - Collapsible sidebar sections
 * - Working preview with actual Tiptap content
 * - Auto-save every 30s
 * - Editorial workflow (approve/reject/revision)
 */
export function BlogEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isEditing = !!id;

  // Form state
  const [formData, setFormData] = useState<BlogFormData>(defaultBlogFormData);
  const [tagInput, setTagInput] = useState('');
  const [categoryInput, setCategoryInput] = useState('');
  const [hsnInput, setHsnInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Dialog states
  const [previewOpen, setPreviewOpen] = useState(false);
  const [rejectDialog, setRejectDialog] = useState(false);
  const [revisionDialog, setRevisionDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [revisionNotes, setRevisionNotes] = useState('');

  // Fix: Slug validation state
  const [slugStatus, setSlugStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const slugCheckTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Collapsible sidebar sections
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    settings: true,
    image: true,
    organization: true,
    seo: false,
    toggles: true, // Expanded by default to show Featured/Pinned toggles
  });

  // Auto-save ref
  const autoSaveRef = useRef<NodeJS.Timeout | null>(null);
  const isSavingRef = useRef(false); // Fix: Prevent concurrent saves

  // Queries & Mutations
  const { data: existingPost, isLoading: postLoading } = useBlogPost(id || '');
  const createMutation = useCreateBlogPost();
  const updateMutation = useUpdateBlogPost();
  const publishMutation = usePublishBlogPost();
  const approveMutation = useApproveBlogPost();
  const rejectMutation = useRejectBlogPost();
  const revisionMutation = useRequestRevision();
  const pinnedMutation = useTogglePinned();
  const featuredMutation = useToggleFeatured();
  const uploadImageMutation = useUploadBlogImage();
  const checkSlugMutation = useCheckSlugAvailability();

  // Load existing post data
  useEffect(() => {
    if (existingPost) {
      setFormData({
        title: existingPost.title,
        slug: existingPost.slug,
        tiptapContent: existingPost.tiptapContent || defaultTiptapContent,
        excerpt: existingPost.excerpt,
        featuredImage: existingPost.featuredImage || '',
        accessLevel: existingPost.accessLevel,
        categories: existingPost.categories,
        tags: existingPost.tags,
        hsnCodePrefixes: existingPost.hsnCodePrefixes,
        metaTitle: existingPost.metaTitle || '',
        metaDescription: existingPost.metaDescription || '',
      });
    }
  }, [existingPost]);

  // Auto-generate slug from title
  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  // Fix: Debounced slug availability check
  const checkSlugAvailability = useCallback((slug: string) => {
    if (slugCheckTimeoutRef.current) {
      clearTimeout(slugCheckTimeoutRef.current);
    }

    if (!slug.trim()) {
      setSlugStatus('idle');
      return;
    }

    setSlugStatus('checking');
    slugCheckTimeoutRef.current = setTimeout(async () => {
      try {
        const result = await checkSlugMutation.mutateAsync({
          slug: slug.trim(),
          excludePostId: id, // Exclude current post when editing
        });
        setSlugStatus(result?.available ? 'available' : 'taken');
      } catch {
        // If the endpoint doesn't exist yet, assume slug is available
        setSlugStatus('available');
      }
    }, 500); // 500ms debounce
  }, [checkSlugMutation, id]);

  // Cleanup slug check timeout on unmount
  useEffect(() => {
    return () => {
      if (slugCheckTimeoutRef.current) {
        clearTimeout(slugCheckTimeoutRef.current);
      }
    };
  }, []);

  const handleTitleChange = (title: string) => {
    setFormData((prev) => ({
      ...prev,
      title,
      slug: !prev.slug || prev.slug === generateSlug(prev.title)
        ? generateSlug(title)
        : prev.slug,
    }));
    setIsDirty(true);
  };

  // Tag/Category/HSN management
  const addItem = (type: 'tags' | 'categories' | 'hsnCodePrefixes', value: string) => {
    if (value.trim() && !formData[type].includes(value.trim())) {
      setFormData((prev) => ({
        ...prev,
        [type]: [...prev[type], value.trim()],
      }));
      setIsDirty(true);
    }
  };

  const removeItem = (type: 'tags' | 'categories' | 'hsnCodePrefixes', value: string) => {
    setFormData((prev) => ({
      ...prev,
      [type]: prev[type].filter((item) => item !== value),
    }));
    setIsDirty(true);
  };

  // Image upload - Fix: Better response validation
  const handleImageUpload = async (file: File): Promise<string> => {
    try {
      const result = await uploadImageMutation.mutateAsync(file);
      if (!result || !result.data || !result.data.url) {
        throw new Error('Invalid upload response: missing URL');
      }
      return result.data.url;
    } catch (error: any) {
      console.error('Image upload failed:', error);
      throw error; // Re-throw to let caller handle
    }
  };

  const handleFeaturedImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const result = await uploadImageMutation.mutateAsync(file);
      if (result.data?.url) {
        setFormData((prev) => ({ ...prev, featuredImage: result.data!.url }));
        setIsDirty(true);
        toast({ title: 'Image uploaded', description: 'Featured image has been set.' });
      }
    } catch {
      toast({ title: 'Upload failed', description: 'Failed to upload image.', variant: 'destructive' });
    }
  };

  // Save as draft - Fix: Use ref to prevent race conditions
  const handleSave = useCallback(async () => {
    if (!formData.title.trim()) {
      toast({ title: 'Title required', description: 'Please enter a title.', variant: 'destructive' });
      return;
    }

    // Fix: Prevent save if slug is taken
    if (slugStatus === 'taken') {
      toast({ title: 'Slug unavailable', description: 'Please choose a different slug.', variant: 'destructive' });
      return;
    }

    // Prevent concurrent saves
    if (isSavingRef.current) {
      return;
    }

    setIsSaving(true);
    isSavingRef.current = true;
    try {
      const dto = {
        title: formData.title,
        slug: formData.slug || generateSlug(formData.title),
        tiptapContent: formData.tiptapContent,
        excerpt: formData.excerpt,
        featuredImage: formData.featuredImage || undefined,
        accessLevel: formData.accessLevel,
        categories: formData.categories,
        tags: formData.tags,
        hsnCodePrefixes: formData.hsnCodePrefixes,
        metaTitle: formData.metaTitle || undefined,
        metaDescription: formData.metaDescription || undefined,
        status: 'draft' as const,
      };

      if (isEditing) {
        await updateMutation.mutateAsync({ postId: id!, data: dto });
      } else {
        const result = await createMutation.mutateAsync(dto);
        navigate(`/blog/${result.data?._id}/edit`, { replace: true });
      }
      setLastSaved(new Date());
      setIsDirty(false);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.response?.data?.message || 'Failed to save.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
      isSavingRef.current = false;
    }
  }, [formData, isEditing, id, updateMutation, createMutation, toast, navigate, slugStatus]);

  // Fix: Auto-save timer with debouncing to prevent race conditions
  useEffect(() => {
    // Clear any existing timeout
    if (autoSaveRef.current) {
      clearTimeout(autoSaveRef.current);
      autoSaveRef.current = null;
    }

    // Only schedule auto-save if dirty, editing, has title, and not currently saving
    if (isDirty && isEditing && formData.title.trim() && !isSavingRef.current) {
      autoSaveRef.current = setTimeout(() => {
        // Double-check we're not already saving before triggering
        if (!isSavingRef.current) {
          handleSave();
        }
      }, 30000);
    }
    return () => {
      if (autoSaveRef.current) {
        clearTimeout(autoSaveRef.current);
        autoSaveRef.current = null;
      }
    };
  }, [isDirty, isEditing, handleSave, formData.title]);

  // Fix: beforeunload handler to warn about unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        // Modern browsers ignore custom messages, but still show a generic warning
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  // Publish
  const handlePublish = async () => {
    if (!formData.title.trim()) {
      toast({ title: 'Title required', variant: 'destructive' });
      return;
    }

    // Fix: Prevent publish if slug is taken
    if (slugStatus === 'taken') {
      toast({ title: 'Slug unavailable', description: 'Please choose a different slug.', variant: 'destructive' });
      return;
    }

    setIsSaving(true);
    try {
      const dto = {
        title: formData.title,
        slug: formData.slug || generateSlug(formData.title),
        tiptapContent: formData.tiptapContent,
        excerpt: formData.excerpt,
        featuredImage: formData.featuredImage || undefined,
        accessLevel: formData.accessLevel,
        categories: formData.categories,
        tags: formData.tags,
        hsnCodePrefixes: formData.hsnCodePrefixes,
        metaTitle: formData.metaTitle,
        metaDescription: formData.metaDescription,
      };

      let postId = id;
      if (isEditing) {
        await updateMutation.mutateAsync({ postId: id!, data: dto });
      } else {
        const result = await createMutation.mutateAsync({ ...dto, status: 'draft' });
        postId = result.data?._id;
      }

      // Fix: Better error handling when postId is undefined
      if (!postId) {
        throw new Error('Failed to get post ID after save. Please try again.');
      }

      await publishMutation.mutateAsync(postId);
      toast({ title: 'Post published!' });
      navigate('/blog');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.response?.data?.message || 'Failed to publish.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Editorial actions
  const handleApprove = async () => {
    if (!id) return;
    try {
      await approveMutation.mutateAsync(id);
      toast({ title: 'Post approved' });
    } catch (error: any) {
      toast({ title: 'Error', description: error?.response?.data?.message || 'Failed to approve.', variant: 'destructive' });
    }
  };

  const handleReject = async () => {
    if (!id || !rejectReason.trim()) return;
    try {
      await rejectMutation.mutateAsync({ postId: id, reason: rejectReason });
      toast({ title: 'Post rejected' });
      setRejectDialog(false);
      setRejectReason('');
    } catch (error: any) {
      toast({ title: 'Error', description: error?.response?.data?.message || 'Failed to reject.', variant: 'destructive' });
    }
  };

  const handleRequestRevision = async () => {
    if (!id || !revisionNotes.trim()) return;
    try {
      await revisionMutation.mutateAsync({ postId: id, notes: revisionNotes });
      toast({ title: 'Revision requested' });
      setRevisionDialog(false);
      setRevisionNotes('');
    } catch (error: any) {
      toast({ title: 'Error', description: error?.response?.data?.message || 'Failed to request revision.', variant: 'destructive' });
    }
  };

  const handleTogglePinned = async () => {
    if (!id) return;
    try {
      await pinnedMutation.mutateAsync(id);
      toast({ title: existingPost?.isPinned ? 'Unpinned' : 'Pinned!' });
    } catch {
      toast({ title: 'Failed to toggle pinned', variant: 'destructive' });
    }
  };

  const handleToggleFeatured = async () => {
    if (!id) return;
    try {
      await featuredMutation.mutateAsync(id);
      toast({ title: existingPost?.isFeatured ? 'Removed from featured' : 'Marked as featured!' });
    } catch {
      toast({ title: 'Failed to toggle featured', variant: 'destructive' });
    }
  };

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  if (isEditing && postLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const currentStatus = existingPost?.status;
  const statusColor = currentStatus ? STATUS_COLORS[currentStatus] : null;
  const canPublish = currentStatus === 'approved' || currentStatus === 'draft';

  return (
    <div className="space-y-4">
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/blog')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">
            {isEditing ? 'Edit Post' : 'New Post'}
          </h1>
          {currentStatus && (
            <Badge variant="outline" className={`${statusColor?.bg} ${statusColor?.text} ${statusColor?.border}`}>
              {STATUS_LABELS[currentStatus]}
            </Badge>
          )}
          {/* Auto-save indicator */}
          {isEditing && (
            <span className="text-xs text-muted-foreground">
              {isSaving ? (
                <span className="flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" /> Saving...
                </span>
              ) : lastSaved ? (
                <span className="flex items-center gap-1">
                  <Check className="h-3 w-3 text-green-500" />
                  Saved {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              ) : isDirty ? (
                'Unsaved changes'
              ) : null}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setPreviewOpen(true)}>
            <Eye className="h-4 w-4 mr-1" />
            Preview
          </Button>
          <Button variant="outline" size="sm" onClick={handleSave} disabled={isSaving}>
            {isSaving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
            Save
          </Button>
          {canPublish && (
            <Button size="sm" onClick={handlePublish} disabled={isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Send className="h-4 w-4 mr-1" />}
              Publish
            </Button>
          )}
        </div>
      </div>

      {/* ── Editorial Workflow Alert ───────────────────────── */}
      {isEditing && existingPost && (currentStatus === 'submitted' || currentStatus === 'in_review') && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Pending Review</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>This post is awaiting editorial review.</span>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleApprove} disabled={approveMutation.isPending}>
                <CheckCircle className="h-4 w-4 mr-1" /> Approve
              </Button>
              <Button size="sm" variant="outline" onClick={() => setRevisionDialog(true)}>
                Request Revision
              </Button>
              <Button size="sm" variant="destructive" onClick={() => setRejectDialog(true)}>
                <XCircle className="h-4 w-4 mr-1" /> Reject
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {existingPost?.rejectionReason && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertTitle>Rejected</AlertTitle>
          <AlertDescription>{existingPost.rejectionReason}</AlertDescription>
        </Alert>
      )}
      {existingPost?.revisionNotes && currentStatus === 'revision_requested' && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Revision Requested</AlertTitle>
          <AlertDescription>{existingPost.revisionNotes}</AlertDescription>
        </Alert>
      )}

      {/* ── Main Grid ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content (2/3) */}
        <div className="lg:col-span-2 space-y-4">
          {/* Inline Title */}
          <Input
            value={formData.title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="Enter post title..."
            className="text-2xl font-bold border-0 border-b rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary h-auto py-3"
          />

          {/* Editor (no card wrapper) */}
          <TiptapEditor
            content={formData.tiptapContent}
            onChange={(content) => {
              setFormData((prev) => ({ ...prev, tiptapContent: content }));
              setIsDirty(true);
            }}
            onImageUpload={handleImageUpload}
          />

          {/* Excerpt (simple textarea, no card) */}
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Excerpt</Label>
            <Textarea
              value={formData.excerpt}
              onChange={(e) => {
                setFormData((prev) => ({ ...prev, excerpt: e.target.value }));
                setIsDirty(true);
              }}
              placeholder="Brief summary shown in previews (auto-generated if empty)..."
              className="min-h-[80px] resize-none"
            />
          </div>
        </div>

        {/* Sidebar (1/3) */}
        <div className="space-y-3">
          {/* Post Settings */}
          <SidebarSection
            title="Post Settings"
            icon={<Settings2 className="h-4 w-4" />}
            expanded={expandedSections.settings}
            onToggle={() => toggleSection('settings')}
          >
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Slug</Label>
                <div className="relative">
                  <Input
                    value={formData.slug}
                    onChange={(e) => {
                      const newSlug = e.target.value;
                      setFormData((prev) => ({ ...prev, slug: newSlug }));
                      setIsDirty(true);
                      checkSlugAvailability(newSlug);
                    }}
                    placeholder="url-friendly-slug"
                    className={`h-8 text-sm pr-8 ${
                      slugStatus === 'taken' ? 'border-destructive focus-visible:ring-destructive' : ''
                    }`}
                  />
                  {/* Fix: Slug status indicator */}
                  <div className="absolute right-2 top-1/2 -translate-y-1/2">
                    {slugStatus === 'checking' && (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                    {slugStatus === 'available' && (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    )}
                    {slugStatus === 'taken' && (
                      <XCircle className="h-4 w-4 text-destructive" />
                    )}
                  </div>
                </div>
                <p className={`text-xs ${slugStatus === 'taken' ? 'text-destructive' : 'text-muted-foreground'}`}>
                  {slugStatus === 'taken'
                    ? 'This slug is already in use. Please choose a different one.'
                    : `/blog/${formData.slug || 'your-slug'}`
                  }
                </p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Access</Label>
                <Select
                  value={formData.accessLevel}
                  onValueChange={(value: BlogAccessLevel) => {
                    setFormData((prev) => ({ ...prev, accessLevel: value }));
                    setIsDirty(true);
                  }}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">
                      <span className="flex items-center gap-2"><Globe className="h-3.5 w-3.5" /> Public</span>
                    </SelectItem>
                    <SelectItem value="member_only">
                      <span className="flex items-center gap-2"><Lock className="h-3.5 w-3.5" /> Member Only</span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </SidebarSection>

          {/* Featured Image */}
          <SidebarSection
            title="Featured Image"
            icon={<ImageIcon className="h-4 w-4" />}
            expanded={expandedSections.image}
            onToggle={() => toggleSection('image')}
          >
            {formData.featuredImage ? (
              <div className="relative group">
                <img src={formData.featuredImage} alt="Featured" className="w-full rounded-lg" />
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-7 text-xs"
                  onClick={() => {
                    setFormData((prev) => ({ ...prev, featuredImage: '' }));
                    setIsDirty(true);
                  }}
                >
                  Remove
                </Button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-4 cursor-pointer hover:border-primary/50 transition-colors">
                <ImageIcon className="h-6 w-6 text-muted-foreground mb-1" />
                <span className="text-xs text-muted-foreground">Click to upload</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleFeaturedImageUpload} />
              </label>
            )}
          </SidebarSection>

          {/* Organization */}
          <SidebarSection
            title="Organization"
            icon={<Folder className="h-4 w-4" />}
            expanded={expandedSections.organization}
            onToggle={() => toggleSection('organization')}
          >
            <div className="space-y-4">
              {/* Categories */}
              <div className="space-y-2">
                <Label className="text-xs flex items-center gap-1">
                  <Folder className="h-3 w-3" /> Categories
                </Label>
                <div className="flex gap-1.5">
                  <Input
                    value={categoryInput}
                    onChange={(e) => setCategoryInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addItem('categories', categoryInput);
                        setCategoryInput('');
                      }
                    }}
                    placeholder="Add..."
                    className="h-7 text-xs"
                  />
                  <Button
                    variant="secondary"
                    size="sm"
                    className="h-7 text-xs px-2"
                    onClick={() => { addItem('categories', categoryInput); setCategoryInput(''); }}
                  >
                    Add
                  </Button>
                </div>
                {formData.categories.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {formData.categories.map((cat) => (
                      <Badge key={cat} variant="secondary" className="cursor-pointer hover:bg-destructive/20 text-xs" onClick={() => removeItem('categories', cat)}>
                        {cat} &times;
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <Label className="text-xs flex items-center gap-1">
                  <Tag className="h-3 w-3" /> Tags
                </Label>
                <div className="flex gap-1.5">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addItem('tags', tagInput);
                        setTagInput('');
                      }
                    }}
                    placeholder="Add..."
                    className="h-7 text-xs"
                  />
                  <Button
                    variant="secondary"
                    size="sm"
                    className="h-7 text-xs px-2"
                    onClick={() => { addItem('tags', tagInput); setTagInput(''); }}
                  >
                    Add
                  </Button>
                </div>
                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {formData.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="cursor-pointer hover:bg-destructive/20 text-xs" onClick={() => removeItem('tags', tag)}>
                        {tag} &times;
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* HSN Prefixes */}
              <div className="space-y-2">
                <Label className="text-xs flex items-center gap-1">
                  <Hash className="h-3 w-3" /> HSN Prefixes
                </Label>
                <div className="flex gap-1.5">
                  <Input
                    value={hsnInput}
                    onChange={(e) => setHsnInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addItem('hsnCodePrefixes', hsnInput);
                        setHsnInput('');
                      }
                    }}
                    placeholder="e.g., 01, 10..."
                    maxLength={4}
                    className="h-7 text-xs"
                  />
                  <Button
                    variant="secondary"
                    size="sm"
                    className="h-7 text-xs px-2"
                    onClick={() => { addItem('hsnCodePrefixes', hsnInput); setHsnInput(''); }}
                  >
                    Add
                  </Button>
                </div>
                {formData.hsnCodePrefixes.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {formData.hsnCodePrefixes.map((hsn) => (
                      <Badge key={hsn} variant="outline" className="cursor-pointer hover:bg-destructive/20 text-xs font-mono" onClick={() => removeItem('hsnCodePrefixes', hsn)}>
                        {hsn} &times;
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </SidebarSection>

          {/* SEO */}
          <SidebarSection
            title="SEO"
            icon={<Search className="h-4 w-4" />}
            expanded={expandedSections.seo}
            onToggle={() => toggleSection('seo')}
          >
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Meta Title</Label>
                <Input
                  value={formData.metaTitle}
                  onChange={(e) => {
                    setFormData((prev) => ({ ...prev, metaTitle: e.target.value }));
                    setIsDirty(true);
                  }}
                  placeholder="Defaults to post title"
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Meta Description</Label>
                <Textarea
                  value={formData.metaDescription}
                  onChange={(e) => {
                    setFormData((prev) => ({ ...prev, metaDescription: e.target.value }));
                    setIsDirty(true);
                  }}
                  placeholder="Defaults to excerpt"
                  className="min-h-[60px] text-sm resize-none"
                />
              </div>
            </div>
          </SidebarSection>

          {/* Settings (Featured/Pinned) - only when editing */}
          {isEditing && existingPost && (
            <SidebarSection
              title="Settings"
              icon={<Settings2 className="h-4 w-4" />}
              expanded={expandedSections.toggles}
              onToggle={() => toggleSection('toggles')}
            >
              <div className="space-y-4">
                {/* Featured Toggle */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Star className={`h-3.5 w-3.5 ${existingPost.isFeatured ? 'fill-amber-500 text-amber-500' : ''}`} />
                      <span className="text-sm font-medium">Featured</span>
                    </div>
                    <Switch
                      checked={existingPost.isFeatured}
                      onCheckedChange={handleToggleFeatured}
                      disabled={featuredMutation.isPending}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Featured posts appear as large cards in the blog grid for better visibility.
                  </p>
                </div>

                <div className="border-t pt-4">
                  {/* Pinned Toggle */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Pin className={`h-3.5 w-3.5 ${existingPost.isPinned ? 'fill-blue-500 text-blue-500' : ''}`} />
                        <span className="text-sm font-medium">Pinned</span>
                      </div>
                      <Switch
                        checked={existingPost.isPinned}
                        onCheckedChange={handleTogglePinned}
                        disabled={pinnedMutation.isPending}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Only one post can be pinned at a time. Pinning will unpin any other pinned post.
                    </p>
                  </div>
                </div>
              </div>
            </SidebarSection>
          )}
        </div>
      </div>

      {/* ── Preview Dialog (with actual Tiptap content) ───── */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Preview</DialogTitle>
            <DialogDescription>This is how your post will appear.</DialogDescription>
          </DialogHeader>
          <article className="mt-4">
            {formData.featuredImage && (
              <img src={formData.featuredImage} alt={formData.title} className="w-full rounded-lg mb-6" />
            )}
            <h1 className="text-3xl font-bold mb-4">{formData.title || 'Untitled'}</h1>
            <div className="flex flex-wrap gap-2 mb-6">
              {formData.categories.map((cat) => (
                <Badge key={cat} variant="secondary">{cat}</Badge>
              ))}
            </div>
            {/* Render actual Tiptap content in read-only mode */}
            <TiptapEditor
              content={formData.tiptapContent}
              onChange={() => {}}
              editable={false}
              placeholder=""
            />
          </article>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Reject Dialog ──────────────────────────────────── */}
      <Dialog open={rejectDialog} onOpenChange={setRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Post</DialogTitle>
            <DialogDescription>Provide a reason for rejection.</DialogDescription>
          </DialogHeader>
          <Textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Reason for rejection..."
            className="min-h-[100px]"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialog(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleReject} disabled={!rejectReason.trim() || rejectMutation.isPending}>
              {rejectMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Revision Dialog ────────────────────────────────── */}
      <Dialog open={revisionDialog} onOpenChange={setRevisionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Revision</DialogTitle>
            <DialogDescription>Provide feedback for the writer.</DialogDescription>
          </DialogHeader>
          <Textarea
            value={revisionNotes}
            onChange={(e) => setRevisionNotes(e.target.value)}
            placeholder="What needs to be changed..."
            className="min-h-[100px]"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRevisionDialog(false)}>Cancel</Button>
            <Button onClick={handleRequestRevision} disabled={!revisionNotes.trim() || revisionMutation.isPending}>
              {revisionMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Request Revision
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Collapsible Sidebar Section
// ─────────────────────────────────────────────────────────────

function SidebarSection({
  title,
  icon,
  expanded,
  onToggle,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 bg-muted/50 hover:bg-muted transition-colors text-sm font-medium"
      >
        <span className="flex items-center gap-2">
          {icon}
          {title}
        </span>
        <ChevronDown className={`h-4 w-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>
      {expanded && <div className="px-4 py-3">{children}</div>}
    </div>
  );
}
