import { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { BlockEditor } from '../components/BlockEditor';
import {
  useBlogPost,
  useCreateBlogPost,
  useUpdateBlogPost,
  usePublishBlogPost,
  useUploadBlogImage,
} from '../hooks/useBlogs';
import type { BlogFormData, BlockContent } from '../types';
import { defaultBlogFormData } from '../types';

/**
 * BlogEditorPage - Create or edit a blog post
 *
 * Features:
 * - Block-based content editor
 * - Featured image upload
 * - Categories, tags, and HSN code prefixes
 * - Auto-generated slug from title
 * - Save as draft or publish
 * - Preview modal
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
  const [previewOpen, setPreviewOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Queries & Mutations
  const { data: existingPost, isLoading: postLoading } = useBlogPost(id || '');
  const createMutation = useCreateBlogPost();
  const updateMutation = useUpdateBlogPost();
  const publishMutation = usePublishBlogPost();
  const uploadImageMutation = useUploadBlogImage();

  // Load existing post data
  useEffect(() => {
    if (existingPost) {
      setFormData({
        title: existingPost.title,
        slug: existingPost.slug,
        content: existingPost.content,
        excerpt: existingPost.excerpt,
        featuredImage: existingPost.featuredImage || '',
        categories: existingPost.categories,
        tags: existingPost.tags,
        hsnCodePrefixes: existingPost.hsnCodePrefixes,
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

  const handleTitleChange = (title: string) => {
    setFormData((prev) => ({
      ...prev,
      title,
      slug: !prev.slug || prev.slug === generateSlug(prev.title)
        ? generateSlug(title)
        : prev.slug,
    }));
  };

  // Tag management
  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()],
      }));
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tag),
    }));
  };

  // Category management
  const addCategory = () => {
    if (categoryInput.trim() && !formData.categories.includes(categoryInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        categories: [...prev.categories, categoryInput.trim()],
      }));
      setCategoryInput('');
    }
  };

  const removeCategory = (cat: string) => {
    setFormData((prev) => ({
      ...prev,
      categories: prev.categories.filter((c) => c !== cat),
    }));
  };

  // HSN prefix management
  const addHsnPrefix = () => {
    if (hsnInput.trim() && !formData.hsnCodePrefixes.includes(hsnInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        hsnCodePrefixes: [...prev.hsnCodePrefixes, hsnInput.trim()],
      }));
      setHsnInput('');
    }
  };

  const removeHsnPrefix = (hsn: string) => {
    setFormData((prev) => ({
      ...prev,
      hsnCodePrefixes: prev.hsnCodePrefixes.filter((h) => h !== hsn),
    }));
  };

  // Image upload handler for block editor
  const handleImageUpload = async (file: File): Promise<string> => {
    const result = await uploadImageMutation.mutateAsync(file);
    return result.data?.url || '';
  };

  // Featured image upload
  const handleFeaturedImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const result = await uploadImageMutation.mutateAsync(file);
      if (result.data?.url) {
        setFormData((prev) => ({ ...prev, featuredImage: result.data!.url }));
        toast({ title: 'Image uploaded', description: 'Featured image has been set.' });
      }
    } catch (error) {
      toast({
        title: 'Upload failed',
        description: 'Failed to upload image. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Save as draft
  const handleSave = async () => {
    if (!formData.title.trim()) {
      toast({
        title: 'Title required',
        description: 'Please enter a title for your post.',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      const dto = {
        title: formData.title,
        slug: formData.slug || generateSlug(formData.title),
        content: formData.content,
        excerpt: formData.excerpt,
        featuredImage: formData.featuredImage || undefined,
        categories: formData.categories,
        tags: formData.tags,
        hsnCodePrefixes: formData.hsnCodePrefixes,
        status: 'draft' as const,
      };

      if (isEditing) {
        await updateMutation.mutateAsync({ postId: id!, data: dto });
        toast({ title: 'Post updated', description: 'Your changes have been saved.' });
      } else {
        const result = await createMutation.mutateAsync(dto);
        toast({ title: 'Post created', description: 'Your draft has been saved.' });
        navigate(`/blog/${result.data?._id}/edit`);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.response?.data?.message || 'Failed to save post.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Save and publish
  const handlePublish = async () => {
    if (!formData.title.trim()) {
      toast({
        title: 'Title required',
        description: 'Please enter a title for your post.',
        variant: 'destructive',
      });
      return;
    }

    if (formData.content.length === 0 || !formData.content.some((b) => b.content.trim())) {
      toast({
        title: 'Content required',
        description: 'Please add some content to your post.',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      const dto = {
        title: formData.title,
        slug: formData.slug || generateSlug(formData.title),
        content: formData.content,
        excerpt: formData.excerpt,
        featuredImage: formData.featuredImage || undefined,
        categories: formData.categories,
        tags: formData.tags,
        hsnCodePrefixes: formData.hsnCodePrefixes,
      };

      let postId = id;

      if (isEditing) {
        await updateMutation.mutateAsync({ postId: id!, data: dto });
      } else {
        const result = await createMutation.mutateAsync({ ...dto, status: 'draft' });
        postId = result.data?._id;
      }

      if (postId) {
        await publishMutation.mutateAsync(postId);
        toast({ title: 'Post published', description: 'Your post is now live!' });
        navigate('/blog');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.response?.data?.message || 'Failed to publish post.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isEditing && postLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/blog')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              {isEditing ? 'Edit Post' : 'New Post'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isEditing ? 'Update your blog post' : 'Create a new blog post'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setPreviewOpen(true)}>
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button variant="outline" onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Draft
          </Button>
          <Button onClick={handlePublish} disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            Publish
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Title & Slug */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="Enter post title..."
                  className="text-xl font-semibold"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">Slug</Label>
                <div className="flex gap-2">
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, slug: e.target.value }))
                    }
                    placeholder="url-friendly-slug"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  URL: /blog/{formData.slug || 'your-slug'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Content Editor */}
          <Card>
            <CardHeader>
              <CardTitle>Content</CardTitle>
            </CardHeader>
            <CardContent>
              <BlockEditor
                blocks={formData.content}
                onChange={(blocks) =>
                  setFormData((prev) => ({ ...prev, content: blocks }))
                }
                onImageUpload={handleImageUpload}
              />
            </CardContent>
          </Card>

          {/* Excerpt */}
          <Card>
            <CardHeader>
              <CardTitle>Excerpt</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.excerpt}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, excerpt: e.target.value }))
                }
                placeholder="Brief summary of the post (optional, will be auto-generated if empty)..."
                className="min-h-[100px]"
              />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Featured Image */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                Featured Image
              </CardTitle>
            </CardHeader>
            <CardContent>
              {formData.featuredImage ? (
                <div className="relative group">
                  <img
                    src={formData.featuredImage}
                    alt="Featured"
                    className="w-full rounded-lg"
                  />
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100"
                    onClick={() =>
                      setFormData((prev) => ({ ...prev, featuredImage: '' }))
                    }
                  >
                    Remove
                  </Button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 cursor-pointer hover:border-primary/50 transition-colors">
                  <ImageIcon className="h-8 w-8 text-muted-foreground mb-2" />
                  <span className="text-sm text-muted-foreground">
                    Click to upload
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFeaturedImageUpload}
                  />
                </label>
              )}
            </CardContent>
          </Card>

          {/* Categories */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Folder className="h-4 w-4" />
                Categories
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Input
                  value={categoryInput}
                  onChange={(e) => setCategoryInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCategory())}
                  placeholder="Add category..."
                />
                <Button variant="secondary" onClick={addCategory}>
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.categories.map((cat) => (
                  <Badge
                    key={cat}
                    variant="secondary"
                    className="cursor-pointer hover:bg-destructive/20"
                    onClick={() => removeCategory(cat)}
                  >
                    {cat} ×
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Tags */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Tags
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  placeholder="Add tag..."
                />
                <Button variant="secondary" onClick={addTag}>
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="cursor-pointer hover:bg-destructive/20"
                    onClick={() => removeTag(tag)}
                  >
                    {tag} ×
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* HSN Code Prefixes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Hash className="h-4 w-4" />
                HSN Code Prefixes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Input
                  value={hsnInput}
                  onChange={(e) => setHsnInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addHsnPrefix())}
                  placeholder="e.g., 01, 10, 27..."
                  maxLength={4}
                />
                <Button variant="secondary" onClick={addHsnPrefix}>
                  Add
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Match users by product HSN codes (chapter level)
              </p>
              <div className="flex flex-wrap gap-2">
                {formData.hsnCodePrefixes.map((hsn) => (
                  <Badge
                    key={hsn}
                    variant="outline"
                    className="cursor-pointer hover:bg-destructive/20 font-mono"
                    onClick={() => removeHsnPrefix(hsn)}
                  >
                    {hsn} ×
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Preview</DialogTitle>
            <DialogDescription>
              This is how your post will appear to readers.
            </DialogDescription>
          </DialogHeader>

          <article className="prose prose-slate dark:prose-invert max-w-none">
            {formData.featuredImage && (
              <img
                src={formData.featuredImage}
                alt={formData.title}
                className="w-full rounded-lg mb-6"
              />
            )}
            <h1>{formData.title || 'Untitled'}</h1>

            <div className="flex flex-wrap gap-2 mb-6">
              {formData.categories.map((cat) => (
                <Badge key={cat} variant="secondary">
                  {cat}
                </Badge>
              ))}
            </div>

            {formData.content.map((block) => renderPreviewBlock(block))}

            {formData.tags.length > 0 && (
              <div className="mt-8 pt-4 border-t">
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag) => (
                    <Badge key={tag} variant="outline">
                      #{tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </article>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Helper function to render preview blocks
function renderPreviewBlock(block: BlockContent) {
  switch (block.type) {
    case 'paragraph':
      return <p key={block.id}>{block.content}</p>;
    case 'heading1':
      return <h1 key={block.id}>{block.content}</h1>;
    case 'heading2':
      return <h2 key={block.id}>{block.content}</h2>;
    case 'heading3':
      return <h3 key={block.id}>{block.content}</h3>;
    case 'bulletList':
      return (
        <ul key={block.id}>
          {block.meta?.items?.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      );
    case 'numberedList':
      return (
        <ol key={block.id}>
          {block.meta?.items?.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ol>
      );
    case 'image':
      return block.content ? (
        <figure key={block.id}>
          <img src={block.content} alt={block.meta?.alt || ''} />
          {block.meta?.caption && <figcaption>{block.meta.caption}</figcaption>}
        </figure>
      ) : null;
    case 'quote':
      return <blockquote key={block.id}>{block.content}</blockquote>;
    case 'code':
      return (
        <pre key={block.id}>
          <code className={block.meta?.language ? `language-${block.meta.language}` : ''}>
            {block.content}
          </code>
        </pre>
      );
    case 'divider':
      return <hr key={block.id} />;
    default:
      return null;
  }
}
