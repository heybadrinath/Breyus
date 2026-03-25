import { useEditor, EditorContent, BubbleMenu, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import { CustomImage, Callout, PullQuote, ImageGallery } from './extensions';
import Underline from '@tiptap/extension-underline';

// Import editor styles directly for reliable CSS loading
import '../../../styles/editor.css';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import CharacterCount from '@tiptap/extension-character-count';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import Typography from '@tiptap/extension-typography';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';
import { useCallback, useEffect, useState, useRef, useMemo } from 'react';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Minus,
  Link as LinkIcon,
  Image as ImageIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Highlighter,
  Undo,
  Redo,
  Loader2,
  Table as TableIcon,
  Trash2,
  FileCode,
  ChevronDown,
  X,
  ExternalLink,
  Type,
  LayoutGrid,
  Sparkles,
  Upload,
  Pilcrow,
  Maximize2,
  Minimize2,
  Images,
  MessageSquareQuote,
  Info,
  AlignHorizontalJustifyStart,
  AlignHorizontalJustifyEnd,
  AlignHorizontalJustifyCenter,
} from 'lucide-react';
import type { TiptapContent } from '../types';

const lowlight = createLowlight(common);

interface SlashCommand {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  description: string;
  command: () => void;
}

interface TiptapEditorProps {
  content: TiptapContent;
  onChange: (content: TiptapContent) => void;
  onImageUpload?: (file: File) => Promise<string>;
  placeholder?: string;
  editable?: boolean;
}

export function TiptapEditor({
  content,
  onChange,
  onImageUpload,
  placeholder = 'Start writing your article... Type "/" for commands',
  editable = true,
}: TiptapEditorProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [editorError, setEditorError] = useState<string | null>(null); // Fix: Error state for editor initialization

  // Slash command state
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [slashMenuPosition, setSlashMenuPosition] = useState({ top: 0, left: 0 });
  const [slashFilter, setSlashFilter] = useState('');
  const [selectedSlashIndex, setSelectedSlashIndex] = useState(0);

  // Refs for editor closure access
  const slashOpenRef = useRef(false);
  const slashStartRef = useRef(0);
  const isEditorUpdateRef = useRef(false);

  const editorContainerRef = useRef<HTMLDivElement>(null);
  const filteredCommandsRef = useRef<SlashCommand[]>([]);

  // Track dynamic file inputs for cleanup (Fix #4: prevent orphaned DOM elements)
  const fileInputsRef = useRef<Set<HTMLInputElement>>(new Set());

  // Store latest slash index in ref to avoid effect re-registration (Fix #1)
  const selectedSlashIndexRef = useRef(0);
  useEffect(() => {
    selectedSlashIndexRef.current = selectedSlashIndex;
  }, [selectedSlashIndex]);

  // Cleanup orphaned file inputs on unmount (Fix #4)
  useEffect(() => {
    const inputsRef = fileInputsRef;
    return () => {
      inputsRef.current.forEach((input) => {
        if (input.parentNode) {
          input.remove();
        }
      });
      inputsRef.current.clear();
    };
  }, []);

  // Auto-dismiss upload error
  useEffect(() => {
    if (uploadError) {
      const timer = setTimeout(() => setUploadError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [uploadError]);

  // Exit focus mode on Escape
  useEffect(() => {
    if (!isFocusMode) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !showSlashMenu && !showLinkModal) {
        setIsFocusMode(false);
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isFocusMode, showSlashMenu, showLinkModal]);

  const closeSlashMenu = useCallback(() => {
    slashOpenRef.current = false;
    slashStartRef.current = 0;
    setShowSlashMenu(false);
    setSlashFilter('');
    setSelectedSlashIndex(0);
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
      }),
      Placeholder.configure({
        placeholder,
        emptyEditorClass: 'is-editor-empty',
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline hover:text-primary/80 cursor-pointer',
        },
      }),
      CustomImage.configure({
        HTMLAttributes: {
          class: 'rounded-lg max-w-full h-auto my-6 mx-auto shadow-sm',
        },
        allowBase64: true,
      }),
      Callout,
      PullQuote,
      ImageGallery,
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Highlight.configure({
        multicolor: true,
        HTMLAttributes: {
          class: 'bg-yellow-200 dark:bg-yellow-800 px-1 rounded',
        },
      }),
      CharacterCount.configure({
        limit: 100000,
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'border-collapse w-full my-4',
        },
      }),
      TableRow.configure({
        HTMLAttributes: {
          class: 'border border-border',
        },
      }),
      TableCell.configure({
        HTMLAttributes: {
          class: 'border border-border p-2 min-w-[80px]',
        },
      }),
      TableHeader.configure({
        HTMLAttributes: {
          class: 'border border-border p-2 bg-muted font-semibold',
        },
      }),
      Typography,
      CodeBlockLowlight.configure({
        lowlight,
        HTMLAttributes: {
          class: 'bg-zinc-900 text-zinc-100 rounded-lg p-4 my-4 overflow-x-auto text-sm font-mono',
        },
      }),
    ],
    content,
    editable,
    onUpdate: ({ editor }: { editor: Editor }) => {
      try {
        isEditorUpdateRef.current = true;
        const json = editor.getJSON() as TiptapContent;
        onChange(json);

        // Update slash filter
        if (slashOpenRef.current) {
          const { from } = editor.state.selection;
          if (from < slashStartRef.current) {
            closeSlashMenu();
          } else {
            try {
              const text = editor.state.doc.textBetween(slashStartRef.current, from, '');
              if (text.includes(' ') || text.includes('\n') || text.length > 30) {
                closeSlashMenu();
              } else {
                setSlashFilter(text);
                setSelectedSlashIndex(0);
              }
            } catch {
              closeSlashMenu();
            }
          }
        }
      } catch (err) {
        console.error('Editor update error:', err);
        setEditorError('An error occurred while updating the editor. Please reload the page.');
      }
    },
    editorProps: {
      handleKeyDown: (view, event) => {
        if (event.key === '/' && !slashOpenRef.current) {
          const { from } = view.state.selection;
          const editorEl = editorContainerRef.current;

          // Fix: Wrap coordsAtPos in try-catch to handle invalid cursor positions
          try {
            const coords = view.coordsAtPos(from);
            if (editorEl) {
              const rect = editorEl.getBoundingClientRect();
              slashOpenRef.current = true;
              slashStartRef.current = from + 1;
              setSlashMenuPosition({
                top: coords.top - rect.top + editorEl.scrollTop + 28,
                left: Math.min(coords.left - rect.left, rect.width - 300),
              });
              setShowSlashMenu(true);
              setSlashFilter('');
              setSelectedSlashIndex(0);
            }
          } catch (err) {
            console.warn('Failed to calculate slash menu position:', err);
            // Fallback: show menu at a default position
            if (editorEl) {
              slashOpenRef.current = true;
              slashStartRef.current = from + 1;
              setSlashMenuPosition({ top: 50, left: 20 });
              setShowSlashMenu(true);
              setSlashFilter('');
              setSelectedSlashIndex(0);
            }
          }
          return false;
        }
        return false;
      },
    },
  });

  // Sync content from props only on external changes
  useEffect(() => {
    if (!editor || !content) return;
    if (isEditorUpdateRef.current) {
      isEditorUpdateRef.current = false;
      return;
    }
    editor.commands.setContent(content);
  }, [editor, content]);

  // Global keydown for slash menu navigation
  // Fix #1: Use refs instead of state in dependencies to prevent listener accumulation
  useEffect(() => {
    if (!showSlashMenu || !editor) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          closeSlashMenu();
          editor.commands.focus();
          e.preventDefault();
          e.stopPropagation();
          break;
        case 'ArrowDown':
          e.preventDefault();
          e.stopPropagation();
          setSelectedSlashIndex((prev) => {
            const max = filteredCommandsRef.current.length - 1;
            return Math.min(prev + 1, Math.max(max, 0));
          });
          break;
        case 'ArrowUp':
          e.preventDefault();
          e.stopPropagation();
          setSelectedSlashIndex((prev) => Math.max(prev - 1, 0));
          break;
        case 'Enter': {
          e.preventDefault();
          e.stopPropagation();
          const cmds = filteredCommandsRef.current;
          if (cmds.length > 0) {
            // Use ref instead of state to get current index
            const idx = Math.min(selectedSlashIndexRef.current, cmds.length - 1);
            executeSlashCommand(cmds[idx].command);
          }
          break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
    // Remove selectedSlashIndex from dependencies - use ref instead
  }, [showSlashMenu, editor, closeSlashMenu]);

  // Close slash menu on click outside
  // Fix #8: Always return cleanup function to prevent listener accumulation
  useEffect(() => {
    if (!showSlashMenu) return undefined;

    const handleClick = (e: MouseEvent) => {
      // Don't close if clicking inside the slash menu itself
      const target = e.target as HTMLElement;
      if (target.closest('[data-slash-menu]')) return;
      closeSlashMenu();
    };

    // Use a small delay to avoid closing on the same click that opened the menu
    const timeoutId = setTimeout(() => {
      document.addEventListener('click', handleClick);
    }, 10);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('click', handleClick);
    };
  }, [showSlashMenu, closeSlashMenu]);

  // Drag and drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (!onImageUpload || !editor) return;

      const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith('image/'));
      if (files.length === 0) return;

      try {
        setIsUploading(true);
        setUploadError(null);
        for (const file of files) {
          const url = await onImageUpload(file);
          editor.chain().focus().setImage({ src: url }).run();
        }
      } catch {
        setUploadError('Failed to upload image. Please try again.');
      } finally {
        setIsUploading(false);
      }
    },
    [editor, onImageUpload]
  );

  // Helper to safely remove and untrack file input (Fix #4)
  const cleanupFileInput = useCallback((input: HTMLInputElement) => {
    fileInputsRef.current.delete(input);
    if (input.parentNode) {
      input.remove();
    }
  }, []);

  // Image upload — dynamically create file input on click (trusted user gesture)
  // IMPORTANT: Do NOT set display:none — browsers block .click() on hidden inputs
  // Fix: Track inputs for cleanup on unmount + improved accessibility
  const handleImageUpload = useCallback(() => {
    if (!onImageUpload || !editor) return;
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.style.position = 'fixed';
    input.style.top = '-9999px';
    input.style.left = '-9999px';
    input.style.opacity = '0';
    input.setAttribute('aria-hidden', 'true');
    input.tabIndex = -1;

    // Track the input for cleanup
    fileInputsRef.current.add(input);

    input.addEventListener('change', async () => {
      const file = input.files?.[0];
      if (!file) {
        cleanupFileInput(input);
        return;
      }
      try {
        setIsUploading(true);
        setUploadError(null);
        const url = await onImageUpload(file);
        editor.chain().focus().setImage({ src: url }).run();
      } catch {
        setUploadError('Failed to upload image. Please try again.');
      } finally {
        setIsUploading(false);
        cleanupFileInput(input);
      }
    });

    // Also cleanup if user cancels the dialog
    input.addEventListener('cancel', () => cleanupFileInput(input));

    document.body.appendChild(input);
    input.click();
  }, [editor, onImageUpload, cleanupFileInput]);

  // Gallery upload — dynamically create multi-file input on click
  // Fix: Track inputs for cleanup on unmount + improved accessibility
  const handleGalleryUpload = useCallback(() => {
    if (!onImageUpload || !editor) {
      console.warn('Gallery upload: missing onImageUpload or editor');
      return;
    }
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;
    input.style.position = 'fixed';
    input.style.top = '-9999px';
    input.style.left = '-9999px';
    input.style.opacity = '0';
    input.setAttribute('aria-hidden', 'true');
    input.tabIndex = -1;

    // Track the input for cleanup
    fileInputsRef.current.add(input);

    const handleChange = async () => {
      const files = Array.from(input.files || []);
      if (files.length === 0) {
        cleanupFileInput(input);
        return;
      }
      try {
        setIsUploading(true);
        setUploadError(null);
        const urls: string[] = [];
        for (const file of files) {
          const url = await onImageUpload(file);
          if (url) urls.push(url);
        }

        if (urls.length === 0) {
          setUploadError('No images were uploaded successfully.');
        } else if (urls.length === 1) {
          // Single image - insert as regular image
          editor.chain().focus().setImage({ src: urls[0] }).run();
        } else {
          // Multiple images - create gallery
          const columns = urls.length >= 3 ? 3 : 2;
          const galleryContent = {
            type: 'imageGallery',
            attrs: { columns },
            content: urls.map((url) => ({
              type: 'image',
              attrs: { src: url, alt: '', title: '' },
            })),
          };
          editor.chain().focus().insertContent(galleryContent).run();
        }
      } catch (err) {
        console.error('Gallery upload error:', err);
        setUploadError('Failed to upload images. Please try again.');
      } finally {
        setIsUploading(false);
        cleanupFileInput(input);
      }
    };

    input.addEventListener('change', handleChange);
    // Also cleanup if user cancels the dialog
    input.addEventListener('cancel', () => cleanupFileInput(input));

    document.body.appendChild(input);

    // Use setTimeout to ensure the element is in DOM before clicking
    setTimeout(() => {
      input.click();
    }, 0);
  }, [editor, onImageUpload, cleanupFileInput]);

  // Link modal
  const openLinkModal = useCallback(() => {
    if (!editor) return;
    const previousUrl = editor.getAttributes('link').href || '';
    const selectedText = editor.state.doc.textBetween(
      editor.state.selection.from,
      editor.state.selection.to,
      ''
    );
    setLinkUrl(previousUrl);
    setLinkText(selectedText);
    setShowLinkModal(true);
  }, [editor]);

  const handleSetLink = useCallback(() => {
    if (!editor) return;
    if (linkUrl === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
    } else {
      // Validate URL to prevent XSS via dangerous protocols
      const trimmedUrl = linkUrl.trim();
      const lowerUrl = trimmedUrl.toLowerCase();

      // Block dangerous protocols
      if (lowerUrl.startsWith('javascript:') || lowerUrl.startsWith('data:') || lowerUrl.startsWith('vbscript:')) {
        setUploadError('Invalid URL: dangerous protocol detected');
        return;
      }

      // Fix: Block protocol-relative URLs that could be exploited (e.g., //evil.com)
      if (trimmedUrl.startsWith('//') && !trimmedUrl.startsWith('///')) {
        setUploadError('Invalid URL: protocol-relative URLs are not allowed');
        return;
      }

      // Ensure URL has a protocol, default to https
      let safeUrl = trimmedUrl;
      if (!safeUrl.match(/^https?:\/\//i) && !safeUrl.startsWith('mailto:') && !safeUrl.startsWith('tel:')) {
        safeUrl = `https://${safeUrl}`;
      }

      editor.chain().focus().extendMarkRange('link').setLink({ href: safeUrl }).run();
    }
    setShowLinkModal(false);
    setLinkUrl('');
    setLinkText('');
  }, [editor, linkUrl]);

  const handleRemoveLink = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().extendMarkRange('link').unsetLink().run();
    setShowLinkModal(false);
    setLinkUrl('');
    setLinkText('');
  }, [editor]);

  // Slash commands
  const slashCommands: SlashCommand[] = useMemo(() => {
    if (!editor) return [];
    return [
      { icon: Pilcrow, label: 'Paragraph', description: 'Plain text', command: () => editor.chain().focus().setParagraph().run() },
      { icon: Heading1, label: 'Heading 1', description: 'Large section heading', command: () => editor.chain().focus().toggleHeading({ level: 1 }).run() },
      { icon: Heading2, label: 'Heading 2', description: 'Medium section heading', command: () => editor.chain().focus().toggleHeading({ level: 2 }).run() },
      { icon: Heading3, label: 'Heading 3', description: 'Small section heading', command: () => editor.chain().focus().toggleHeading({ level: 3 }).run() },
      { icon: List, label: 'Bullet List', description: 'Create a simple list', command: () => editor.chain().focus().toggleBulletList().run() },
      { icon: ListOrdered, label: 'Numbered List', description: 'Create a numbered list', command: () => editor.chain().focus().toggleOrderedList().run() },
      { icon: Quote, label: 'Quote', description: 'Capture a quote', command: () => editor.chain().focus().toggleBlockquote().run() },
      { icon: FileCode, label: 'Code Block', description: 'Display code', command: () => editor.chain().focus().toggleCodeBlock().run() },
      { icon: TableIcon, label: 'Table', description: 'Insert a table', command: () => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run() },
      { icon: Minus, label: 'Divider', description: 'Visual separator', command: () => editor.chain().focus().setHorizontalRule().run() },
      { icon: ImageIcon, label: 'Image', description: 'Upload an image', command: () => handleImageUpload() },
      { icon: Images, label: 'Image Gallery', description: 'Upload multiple images', command: () => handleGalleryUpload() },
      { icon: MessageSquareQuote, label: 'Pull Quote', description: 'Editorial pull quote', command: () => editor.chain().focus().setPullQuote().run() },
      { icon: Info, label: 'Info Box', description: 'Info callout block', command: () => editor.chain().focus().setCallout({ type: 'info' }).run() },
      { icon: AlignLeft, label: 'Align Left', description: 'Left-align text', command: () => editor.chain().focus().setTextAlign('left').run() },
      { icon: AlignCenter, label: 'Align Center', description: 'Center-align text', command: () => editor.chain().focus().setTextAlign('center').run() },
      { icon: AlignRight, label: 'Align Right', description: 'Right-align text', command: () => editor.chain().focus().setTextAlign('right').run() },
    ];
  }, [editor, handleImageUpload, handleGalleryUpload]);

  const filteredCommands = useMemo(() => {
    const result = slashCommands.filter(
      (cmd) =>
        cmd.label.toLowerCase().includes(slashFilter.toLowerCase()) ||
        cmd.description.toLowerCase().includes(slashFilter.toLowerCase())
    );
    filteredCommandsRef.current = result;
    return result;
  }, [slashFilter, slashCommands]);

  const executeSlashCommand = useCallback(
    (command: () => void) => {
      // Fix #11: Add validation to prevent invalid delete ranges
      if (editor && slashStartRef.current > 0) {
        const { from } = editor.state.selection;
        const deleteFrom = slashStartRef.current - 1;

        // Only delete if the range is valid (from >= deleteFrom and both within document)
        if (from >= deleteFrom && deleteFrom >= 0 && from <= editor.state.doc.content.size) {
          try {
            editor.chain().deleteRange({ from: deleteFrom, to: from }).run();
          } catch (err) {
            console.warn('Failed to delete slash command text:', err);
          }
        }
      }
      command();
      closeSlashMenu();
    },
    [editor, closeSlashMenu]
  );

  // Scroll selected slash item into view
  useEffect(() => {
    if (!showSlashMenu) return;
    const el = document.querySelector(`[data-slash-index="${selectedSlashIndex}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [selectedSlashIndex, showSlashMenu]);

  // Fix: Show error state if editor fails to initialize
  if (editorError) {
    return (
      <div className="border rounded-lg min-h-[500px] flex flex-col items-center justify-center bg-background gap-4">
        <div className="text-destructive font-medium">Editor failed to initialize</div>
        <p className="text-sm text-muted-foreground">{editorError}</p>
        <button
          onClick={() => {
            setEditorError(null);
            window.location.reload();
          }}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          Reload Page
        </button>
      </div>
    );
  }

  if (!editor) {
    return (
      <div className="border rounded-lg min-h-[500px] flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      {/* Focus mode backdrop — z-[60] to sit above sidebar (z-50) */}
      {isFocusMode && (
        <div
          className="fixed inset-0 z-[60] bg-background/80 backdrop-blur-sm"
          onClick={() => setIsFocusMode(false)}
        />
      )}
      <div
        ref={editorContainerRef}
        className={`border rounded-lg overflow-hidden bg-background transition-all duration-300 ${
          isDragging ? 'ring-2 ring-primary ring-offset-2' : ''
        } ${isFocusMode ? 'fixed inset-4 z-[70] rounded-xl shadow-2xl flex flex-col' : 'relative'}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
      {/* Upload Error */}
      {uploadError && (
        <div className="absolute top-14 left-4 right-4 z-30 bg-destructive/10 border border-destructive/20 text-destructive px-4 py-2 rounded-lg flex items-center justify-between shadow-sm">
          <span className="text-sm">{uploadError}</span>
          <button
            onClick={() => setUploadError(null)}
            className="ml-2 p-1 hover:bg-destructive/20 rounded transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Toolbar */}
      <div className="sticky top-0 z-20 border-b bg-background">
        <div className="flex flex-wrap items-center gap-0.5 p-2">
          {/* Undo/Redo */}
          <ToolbarButton
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            tooltip="Undo"
          >
            <Undo className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            tooltip="Redo"
          >
            <Redo className="h-4 w-4" />
          </ToolbarButton>

          <ToolbarDivider />

          {/* Text Type Dropdown */}
          <ToolbarDropdown
            label={
              editor.isActive('heading', { level: 1 })
                ? 'H1'
                : editor.isActive('heading', { level: 2 })
                ? 'H2'
                : editor.isActive('heading', { level: 3 })
                ? 'H3'
                : 'Text'
            }
            icon={<Type className="h-4 w-4" />}
          >
            <DropdownItem
              active={editor.isActive('paragraph')}
              onClick={() => editor.chain().focus().setParagraph().run()}
            >
              <Pilcrow className="h-4 w-4 mr-2" /> Paragraph
            </DropdownItem>
            <DropdownItem
              active={editor.isActive('heading', { level: 1 })}
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            >
              <Heading1 className="h-4 w-4 mr-2" /> Heading 1
            </DropdownItem>
            <DropdownItem
              active={editor.isActive('heading', { level: 2 })}
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            >
              <Heading2 className="h-4 w-4 mr-2" /> Heading 2
            </DropdownItem>
            <DropdownItem
              active={editor.isActive('heading', { level: 3 })}
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            >
              <Heading3 className="h-4 w-4 mr-2" /> Heading 3
            </DropdownItem>
          </ToolbarDropdown>

          <ToolbarDivider />

          {/* Formatting */}
          <ToolbarToggle
            active={editor.isActive('bold')}
            onClick={() => editor.chain().focus().toggleBold().run()}
            tooltip="Bold"
          >
            <Bold className="h-4 w-4" />
          </ToolbarToggle>
          <ToolbarToggle
            active={editor.isActive('italic')}
            onClick={() => editor.chain().focus().toggleItalic().run()}
            tooltip="Italic"
          >
            <Italic className="h-4 w-4" />
          </ToolbarToggle>
          <ToolbarToggle
            active={editor.isActive('underline')}
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            tooltip="Underline"
          >
            <UnderlineIcon className="h-4 w-4" />
          </ToolbarToggle>
          <ToolbarToggle
            active={editor.isActive('strike')}
            onClick={() => editor.chain().focus().toggleStrike().run()}
            tooltip="Strikethrough"
          >
            <Strikethrough className="h-4 w-4" />
          </ToolbarToggle>

          <ToolbarDivider />

          {/* Lists & Quote */}
          <ToolbarToggle
            active={editor.isActive('bulletList')}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            tooltip="Bullet List"
          >
            <List className="h-4 w-4" />
          </ToolbarToggle>
          <ToolbarToggle
            active={editor.isActive('orderedList')}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            tooltip="Numbered List"
          >
            <ListOrdered className="h-4 w-4" />
          </ToolbarToggle>
          <ToolbarToggle
            active={editor.isActive('blockquote')}
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            tooltip="Quote"
          >
            <Quote className="h-4 w-4" />
          </ToolbarToggle>

          <ToolbarDivider />

          {/* Media */}
          <ToolbarButton onClick={openLinkModal} tooltip="Insert Link">
            <LinkIcon className="h-4 w-4" />
          </ToolbarButton>
          {onImageUpload && (
            <>
              <ToolbarButton
                onClick={handleImageUpload}
                disabled={isUploading}
                tooltip="Insert Image"
              >
                {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
              </ToolbarButton>
              <ToolbarButton
                onClick={handleGalleryUpload}
                disabled={isUploading}
                tooltip="Insert Image Gallery (multiple)"
              >
                <Images className="h-4 w-4" />
              </ToolbarButton>
            </>
          )}

          <ToolbarDivider />

          {/* Blocks */}
          <ToolbarToggle
            active={editor.isActive('codeBlock')}
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            tooltip="Code Block"
          >
            <FileCode className="h-4 w-4" />
          </ToolbarToggle>
          <ToolbarButton
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            tooltip="Divider"
          >
            <Minus className="h-4 w-4" />
          </ToolbarButton>

          {/* Table Dropdown */}
          <ToolbarDropdown label="Table" icon={<TableIcon className="h-4 w-4" />}>
            <DropdownItem
              onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
            >
              <LayoutGrid className="h-4 w-4 mr-2" /> Insert Table
            </DropdownItem>
            {editor.isActive('table') && (
              <>
                <DropdownDivider />
                <DropdownItem onClick={() => editor.chain().focus().addColumnBefore().run()}>
                  Add Column Before
                </DropdownItem>
                <DropdownItem onClick={() => editor.chain().focus().addColumnAfter().run()}>
                  Add Column After
                </DropdownItem>
                <DropdownItem onClick={() => editor.chain().focus().addRowBefore().run()}>
                  Add Row Before
                </DropdownItem>
                <DropdownItem onClick={() => editor.chain().focus().addRowAfter().run()}>
                  Add Row After
                </DropdownItem>
                <DropdownDivider />
                <DropdownItem onClick={() => editor.chain().focus().deleteColumn().run()} danger>
                  Delete Column
                </DropdownItem>
                <DropdownItem onClick={() => editor.chain().focus().deleteRow().run()} danger>
                  Delete Row
                </DropdownItem>
                <DropdownItem onClick={() => editor.chain().focus().deleteTable().run()} danger>
                  Delete Table
                </DropdownItem>
              </>
            )}
          </ToolbarDropdown>

          {/* Spacer then Focus Mode */}
          <div className="flex-1" />
          <ToolbarButton
            onClick={() => setIsFocusMode(!isFocusMode)}
            tooltip={isFocusMode ? 'Exit Focus Mode (Esc)' : 'Focus Mode'}
          >
            {isFocusMode ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </ToolbarButton>
        </div>
      </div>

      {/* Bubble Menu - Text Selection */}
      <BubbleMenu
        editor={editor}
        tippyOptions={{ duration: 150, placement: 'top' }}
        className="bg-popover border rounded-lg shadow-lg flex items-center gap-0.5 p-1"
        shouldShow={({ editor }) => {
          // Don't show for images - they have their own controls
          if (editor.isActive('image')) return false;
          // Show for text selection
          const { from, to } = editor.state.selection;
          return from !== to;
        }}
      >
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-1.5 rounded transition-colors ${
            editor.isActive('bold') ? 'bg-primary text-primary-foreground' : 'hover:bg-accent text-foreground'
          }`}
        >
          <Bold className="h-4 w-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-1.5 rounded transition-colors ${
            editor.isActive('italic') ? 'bg-primary text-primary-foreground' : 'hover:bg-accent text-foreground'
          }`}
        >
          <Italic className="h-4 w-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`p-1.5 rounded transition-colors ${
            editor.isActive('underline') ? 'bg-primary text-primary-foreground' : 'hover:bg-accent text-foreground'
          }`}
        >
          <UnderlineIcon className="h-4 w-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHighlight().run()}
          className={`p-1.5 rounded transition-colors ${
            editor.isActive('highlight') ? 'bg-primary text-primary-foreground' : 'hover:bg-accent text-foreground'
          }`}
        >
          <Highlighter className="h-4 w-4" />
        </button>
        <div className="w-px h-5 bg-border mx-1" />
        <button
          onClick={openLinkModal}
          className={`p-1.5 rounded transition-colors ${
            editor.isActive('link') ? 'bg-primary text-primary-foreground' : 'hover:bg-accent text-foreground'
          }`}
        >
          <LinkIcon className="h-4 w-4" />
        </button>
      </BubbleMenu>

      {/* Bubble Menu - Image Selection (Float Controls) */}
      <BubbleMenu
        editor={editor}
        tippyOptions={{ duration: 150, placement: 'top' }}
        className="bg-popover border rounded-lg shadow-lg flex items-center gap-0.5 p-1"
        shouldShow={({ editor }) => editor.isActive('image')}
      >
        <button
          onClick={() => editor.chain().focus().setImageFloat('left').run()}
          title="Float Left"
          className={`p-1.5 rounded transition-colors ${
            editor.getAttributes('image').float === 'left'
              ? 'bg-primary text-primary-foreground'
              : 'hover:bg-accent text-foreground'
          }`}
        >
          <AlignHorizontalJustifyStart className="h-4 w-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().setImageFloat(null).run()}
          title="Center (No Float)"
          className={`p-1.5 rounded transition-colors ${
            !editor.getAttributes('image').float
              ? 'bg-primary text-primary-foreground'
              : 'hover:bg-accent text-foreground'
          }`}
        >
          <AlignHorizontalJustifyCenter className="h-4 w-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().setImageFloat('right').run()}
          title="Float Right"
          className={`p-1.5 rounded transition-colors ${
            editor.getAttributes('image').float === 'right'
              ? 'bg-primary text-primary-foreground'
              : 'hover:bg-accent text-foreground'
          }`}
        >
          <AlignHorizontalJustifyEnd className="h-4 w-4" />
        </button>
        <div className="w-px h-5 bg-border mx-1" />
        <button
          onClick={() => {
            editor.chain().focus().deleteSelection().run();
          }}
          title="Delete Image"
          className="p-1.5 rounded transition-colors text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </BubbleMenu>

      {/* FloatingMenu removed — use slash commands (/) or toolbar instead */}

      {/* Slash Command Menu - Fix: Added ARIA attributes and visible focus ring for accessibility */}
      {showSlashMenu && (
        <div
          data-slash-menu
          role="listbox"
          aria-label="Editor commands"
          aria-activedescendant={filteredCommands[selectedSlashIndex]?.label ? `slash-cmd-${selectedSlashIndex}` : undefined}
          className="absolute z-30 bg-popover border rounded-xl shadow-xl w-72 max-h-80 overflow-y-auto"
          style={{ top: slashMenuPosition.top, left: slashMenuPosition.left }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-3 py-2 border-b">
            <p className="text-xs text-muted-foreground font-medium">
              {slashFilter ? `Filtering: "${slashFilter}"` : 'Type to filter... (↑↓ to navigate, Enter to select)'}
            </p>
          </div>
          <div className="py-1" role="group">
            {filteredCommands.length === 0 ? (
              <div className="px-4 py-3 text-sm text-muted-foreground text-center">
                No commands found
              </div>
            ) : (
              filteredCommands.map((cmd, index) => (
                <button
                  key={cmd.label}
                  id={`slash-cmd-${index}`}
                  role="option"
                  aria-selected={index === selectedSlashIndex}
                  aria-label={`${cmd.label}: ${cmd.description}`}
                  data-slash-index={index}
                  onClick={() => executeSlashCommand(cmd.command)}
                  className={`w-full flex items-center gap-3 px-4 py-2 text-left transition-colors outline-none ${
                    index === selectedSlashIndex
                      ? 'bg-accent ring-2 ring-primary ring-inset'
                      : 'hover:bg-accent/50 focus:bg-accent/50 focus:ring-2 focus:ring-primary focus:ring-inset'
                  }`}
                >
                  <div className={`p-2 rounded-lg ${index === selectedSlashIndex ? 'bg-primary/10' : 'bg-muted'}`}>
                    <cmd.icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  </div>
                  <div>
                    <div className="text-sm font-medium">{cmd.label}</div>
                    <div className="text-xs text-muted-foreground">{cmd.description}</div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* Editor Content */}
      <EditorContent
        editor={editor}
        className={`prose prose-sm sm:prose dark:prose-invert max-w-none px-6 py-8 focus:outline-none
          ${isFocusMode ? 'flex-1 overflow-y-auto' : 'min-h-[400px]'}
          prose-headings:font-bold
          prose-a:text-primary prose-a:no-underline hover:prose-a:underline
          prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:pl-6 prose-blockquote:italic
          prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm
          prose-pre:bg-zinc-900 prose-pre:text-zinc-100 prose-pre:rounded-xl
          prose-img:rounded-xl prose-img:shadow-md
          [&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-[350px]
          [&_.ProseMirror_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]
          [&_.ProseMirror_p.is-editor-empty:first-child::before]:text-muted-foreground
          [&_.ProseMirror_p.is-editor-empty:first-child::before]:float-left
          [&_.ProseMirror_p.is-editor-empty:first-child::before]:pointer-events-none
          [&_.ProseMirror_p.is-editor-empty:first-child::before]:h-0`}
      />

      {/* Drag Overlay */}
      {isDragging && (
        <div className="absolute inset-0 bg-primary/10 flex items-center justify-center z-40">
          <div className="text-center">
            <Upload className="h-12 w-12 text-primary mx-auto mb-3" />
            <p className="text-lg font-medium text-primary">Drop images here</p>
          </div>
        </div>
      )}

      {/* Footer Stats */}
      <div className="border-t bg-muted/50 px-4 py-3 flex items-center justify-between text-sm">
        <div className="flex items-center gap-4 text-muted-foreground">
          <span className="flex items-center gap-1">
            <Type className="h-4 w-4" />
            {editor.storage.characterCount.characters().toLocaleString()} chars
          </span>
          <span className="flex items-center gap-1">
            <Sparkles className="h-4 w-4" />
            {editor.storage.characterCount.words().toLocaleString()} words
          </span>
          <span>~{Math.ceil(editor.storage.characterCount.words() / 200)} min read</span>
        </div>
        <div className="text-muted-foreground text-xs hidden sm:flex items-center gap-2">
          <kbd className="px-1.5 py-0.5 bg-background border rounded text-xs font-mono">/</kbd>
          <span>commands</span>
          {isFocusMode && (
            <>
              <span>&middot;</span>
              <kbd className="px-1.5 py-0.5 bg-background border rounded text-xs font-mono">Esc</kbd>
              <span>exit focus</span>
            </>
          )}
        </div>
      </div>

      {/* Link Modal */}
      {showLinkModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setShowLinkModal(false)}
        >
          <div
            className="bg-background rounded-xl shadow-xl w-full max-w-md p-6 border"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Insert Link</h3>
              <button
                onClick={() => setShowLinkModal(false)}
                className="p-1 hover:bg-accent rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">URL</label>
                <input
                  type="url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSetLink();
                  }}
                />
              </div>
              {linkText && (
                <div>
                  <label className="block text-sm font-medium mb-1">Selected Text</label>
                  <div className="px-4 py-2.5 bg-muted rounded-lg text-muted-foreground">
                    {linkText}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between mt-6 pt-4 border-t">
              {editor.isActive('link') ? (
                <button
                  onClick={handleRemoveLink}
                  className="flex items-center gap-2 px-4 py-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                >
                  <Trash2 className="h-4 w-4" /> Remove Link
                </button>
              ) : (
                <div />
              )}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowLinkModal(false)}
                  className="px-4 py-2 hover:bg-accent rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSetLink}
                  disabled={!linkUrl}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                  {editor.isActive('link') ? 'Update' : 'Insert'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// Helper Components
// ─────────────────────────────────────────────────────────────

function ToolbarButton({
  onClick,
  disabled,
  tooltip,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  tooltip: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={tooltip}
      className={`p-2 rounded-lg transition-colors ${
        disabled
          ? 'text-muted-foreground/40 cursor-not-allowed'
          : 'text-muted-foreground hover:bg-accent hover:text-foreground'
      }`}
    >
      {children}
    </button>
  );
}

function ToolbarToggle({
  active,
  onClick,
  tooltip,
  children,
}: {
  active: boolean;
  onClick: () => void;
  tooltip: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={tooltip}
      className={`p-2 rounded-lg transition-colors ${
        active ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-accent hover:text-foreground'
      }`}
    >
      {children}
    </button>
  );
}

function ToolbarDivider() {
  return <div className="w-px h-6 bg-border mx-1" />;
}

function ToolbarDropdown({
  label,
  icon,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors text-sm"
      >
        {icon}
        <span className="hidden sm:inline">{label}</span>
        <ChevronDown className={`h-3 w-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 bg-popover border rounded-lg shadow-lg py-1 min-w-[160px] z-30">
          {children}
        </div>
      )}
    </div>
  );
}

function DropdownItem({
  active,
  onClick,
  danger,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center px-3 py-2 text-sm transition-colors ${
        danger
          ? 'text-destructive hover:bg-destructive/10'
          : active
          ? 'bg-accent text-foreground'
          : 'text-foreground hover:bg-accent/50'
      }`}
    >
      {children}
    </button>
  );
}

function DropdownDivider() {
  return <div className="h-px bg-border my-1" />;
}

export default TiptapEditor;
