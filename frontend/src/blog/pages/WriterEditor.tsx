import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useBlogAuth } from '../context/BlogAuthContext';
import { blogPortalService } from '../services/blog-portal.service';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TiptapEditor } from '../components/editor';
import {
  Loader2,
  Lock,
  ChevronDown,
  X,
  Check,
  ArrowLeft,
  Settings,
  Image as ImageIcon,
} from 'lucide-react';
import type { TiptapContent, BlogFormData } from '../types';

const defaultTiptapContent: TiptapContent = {
  type: 'doc',
  content: [{ type: 'paragraph', content: [] }],
};

const defaultFormData: BlogFormData = {
  title: '',
  slug: '',
  tiptapContent: defaultTiptapContent,
  excerpt: '',
  featuredImage: '',
  accessLevel: 'public',
  categories: [],
  tags: [],
  hsnCodePrefixes: [],
  metaTitle: '',
  metaDescription: '',
};

/**
 * WriterEditor - Medium-Inspired Distraction-Free Blog Editor
 *
 * The entire page IS the editor. No header, no footer, no distractions.
 * Settings (slug, categories, tags, SEO) slide out from the right on demand.
 */
export function WriterEditor() {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useBlogAuth();
  const queryClient = useQueryClient();
  const isEditing = !!postId;

  // Form state
  const [formData, setFormData] = useState<BlogFormData>(defaultFormData);
  const [isDirty, setIsDirty] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // UI state
  const [showSettings, setShowSettings] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  // Refs
  const autoSaveRef = useRef<NodeJS.Timeout | null>(null);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);
  const settingsPanelRef = useRef<HTMLDivElement>(null);

  // Fetch existing post if editing
  const { data: existingPost, isLoading } = useQuery({
    queryKey: ['writer', 'posts', postId],
    queryFn: () => blogPortalService.getWriterPost(postId!),
    enabled: isEditing,
  });

  // Fetch available categories
  const { data: categoriesData } = useQuery({
    queryKey: ['blog', 'categories'],
    queryFn: () => blogPortalService.getCategories(),
  });

  const availableCategories = categoriesData || [];

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: BlogFormData) => blogPortalService.createWriterPost(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['writer', 'posts'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<BlogFormData> }) =>
      blogPortalService.updateWriterPost(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['writer', 'posts'] });
      queryClient.invalidateQueries({ queryKey: ['writer', 'posts', postId] });
    },
  });

  const submitMutation = useMutation({
    mutationFn: (id: string) => blogPortalService.submitPostForReview(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['writer', 'posts'] });
      navigate('/blog/writer');
    },
  });

  // Load existing post data
  useEffect(() => {
    if (existingPost) {
      setFormData({
        title: existingPost.title || '',
        slug: existingPost.slug || '',
        tiptapContent: existingPost.tiptapContent || defaultTiptapContent,
        excerpt: existingPost.excerpt || '',
        featuredImage: existingPost.featuredImage || '',
        accessLevel: existingPost.accessLevel || 'public',
        categories: existingPost.categories || [],
        tags: existingPost.tags || [],
        hsnCodePrefixes: existingPost.hsnCodePrefixes || [],
        metaTitle: existingPost.metaTitle || '',
        metaDescription: existingPost.metaDescription || '',
      });
    }
  }, [existingPost]);

  // Unsaved changes warning
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  // Close category dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        categoryDropdownRef.current &&
        !categoryDropdownRef.current.contains(event.target as Node)
      ) {
        setShowCategoryDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close settings panel on Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showSettings) {
        setShowSettings(false);
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [showSettings]);

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  // Auto-save
  const savePost = useCallback(async () => {
    if (!isDirty || !formData.title.trim()) return;

    setIsSaving(true);
    setError(null);

    try {
      if (isEditing && postId) {
        await updateMutation.mutateAsync({ id: postId, data: formData });
      } else {
        const result = await createMutation.mutateAsync(formData);
        if (result?._id) {
          navigate(`/blog/writer/edit/${result._id}`, { replace: true });
        }
      }
      setLastSaved(new Date());
      setIsDirty(false);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  }, [isDirty, formData, isEditing, postId, updateMutation, createMutation, navigate]);

  // Auto-save timer
  useEffect(() => {
    if (isDirty) {
      autoSaveRef.current = setTimeout(savePost, 30000);
    }
    return () => {
      if (autoSaveRef.current) {
        clearTimeout(autoSaveRef.current);
      }
    };
  }, [isDirty, savePost]);

  // Form change handler
  const handleChange = (field: keyof BlogFormData, value: any) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      if (field === 'title' && !isEditing) {
        updated.slug = generateSlug(value);
      }
      return updated;
    });
    setIsDirty(true);
  };

  const handleContentChange = (content: TiptapContent) => {
    handleChange('tiptapContent', content);
  };

  const handleEditorImageUpload = async (file: File) => {
    return await blogPortalService.uploadImage(file);
  };

  const handleFeaturedImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const result = await blogPortalService.uploadImage(file);
      handleChange('featuredImage', result.url);
    } catch {
      setError('Failed to upload featured image');
    }
  };

  const handleSubmitForReview = async () => {
    if (!postId) {
      setError('Please save the post first');
      return;
    }
    if (!formData.title.trim()) {
      setError('Title is required');
      return;
    }
    await savePost();
    if (window.confirm('Submit this post for review? The editorial team will review it.')) {
      try {
        await submitMutation.mutateAsync(postId);
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Failed to submit');
      }
    }
  };

  const handleTagsChange = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const input = e.currentTarget;
      const tag = input.value.trim();
      if (tag && !formData.tags.includes(tag)) {
        handleChange('tags', [...formData.tags, tag]);
      }
      input.value = '';
    }
  };

  const removeTag = (tagToRemove: string) => {
    handleChange(
      'tags',
      formData.tags.filter((t) => t !== tagToRemove)
    );
  };

  const toggleCategory = (category: string) => {
    if (formData.categories.includes(category)) {
      handleChange(
        'categories',
        formData.categories.filter((c) => c !== category)
      );
    } else {
      handleChange('categories', [...formData.categories, category]);
    }
  };

  const removeCategory = (category: string) => {
    handleChange(
      'categories',
      formData.categories.filter((c) => c !== category)
    );
  };

  // Auth loading
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="h-8 w-8 text-[#B8860B] animate-spin" />
      </div>
    );
  }

  // Writer access check
  if (!user?.isWriter) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 rounded-full bg-amber-100 flex items-center justify-center mb-4">
            <Lock className="h-8 w-8 text-amber-700" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Writer Access Required</h1>
          <p className="text-gray-500 mb-6">
            You need to be an approved writer to access this page.
          </p>
          <button
            onClick={() => navigate('/blog')}
            className="px-6 py-2.5 bg-[#B8860B] text-white rounded-lg hover:bg-[#9A7209] transition-colors"
          >
            Back to Blog
          </button>
        </div>
      </div>
    );
  }

  // Loading existing post
  if (isEditing && isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="h-8 w-8 text-[#B8860B] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* ── Sticky Top Bar ────────────────────────────────────── */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          {/* Left: Back button */}
          <button
            onClick={() => navigate('/blog/writer')}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="text-sm hidden sm:inline">Back</span>
          </button>

          {/* Center: Save status */}
          <div className="flex items-center gap-2 text-sm">
            {isSaving && (
              <span className="flex items-center gap-2 text-gray-400">
                <div className="w-3 h-3 border-2 border-[#B8860B] border-t-transparent rounded-full animate-spin" />
                Saving...
              </span>
            )}
            {!isSaving && lastSaved && (
              <span className="text-gray-400 flex items-center gap-1">
                <Check className="h-3.5 w-3.5 text-[#B8860B]" />
                Saved {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
            {!isSaving && isDirty && !lastSaved && (
              <span className="text-gray-400">Unsaved changes</span>
            )}
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={savePost}
              disabled={isSaving || !isDirty}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors"
            >
              Save Draft
            </button>
            {isEditing && (
              <button
                onClick={handleSubmitForReview}
                disabled={submitMutation.isPending}
                className="px-4 py-2 text-sm font-medium text-white bg-[#B8860B] rounded-lg hover:bg-[#9A7209] disabled:opacity-50 transition-colors"
              >
                Submit for Review
              </button>
            )}
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`p-2 rounded-lg transition-colors ${
                showSettings
                  ? 'bg-[#B8860B] text-white'
                  : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
              }`}
              title="Post Settings"
            >
              <Settings className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Error Banner ──────────────────────────────────────── */}
      {error && (
        <div className="max-w-3xl mx-auto px-4 mt-4">
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center justify-between">
            <span className="text-sm">{error}</span>
            <button onClick={() => setError(null)} className="ml-2">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── Main Content Area ─────────────────────────────────── */}
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Featured Image (optional banner) */}
        {formData.featuredImage ? (
          <div className="relative mb-8 group rounded-xl overflow-hidden">
            <img
              src={formData.featuredImage}
              alt="Featured"
              className="w-full h-64 sm:h-80 object-cover"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
            <button
              onClick={() => handleChange('featuredImage', '')}
              className="absolute top-3 right-3 p-2 bg-white/90 text-gray-700 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white shadow-sm"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <label className="block mb-8 cursor-pointer group">
            <div className="flex items-center gap-2 text-gray-400 hover:text-gray-600 transition-colors py-2">
              <ImageIcon className="h-5 w-5" />
              <span className="text-sm">Add featured image</span>
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={handleFeaturedImageUpload}
              style={{ position: 'fixed', top: '-100px', left: '-100px', opacity: 0 }}
            />
          </label>
        )}

        {/* Inline Title */}
        <input
          type="text"
          value={formData.title}
          onChange={(e) => handleChange('title', e.target.value)}
          placeholder="Post title..."
          className="w-full text-4xl sm:text-5xl font-bold text-gray-900 border-none outline-none placeholder-gray-300 mb-6 leading-tight"
        />

        {/* ── TiptapEditor (the hero) ─────────────────────────── */}
        <TiptapEditor
          content={formData.tiptapContent}
          onChange={handleContentChange}
          onImageUpload={handleEditorImageUpload}
          placeholder="Start writing your article..."
        />
      </div>

      {/* ── Settings Slide-Out Panel ──────────────────────────── */}
      {showSettings && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/20 z-40"
            onClick={() => setShowSettings(false)}
          />

          {/* Panel */}
          <div
            ref={settingsPanelRef}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white border-l border-gray-200 z-50 overflow-y-auto shadow-xl"
          >
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Post Settings</h2>
              <button
                onClick={() => setShowSettings(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* URL Slug */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL Slug</label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-400">/blog/post/</span>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => handleChange('slug', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B8860B] text-sm"
                  />
                </div>
              </div>

              {/* Excerpt */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Excerpt</label>
                <textarea
                  value={formData.excerpt}
                  onChange={(e) => handleChange('excerpt', e.target.value)}
                  rows={3}
                  placeholder="A brief summary of your post..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B8860B] resize-none text-sm"
                />
              </div>

              {/* Categories */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Categories</label>
                {formData.categories.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {formData.categories.map((category) => (
                      <span
                        key={category}
                        className="px-3 py-1 bg-[#B8860B] text-white rounded-full text-xs flex items-center gap-1"
                      >
                        {category}
                        <button
                          onClick={() => removeCategory(category)}
                          className="hover:text-red-200 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <div className="relative" ref={categoryDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B8860B] bg-white text-left flex items-center justify-between text-sm"
                  >
                    <span className="text-gray-500">
                      {formData.categories.length === 0
                        ? 'Select categories...'
                        : `${formData.categories.length} selected`}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 transition-transform ${
                        showCategoryDropdown ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {showCategoryDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {availableCategories.length > 0 ? (
                        availableCategories.map(
                          ({ category, count }: { category: string; count: number }) => (
                            <button
                              key={category}
                              type="button"
                              onClick={() => toggleCategory(category)}
                              className={`w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center justify-between text-sm ${
                                formData.categories.includes(category) ? 'bg-[#B8860B]/10' : ''
                              }`}
                            >
                              <span className="flex items-center gap-2">
                                {formData.categories.includes(category) && (
                                  <Check className="w-4 h-4 text-[#B8860B]" />
                                )}
                                <span
                                  className={
                                    formData.categories.includes(category) ? 'font-medium' : ''
                                  }
                                >
                                  {category}
                                </span>
                              </span>
                              <span className="text-xs text-gray-400">{count} posts</span>
                            </button>
                          )
                        )
                      ) : (
                        <div className="px-3 py-4 text-center text-gray-500 text-sm">
                          No categories available yet
                        </div>
                      )}
                      <div className="border-t px-3 py-2">
                        <input
                          type="text"
                          placeholder="Add custom category..."
                          className="w-full px-2 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-[#B8860B]"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              const value = e.currentTarget.value.trim();
                              if (value && !formData.categories.includes(value)) {
                                handleChange('categories', [...formData.categories, value]);
                                e.currentTarget.value = '';
                              }
                            }
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {formData.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs flex items-center gap-1"
                      >
                        {tag}
                        <button
                          onClick={() => removeTag(tag)}
                          className="hover:text-red-500"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <input
                  type="text"
                  onKeyDown={handleTagsChange}
                  placeholder="Type a tag and press Enter..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B8860B] text-sm"
                />
              </div>

              {/* Featured Image (alternate upload in settings) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Featured Image
                </label>
                {formData.featuredImage ? (
                  <div className="relative group">
                    <img
                      src={formData.featuredImage}
                      alt="Featured"
                      className="w-full h-40 object-cover rounded-lg"
                    />
                    <button
                      onClick={() => handleChange('featuredImage', '')}
                      className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <label className="block w-full p-6 border-2 border-dashed border-gray-300 rounded-lg text-center cursor-pointer hover:border-[#B8860B] transition-colors">
                    <ImageIcon className="w-8 h-8 mx-auto text-gray-400 mb-1" />
                    <span className="text-sm text-gray-500">Click to upload</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFeaturedImageUpload}
                      style={{ position: 'fixed', top: '-100px', left: '-100px', opacity: 0 }}
                    />
                  </label>
                )}
              </div>

              {/* SEO Settings */}
              <div className="border-t border-gray-100 pt-6">
                <h3 className="text-sm font-medium text-gray-700 mb-4">SEO Settings</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Meta Title</label>
                    <input
                      type="text"
                      value={formData.metaTitle}
                      onChange={(e) => handleChange('metaTitle', e.target.value)}
                      placeholder={formData.title || 'Leave empty to use post title'}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B8860B] text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Meta Description</label>
                    <textarea
                      value={formData.metaDescription}
                      onChange={(e) => handleChange('metaDescription', e.target.value)}
                      placeholder={formData.excerpt || 'Leave empty to use excerpt'}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B8860B] resize-none text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default WriterEditor;
