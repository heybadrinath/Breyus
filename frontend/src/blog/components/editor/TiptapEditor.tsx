import { useEditor, EditorContent, BubbleMenu, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import { CustomImage, PullQuote, Callout, ImageGallery } from './extensions';
import type { CalloutType } from './extensions';
import Underline from '@tiptap/extension-underline';
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
  TextQuote,
  Info,
  AlertTriangle,
  CheckCircle2,
  Lightbulb,
  Images,
} from 'lucide-react';
import type { TiptapContent } from '../../../types/marketplaceTypes';

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
  onImageUpload?: (file: File) => Promise<{ url: string; filename: string }>;
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

  // Slash command state
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [slashMenuPosition, setSlashMenuPosition] = useState({ top: 0, left: 0 });
  const [slashFilter, setSlashFilter] = useState('');
  const [selectedSlashIndex, setSelectedSlashIndex] = useState(0);

  // Refs for editor closure access (avoids stale closure in handleKeyDown)
  const slashOpenRef = useRef(false);
  const slashStartRef = useRef(0);
  const isEditorUpdateRef = useRef(false);

  const editorContainerRef = useRef<HTMLDivElement>(null);
  const filteredCommandsRef = useRef<SlashCommand[]>([]);

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
          class: 'text-[#B8860B] underline hover:text-[#9A7209] cursor-pointer',
        },
      }),
      CustomImage.configure({
        HTMLAttributes: {
          class: 'rounded-lg max-w-full h-auto my-6 mx-auto shadow-sm',
        },
        allowBase64: true,
      }),
      PullQuote,
      Callout,
      ImageGallery,
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Highlight.configure({
        multicolor: true,
        HTMLAttributes: {
          class: 'bg-yellow-200 px-1 rounded',
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
          class: 'border border-gray-300',
        },
      }),
      TableCell.configure({
        HTMLAttributes: {
          class: 'border border-gray-300 p-2 min-w-[80px]',
        },
      }),
      TableHeader.configure({
        HTMLAttributes: {
          class: 'border border-gray-300 p-2 bg-gray-100 font-semibold',
        },
      }),
      Typography,
      CodeBlockLowlight.configure({
        lowlight,
        HTMLAttributes: {
          class: 'bg-gray-900 text-gray-100 rounded-lg p-4 my-4 overflow-x-auto text-sm font-mono',
        },
      }),
    ],
    content,
    editable,
    onUpdate: ({ editor }: { editor: Editor }) => {
      isEditorUpdateRef.current = true;
      const json = editor.getJSON() as TiptapContent;
      onChange(json);

      // Update slash filter when menu is open
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
    },
    editorProps: {
      handleKeyDown: (view, event) => {
        // Open slash menu on `/` keypress
        if (event.key === '/' && !slashOpenRef.current) {
          const { from } = view.state.selection;
          const coords = view.coordsAtPos(from);
          const editorEl = editorContainerRef.current;

          if (editorEl) {
            const rect = editorEl.getBoundingClientRect();
            slashOpenRef.current = true;
            slashStartRef.current = from + 1; // Position AFTER the `/`
            setSlashMenuPosition({
              top: coords.top - rect.top + editorEl.scrollTop + 28,
              left: Math.min(coords.left - rect.left, rect.width - 300),
            });
            setShowSlashMenu(true);
            setSlashFilter('');
            setSelectedSlashIndex(0);
          }
          return false; // Let `/` be typed into editor
        }
        return false;
      },
    },
  });

  // Sync content from props only on external changes (not our own edits)
  useEffect(() => {
    if (!editor || !content) return;
    if (isEditorUpdateRef.current) {
      isEditorUpdateRef.current = false;
      return;
    }
    editor.commands.setContent(content);
  }, [editor, content]);

  // Global keydown handler for slash menu navigation
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
            const idx = Math.min(selectedSlashIndex, cmds.length - 1);
            executeSlashCommand(cmds[idx].command);
          }
          break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [showSlashMenu, selectedSlashIndex, editor, closeSlashMenu]);

  // Close slash menu when clicking outside
  useEffect(() => {
    if (!showSlashMenu) return;
    const handleClick = () => closeSlashMenu();
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
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

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (!onImageUpload || !editor) return;

    const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith('image/'));
    if (files.length === 0) return;

    try {
      setIsUploading(true);
      setUploadError(null);
      for (const file of files) {
        const result = await onImageUpload(file);
        editor.chain().focus().setImage({ src: result.url }).run();
      }
    } catch {
      setUploadError('Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  }, [editor, onImageUpload]);

  // Image upload — dynamically create file input on click (trusted user gesture)
  // IMPORTANT: Do NOT set display:none — browsers block .click() on hidden inputs
  const handleImageUpload = useCallback(() => {
    if (!onImageUpload || !editor) return;
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.style.position = 'fixed';
    input.style.top = '0';
    input.style.left = '0';
    input.style.opacity = '0.001';
    input.addEventListener('change', async () => {
      const file = input.files?.[0];
      if (!file) { input.remove(); return; }
      try {
        setIsUploading(true);
        setUploadError(null);
        const result = await onImageUpload(file);
        editor.chain().focus().setImage({ src: result.url }).run();
      } catch {
        setUploadError('Failed to upload image. Please try again.');
      } finally {
        setIsUploading(false);
        input.remove();
      }
    });
    document.body.appendChild(input);
    input.click();
  }, [editor, onImageUpload]);

  // Gallery upload — dynamically create multi-file input on click
  const handleGalleryUpload = useCallback((columns: number) => {
    if (!onImageUpload || !editor) return;
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;
    input.style.position = 'fixed';
    input.style.top = '0';
    input.style.left = '0';
    input.style.opacity = '0.001';
    input.addEventListener('change', async () => {
      const files = Array.from(input.files || []);
      if (files.length === 0) { input.remove(); return; }
      try {
        setIsUploading(true);
        setUploadError(null);
        const results = await Promise.all(files.map((file) => onImageUpload(file)));
        const imageNodes = results.map((result) => ({
          type: 'image' as const,
          attrs: { src: result.url },
        }));
        editor.chain().focus().insertContent({
          type: 'imageGallery',
          attrs: { columns },
          content: imageNodes,
        }).run();
      } catch {
        setUploadError('Failed to upload gallery images. Please try again.');
      } finally {
        setIsUploading(false);
        input.remove();
      }
    });
    document.body.appendChild(input);
    input.click();
  }, [editor, onImageUpload]);

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
      editor.chain().focus().extendMarkRange('link').setLink({ href: linkUrl }).run();
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
      { icon: FileCode, label: 'Code Block', description: 'Display code with syntax highlighting', command: () => editor.chain().focus().toggleCodeBlock().run() },
      { icon: TableIcon, label: 'Table', description: 'Insert a table', command: () => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run() },
      { icon: Minus, label: 'Divider', description: 'Visual separator', command: () => editor.chain().focus().setHorizontalRule().run() },
      { icon: ImageIcon, label: 'Image', description: 'Upload an image', command: () => handleImageUpload() },
      { icon: AlignLeft, label: 'Align Left', description: 'Left-align text', command: () => editor.chain().focus().setTextAlign('left').run() },
      { icon: AlignCenter, label: 'Align Center', description: 'Center-align text', command: () => editor.chain().focus().setTextAlign('center').run() },
      { icon: AlignRight, label: 'Align Right', description: 'Right-align text', command: () => editor.chain().focus().setTextAlign('right').run() },
      { icon: TextQuote, label: 'Pull Quote', description: 'Highlighted editorial quote', command: () => editor.chain().focus().setPullQuote().run() },
      { icon: Info, label: 'Info Box', description: 'Informational callout', command: () => editor.chain().focus().setCallout({ type: 'info' }).run() },
      { icon: AlertTriangle, label: 'Warning Box', description: 'Warning callout', command: () => editor.chain().focus().setCallout({ type: 'warning' }).run() },
      { icon: CheckCircle2, label: 'Success Box', description: 'Success callout', command: () => editor.chain().focus().setCallout({ type: 'success' }).run() },
      { icon: Lightbulb, label: 'Tip Box', description: 'Helpful tip callout', command: () => editor.chain().focus().setCallout({ type: 'tip' }).run() },
      { icon: Images, label: 'Image Gallery', description: 'Side-by-side image grid', command: () => handleGalleryUpload(2) },
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
      if (editor && slashStartRef.current > 0) {
        const { from } = editor.state.selection;
        editor
          .chain()
          .deleteRange({ from: slashStartRef.current - 1, to: from })
          .run();
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

  if (!editor) {
    return (
      <div className="border border-gray-200 rounded-xl min-h-[500px] flex items-center justify-center bg-white">
        <Loader2 className="h-8 w-8 text-[#B8860B] animate-spin" />
      </div>
    );
  }

  return (
    <>
      {/* Focus mode backdrop */}
      {isFocusMode && (
        <div
          className="fixed inset-0 z-[60] bg-white/80 backdrop-blur-sm"
          onClick={() => setIsFocusMode(false)}
        />
      )}
      <div
        ref={editorContainerRef}
        className={`border rounded-xl overflow-hidden bg-white transition-all duration-300 border-gray-200 ${
          isDragging ? 'ring-2 ring-[#B8860B] ring-offset-2' : ''
        } ${isFocusMode ? 'fixed inset-4 z-[70] rounded-xl shadow-2xl flex flex-col' : 'relative'}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
      {/* Upload Error Alert */}
      {uploadError && (
        <div className="absolute top-14 left-4 right-4 z-30 bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg flex items-center justify-between shadow-sm animate-in fade-in">
          <span className="text-sm">{uploadError}</span>
          <button
            onClick={() => setUploadError(null)}
            className="ml-2 p-1 hover:bg-red-100 rounded transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Toolbar */}
      <div className="sticky top-0 z-20 border-b border-gray-200 bg-white">
        <div className="flex flex-wrap items-center gap-0.5 p-2">
          {/* Undo/Redo */}
          <ToolbarButton
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            tooltip="Undo (Ctrl+Z)"
          >
            <Undo className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            tooltip="Redo (Ctrl+Shift+Z)"
          >
            <Redo className="h-4 w-4" />
          </ToolbarButton>

          <ToolbarDivider />

          {/* Text Type Dropdown */}
          <ToolbarDropdown
            label={
              editor.isActive('heading', { level: 1 })
                ? 'Heading 1'
                : editor.isActive('heading', { level: 2 })
                ? 'Heading 2'
                : editor.isActive('heading', { level: 3 })
                ? 'Heading 3'
                : 'Paragraph'
            }
            icon={<Type className="h-4 w-4" />}
          >
            <DropdownItem
              active={editor.isActive('paragraph')}
              onClick={() => editor.chain().focus().setParagraph().run()}
            >
              <Pilcrow className="h-4 w-4 mr-2" />
              Paragraph
            </DropdownItem>
            <DropdownItem
              active={editor.isActive('heading', { level: 1 })}
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            >
              <Heading1 className="h-4 w-4 mr-2" />
              Heading 1
            </DropdownItem>
            <DropdownItem
              active={editor.isActive('heading', { level: 2 })}
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            >
              <Heading2 className="h-4 w-4 mr-2" />
              Heading 2
            </DropdownItem>
            <DropdownItem
              active={editor.isActive('heading', { level: 3 })}
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            >
              <Heading3 className="h-4 w-4 mr-2" />
              Heading 3
            </DropdownItem>
          </ToolbarDropdown>

          <ToolbarDivider />

          {/* Basic Formatting */}
          <ToolbarToggle
            active={editor.isActive('bold')}
            onClick={() => editor.chain().focus().toggleBold().run()}
            tooltip="Bold (Ctrl+B)"
          >
            <Bold className="h-4 w-4" />
          </ToolbarToggle>
          <ToolbarToggle
            active={editor.isActive('italic')}
            onClick={() => editor.chain().focus().toggleItalic().run()}
            tooltip="Italic (Ctrl+I)"
          >
            <Italic className="h-4 w-4" />
          </ToolbarToggle>
          <ToolbarToggle
            active={editor.isActive('underline')}
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            tooltip="Underline (Ctrl+U)"
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
          <ToolbarButton onClick={openLinkModal} tooltip="Insert Link (Ctrl+K)">
            <LinkIcon className="h-4 w-4" />
          </ToolbarButton>
          {onImageUpload && (
            <ToolbarButton
              onClick={handleImageUpload}
              disabled={isUploading}
              tooltip="Insert Image"
            >
              {isUploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ImageIcon className="h-4 w-4" />
              )}
            </ToolbarButton>
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
            tooltip="Horizontal Divider"
          >
            <Minus className="h-4 w-4" />
          </ToolbarButton>

          <ToolbarDivider />

          {/* Special Blocks */}
          <ToolbarButton
            onClick={() => editor.chain().focus().togglePullQuote().run()}
            tooltip="Pull Quote"
          >
            <TextQuote className="h-4 w-4" />
          </ToolbarButton>

          <ToolbarDropdown label="Callout" icon={<Info className="h-4 w-4" />}>
            <DropdownItem
              onClick={() => editor.chain().focus().setCallout({ type: 'info' }).run()}
            >
              <Info className="h-4 w-4 mr-2 text-blue-500" />
              Info Box
            </DropdownItem>
            <DropdownItem
              onClick={() => editor.chain().focus().setCallout({ type: 'warning' }).run()}
            >
              <AlertTriangle className="h-4 w-4 mr-2 text-amber-500" />
              Warning Box
            </DropdownItem>
            <DropdownItem
              onClick={() => editor.chain().focus().setCallout({ type: 'success' }).run()}
            >
              <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
              Success Box
            </DropdownItem>
            <DropdownItem
              onClick={() => editor.chain().focus().setCallout({ type: 'tip' }).run()}
            >
              <Lightbulb className="h-4 w-4 mr-2 text-purple-500" />
              Tip Box
            </DropdownItem>
            {editor.isActive('callout') && (
              <>
                <DropdownDivider />
                <DropdownItem
                  onClick={() => editor.chain().focus().unsetCallout().run()}
                  danger
                >
                  Remove Callout
                </DropdownItem>
              </>
            )}
          </ToolbarDropdown>

          {onImageUpload && (
            <ToolbarButton
              onClick={() => handleGalleryUpload(2)}
              disabled={isUploading}
              tooltip="Insert Image Gallery"
            >
              <Images className="h-4 w-4" />
            </ToolbarButton>
          )}

          <ToolbarDivider />

          {/* Table Dropdown */}
          <ToolbarDropdown label="Table" icon={<TableIcon className="h-4 w-4" />}>
            <DropdownItem
              onClick={() =>
                editor
                  .chain()
                  .focus()
                  .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
                  .run()
              }
            >
              <LayoutGrid className="h-4 w-4 mr-2" />
              Insert Table
            </DropdownItem>
            {editor.isActive('table') && (
              <>
                <DropdownDivider />
                <DropdownItem
                  onClick={() => editor.chain().focus().addColumnBefore().run()}
                >
                  Add Column Before
                </DropdownItem>
                <DropdownItem
                  onClick={() => editor.chain().focus().addColumnAfter().run()}
                >
                  Add Column After
                </DropdownItem>
                <DropdownItem
                  onClick={() => editor.chain().focus().addRowBefore().run()}
                >
                  Add Row Before
                </DropdownItem>
                <DropdownItem
                  onClick={() => editor.chain().focus().addRowAfter().run()}
                >
                  Add Row After
                </DropdownItem>
                <DropdownDivider />
                <DropdownItem
                  onClick={() => editor.chain().focus().deleteColumn().run()}
                  danger
                >
                  Delete Column
                </DropdownItem>
                <DropdownItem
                  onClick={() => editor.chain().focus().deleteRow().run()}
                  danger
                >
                  Delete Row
                </DropdownItem>
                <DropdownItem
                  onClick={() => editor.chain().focus().deleteTable().run()}
                  danger
                >
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

      {/* Bubble Menu for quick formatting */}
      <BubbleMenu
        editor={editor}
        tippyOptions={{ duration: 150, placement: 'top' }}
        className="bg-white border border-gray-200 rounded-lg shadow-lg flex items-center gap-0.5 p-1"
      >
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-1.5 rounded transition-colors ${
            editor.isActive('bold')
              ? 'bg-[#1A1A2E] text-white'
              : 'hover:bg-gray-100 text-gray-700'
          }`}
        >
          <Bold className="h-4 w-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-1.5 rounded transition-colors ${
            editor.isActive('italic')
              ? 'bg-[#1A1A2E] text-white'
              : 'hover:bg-gray-100 text-gray-700'
          }`}
        >
          <Italic className="h-4 w-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`p-1.5 rounded transition-colors ${
            editor.isActive('underline')
              ? 'bg-[#1A1A2E] text-white'
              : 'hover:bg-gray-100 text-gray-700'
          }`}
        >
          <UnderlineIcon className="h-4 w-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHighlight().run()}
          className={`p-1.5 rounded transition-colors ${
            editor.isActive('highlight')
              ? 'bg-[#1A1A2E] text-white'
              : 'hover:bg-gray-100 text-gray-700'
          }`}
        >
          <Highlighter className="h-4 w-4" />
        </button>
        <div className="w-px h-5 bg-gray-200 mx-1" />
        <button
          onClick={openLinkModal}
          className={`p-1.5 rounded transition-colors ${
            editor.isActive('link')
              ? 'bg-[#1A1A2E] text-white'
              : 'hover:bg-gray-100 text-gray-700'
          }`}
        >
          <LinkIcon className="h-4 w-4" />
        </button>
      </BubbleMenu>

      {/* Slash Command Menu */}
      {showSlashMenu && (
        <div
          className="absolute z-30 bg-white border border-gray-200 rounded-xl shadow-xl w-72 max-h-80 overflow-y-auto"
          style={{ top: slashMenuPosition.top, left: slashMenuPosition.left }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-3 py-2 border-b border-gray-100">
            <p className="text-xs text-gray-400 font-medium">
              {slashFilter ? `Filtering: "${slashFilter}"` : 'Type to filter...'}
            </p>
          </div>
          <div className="py-1">
            {filteredCommands.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-500 text-center">No commands found</div>
            ) : (
              filteredCommands.map((cmd, index) => (
                <button
                  key={cmd.label}
                  data-slash-index={index}
                  onClick={() => executeSlashCommand(cmd.command)}
                  className={`w-full flex items-center gap-3 px-4 py-2 text-left transition-colors ${
                    index === selectedSlashIndex
                      ? 'bg-[#B8860B]/10 text-[#1A1A2E]'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div
                    className={`p-2 rounded-lg ${
                      index === selectedSlashIndex ? 'bg-[#B8860B]/20' : 'bg-gray-100'
                    }`}
                  >
                    <cmd.icon className="h-4 w-4 text-gray-600" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">{cmd.label}</div>
                    <div className="text-xs text-gray-500">{cmd.description}</div>
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
        className={`prose prose-sm sm:prose lg:prose-lg max-w-none px-6 py-8 focus:outline-none
          ${isFocusMode ? 'flex-1 overflow-y-auto' : 'min-h-[400px]'}
          prose-headings:text-gray-900 prose-headings:font-bold prose-headings:tracking-tight
          prose-h1:text-4xl prose-h1:mb-4 prose-h2:text-3xl prose-h2:mb-3 prose-h3:text-2xl prose-h3:mb-2
          prose-p:text-gray-700 prose-p:leading-relaxed prose-p:mb-4
          prose-a:text-[#B8860B] prose-a:no-underline hover:prose-a:underline
          prose-blockquote:border-l-4 prose-blockquote:border-[#B8860B] prose-blockquote:pl-6 prose-blockquote:italic prose-blockquote:text-gray-600 prose-blockquote:bg-gray-50 prose-blockquote:py-2 prose-blockquote:rounded-r-lg
          prose-code:bg-gray-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:text-[#B8860B]
          prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-pre:rounded-xl prose-pre:shadow-lg
          prose-ul:list-disc prose-ol:list-decimal
          prose-img:rounded-xl prose-img:shadow-md
          prose-table:border-collapse prose-table:w-full
          prose-th:border prose-th:border-gray-300 prose-th:bg-gray-50 prose-th:p-3 prose-th:font-semibold
          prose-td:border prose-td:border-gray-300 prose-td:p-3
          [&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-[350px]
          [&_.ProseMirror_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]
          [&_.ProseMirror_p.is-editor-empty:first-child::before]:text-gray-400
          [&_.ProseMirror_p.is-editor-empty:first-child::before]:float-left
          [&_.ProseMirror_p.is-editor-empty:first-child::before]:pointer-events-none
          [&_.ProseMirror_p.is-editor-empty:first-child::before]:h-0`}
      />

      {/* Drag & Drop Overlay */}
      {isDragging && (
        <div className="absolute inset-0 bg-[#B8860B]/10 flex items-center justify-center z-40">
          <div className="text-center">
            <Upload className="h-12 w-12 text-[#B8860B] mx-auto mb-3" />
            <p className="text-lg font-medium text-[#1A1A2E]">Drop images here</p>
            <p className="text-sm text-[#B8860B]">Release to upload</p>
          </div>
        </div>
      )}

      {/* Footer with stats */}
      <div className="border-t border-gray-200 bg-gray-50 px-4 py-3 flex items-center justify-between text-sm">
        <div className="flex items-center gap-4 text-gray-500">
          <span className="flex items-center gap-1">
            <Type className="h-4 w-4" />
            {editor.storage.characterCount.characters().toLocaleString()} characters
          </span>
          <span className="flex items-center gap-1">
            <Sparkles className="h-4 w-4" />
            {editor.storage.characterCount.words().toLocaleString()} words
          </span>
          <span className="text-gray-400">
            ~{Math.ceil(editor.storage.characterCount.words() / 200)} min read
          </span>
        </div>
        <div className="text-gray-400 text-xs hidden sm:block">
          <kbd className="px-1.5 py-0.5 bg-white border border-gray-200 rounded text-xs font-mono">
            Ctrl+B
          </kbd>{' '}
          bold
          <span className="mx-2">&middot;</span>
          <kbd className="px-1.5 py-0.5 bg-white border border-gray-200 rounded text-xs font-mono">
            Ctrl+I
          </kbd>{' '}
          italic
          <span className="mx-2">&middot;</span>
          <kbd className="px-1.5 py-0.5 bg-white border border-gray-200 rounded text-xs font-mono">
            /
          </kbd>{' '}
          commands
          {isFocusMode && (
            <>
              <span className="mx-2">&middot;</span>
              <kbd className="px-1.5 py-0.5 bg-white border border-gray-200 rounded text-xs font-mono">
                Esc
              </kbd>{' '}
              exit focus
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
            className="bg-white rounded-xl shadow-xl w-full max-w-md p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Insert Link</h3>
              <button
                onClick={() => setShowLinkModal(false)}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL</label>
                <input
                  type="url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B8860B] focus:border-transparent"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSetLink();
                  }}
                />
              </div>
              {linkText && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Selected Text
                  </label>
                  <div className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-600">
                    {linkText}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
              {editor.isActive('link') ? (
                <button
                  onClick={handleRemoveLink}
                  className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                  Remove Link
                </button>
              ) : (
                <div />
              )}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowLinkModal(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSetLink}
                  disabled={!linkUrl}
                  className="flex items-center gap-2 px-4 py-2 bg-[#1A1A2E] text-white rounded-lg hover:bg-[#2a2a4e] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                  {editor.isActive('link') ? 'Update Link' : 'Insert Link'}
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
          ? 'text-gray-300 cursor-not-allowed'
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
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
        active
          ? 'bg-[#B8860B]/20 text-[#B8860B]'
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
      }`}
    >
      {children}
    </button>
  );
}

function ToolbarDivider() {
  return <div className="w-px h-6 bg-gray-200 mx-1" />;
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
        className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors text-sm"
      >
        {icon}
        <span className="hidden sm:inline">{label}</span>
        <ChevronDown
          className={`h-3 w-3 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[160px] z-30">
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
          ? 'text-red-600 hover:bg-red-50'
          : active
          ? 'bg-[#B8860B]/10 text-[#B8860B]'
          : 'text-gray-700 hover:bg-gray-50'
      }`}
    >
      {children}
    </button>
  );
}

function DropdownDivider() {
  return <div className="h-px bg-gray-200 my-1" />;
}

export default TiptapEditor;
