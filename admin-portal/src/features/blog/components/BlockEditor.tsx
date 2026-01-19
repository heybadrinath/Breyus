import { useState, useRef, useCallback } from 'react';
import {
  Type,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Image,
  Quote,
  Code,
  Minus,
  Plus,
  Trash2,
  GripVertical,
  ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { BlockContent, BlockType } from '../types';

// Auto-resizing textarea component
interface AutoResizeTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  minHeight?: number;
}

function AutoResizeTextarea({ className, minHeight = 80, onChange, value, ...props }: AutoResizeTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const adjustHeight = useCallback((textarea: HTMLTextAreaElement | null) => {
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.max(textarea.scrollHeight, minHeight)}px`;
    }
  }, [minHeight]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    adjustHeight(e.target);
    onChange?.(e);
  };

  // Callback ref to handle both ref assignment and initial height
  const callbackRef = useCallback((node: HTMLTextAreaElement | null) => {
    textareaRef.current = node;
    if (node) {
      // Set initial height after a small delay to ensure content is rendered
      requestAnimationFrame(() => {
        adjustHeight(node);
      });
    }
  }, [adjustHeight]);

  return (
    <textarea
      ref={callbackRef}
      value={value}
      onChange={handleChange}
      className={cn(
        'flex w-full rounded-md bg-transparent text-base placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    />
  );
}

interface BlockEditorProps {
  blocks: BlockContent[];
  onChange: (blocks: BlockContent[]) => void;
  onImageUpload?: (file: File) => Promise<string>;
}

const BLOCK_TYPES: { type: BlockType; label: string; icon: any }[] = [
  { type: 'paragraph', label: 'Paragraph', icon: Type },
  { type: 'heading1', label: 'Heading 1', icon: Heading1 },
  { type: 'heading2', label: 'Heading 2', icon: Heading2 },
  { type: 'heading3', label: 'Heading 3', icon: Heading3 },
  { type: 'bulletList', label: 'Bullet List', icon: List },
  { type: 'numberedList', label: 'Numbered List', icon: ListOrdered },
  { type: 'image', label: 'Image', icon: Image },
  { type: 'quote', label: 'Quote', icon: Quote },
  { type: 'code', label: 'Code', icon: Code },
  { type: 'divider', label: 'Divider', icon: Minus },
];

/**
 * BlockEditor - Notion-style block editor with drag and drop
 *
 * Features:
 * - Multiple block types (paragraph, headings, lists, image, quote, code, divider)
 * - Add/remove blocks
 * - Change block type via dropdown
 * - Drag and drop reordering with HTML5 DnD API
 */
export function BlockEditor({ blocks, onChange, onImageUpload }: BlockEditorProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const dragNodeRef = useRef<HTMLDivElement | null>(null);

  const generateId = () => Math.random().toString(36).substring(2, 9);

  const addBlock = (index: number, type: BlockType = 'paragraph') => {
    const newBlock: BlockContent = {
      id: generateId(),
      type,
      content: '',
      meta: type === 'bulletList' || type === 'numberedList' ? { items: [''] } : undefined,
    };
    const newBlocks = [...blocks];
    newBlocks.splice(index + 1, 0, newBlock);
    onChange(newBlocks);
  };

  const removeBlock = (index: number) => {
    if (blocks.length <= 1) return; // Keep at least one block
    const newBlocks = blocks.filter((_, i) => i !== index);
    onChange(newBlocks);
  };

  const updateBlock = (index: number, updates: Partial<BlockContent>) => {
    const newBlocks = [...blocks];
    newBlocks[index] = { ...newBlocks[index], ...updates };
    onChange(newBlocks);
  };

  const changeBlockType = (index: number, newType: BlockType) => {
    const block = blocks[index];
    const newBlock: BlockContent = {
      ...block,
      type: newType,
      meta:
        newType === 'bulletList' || newType === 'numberedList'
          ? { items: block.content ? [block.content] : [''] }
          : block.meta,
    };
    updateBlock(index, newBlock);
  };

  const handleKeyDown = (
    e: React.KeyboardEvent,
    index: number,
    block: BlockContent
  ) => {
    // Enter to add new block
    if (e.key === 'Enter' && !e.shiftKey && block.type === 'paragraph') {
      e.preventDefault();
      addBlock(index);
    }
    // Backspace on empty block to remove
    if (e.key === 'Backspace' && !block.content && blocks.length > 1) {
      e.preventDefault();
      removeBlock(index);
    }
  };

  const handleImageUpload = async (index: number, file: File) => {
    if (!onImageUpload) return;
    try {
      const url = await onImageUpload(file);
      updateBlock(index, { content: url });
    } catch (error) {
      console.error('Image upload failed:', error);
    }
  };

  const updateListItem = (blockIndex: number, itemIndex: number, value: string) => {
    const block = blocks[blockIndex];
    const items = [...(block.meta?.items || [])];
    items[itemIndex] = value;
    updateBlock(blockIndex, { meta: { ...block.meta, items } });
  };

  const addListItem = (blockIndex: number) => {
    const block = blocks[blockIndex];
    const items = [...(block.meta?.items || []), ''];
    updateBlock(blockIndex, { meta: { ...block.meta, items } });
  };

  const removeListItem = (blockIndex: number, itemIndex: number) => {
    const block = blocks[blockIndex];
    const items = (block.meta?.items || []).filter((_, i) => i !== itemIndex);
    if (items.length === 0) items.push('');
    updateBlock(blockIndex, { meta: { ...block.meta, items } });
  };

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    setDraggedIndex(index);
    dragNodeRef.current = e.currentTarget;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
    // Add a slight delay to allow the drag image to be set
    setTimeout(() => {
      if (dragNodeRef.current) {
        dragNodeRef.current.style.opacity = '0.5';
      }
    }, 0);
  };

  const handleDragEnd = () => {
    if (dragNodeRef.current) {
      dragNodeRef.current.style.opacity = '1';
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
    dragNodeRef.current = null;
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDragOverIndex(null);
      return;
    }

    const newBlocks = [...blocks];
    const [draggedBlock] = newBlocks.splice(draggedIndex, 1);
    newBlocks.splice(dropIndex, 0, draggedBlock);
    onChange(newBlocks);

    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const renderBlockContent = (block: BlockContent, index: number) => {
    switch (block.type) {
      case 'paragraph':
        return (
          <AutoResizeTextarea
            value={block.content}
            onChange={(e) => updateBlock(index, { content: e.target.value })}
            onKeyDown={(e) => handleKeyDown(e, index, block)}
            placeholder="Start typing..."
            minHeight={60}
            className="resize-none border-none focus-visible:ring-0 px-2 py-3 leading-relaxed"
          />
        );

      case 'heading1':
        return (
          <Input
            value={block.content}
            onChange={(e) => updateBlock(index, { content: e.target.value })}
            placeholder="Heading 1"
            className="text-3xl font-bold border-none focus-visible:ring-0 px-2 h-auto py-3"
          />
        );

      case 'heading2':
        return (
          <Input
            value={block.content}
            onChange={(e) => updateBlock(index, { content: e.target.value })}
            placeholder="Heading 2"
            className="text-2xl font-semibold border-none focus-visible:ring-0 px-2 h-auto py-3"
          />
        );

      case 'heading3':
        return (
          <Input
            value={block.content}
            onChange={(e) => updateBlock(index, { content: e.target.value })}
            placeholder="Heading 3"
            className="text-xl font-medium border-none focus-visible:ring-0 px-2 h-auto py-3"
          />
        );

      case 'bulletList':
      case 'numberedList':
        return (
          <div className="space-y-3 py-2">
            {(block.meta?.items || ['']).map((item, itemIndex) => (
              <div key={itemIndex} className="flex items-start gap-3">
                <span className="mt-2.5 text-muted-foreground w-6 text-base">
                  {block.type === 'numberedList' ? `${itemIndex + 1}.` : '•'}
                </span>
                <Input
                  value={item}
                  onChange={(e) => updateListItem(index, itemIndex, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addListItem(index);
                    }
                    if (e.key === 'Backspace' && !item) {
                      e.preventDefault();
                      removeListItem(index, itemIndex);
                    }
                  }}
                  placeholder="List item..."
                  className="flex-1 border-none focus-visible:ring-0 px-2 py-2 h-auto"
                />
              </div>
            ))}
          </div>
        );

      case 'image':
        return (
          <div className="space-y-2">
            {block.content ? (
              <div className="relative group">
                <img
                  src={block.content}
                  alt={block.meta?.alt || ''}
                  className="max-w-full rounded-lg"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => updateBlock(index, { content: '' })}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-8 cursor-pointer hover:border-primary/50 transition-colors">
                <Image className="h-8 w-8 text-muted-foreground mb-2" />
                <span className="text-sm text-muted-foreground">
                  Click to upload an image
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageUpload(index, file);
                  }}
                />
              </label>
            )}
            {block.content && (
              <Input
                value={block.meta?.caption || ''}
                onChange={(e) =>
                  updateBlock(index, {
                    meta: { ...block.meta, caption: e.target.value },
                  })
                }
                placeholder="Image caption (optional)"
                className="text-sm text-muted-foreground"
              />
            )}
          </div>
        );

      case 'quote':
        return (
          <div className="border-l-4 border-primary pl-4 py-2">
            <AutoResizeTextarea
              value={block.content}
              onChange={(e) => updateBlock(index, { content: e.target.value })}
              placeholder="Enter quote..."
              minHeight={60}
              className="italic resize-none border-none focus-visible:ring-0 px-2 py-2 leading-relaxed"
            />
          </div>
        );

      case 'code':
        return (
          <div className="space-y-3">
            <Input
              value={block.meta?.language || ''}
              onChange={(e) =>
                updateBlock(index, {
                  meta: { ...block.meta, language: e.target.value },
                })
              }
              placeholder="Language (e.g., javascript, python)"
              className="text-xs w-40"
            />
            <AutoResizeTextarea
              value={block.content}
              onChange={(e) => updateBlock(index, { content: e.target.value })}
              placeholder="// Enter code..."
              minHeight={100}
              className="font-mono text-sm bg-muted resize-none rounded-md px-4 py-3"
            />
          </div>
        );

      case 'divider':
        return <hr className="border-t border-border my-4" />;

      default:
        return null;
    }
  };

  const getBlockIcon = (type: BlockType) => {
    const blockType = BLOCK_TYPES.find((b) => b.type === type);
    return blockType?.icon || Type;
  };

  return (
    <div className="space-y-3">
      {blocks.map((block, index) => {
        const Icon = getBlockIcon(block.type);
        const isDragging = draggedIndex === index;
        const isDragOver = dragOverIndex === index;

        return (
          <div
            key={block.id}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, index)}
            className={cn(
              'group relative flex gap-3 p-4 rounded-lg transition-all duration-200',
              'hover:bg-muted/50 border border-transparent',
              isDragging && 'opacity-50 scale-[0.98]',
              isDragOver && 'border-primary border-dashed bg-primary/5',
              !isDragging && !isDragOver && 'hover:border-border'
            )}
          >
            {/* Drag Handle & Controls */}
            <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity pt-1">
              <div
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragEnd={handleDragEnd}
                className="h-7 w-7 flex items-center justify-center rounded cursor-grab active:cursor-grabbing hover:bg-muted text-muted-foreground hover:text-foreground transition-colors select-none"
              >
                <GripVertical className="h-4 w-4 pointer-events-none" />
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                onClick={() => addBlock(index)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {/* Block type selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 shrink-0 text-muted-foreground hover:text-foreground"
                >
                  <Icon className="h-4 w-4 mr-1" />
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                {BLOCK_TYPES.map((bt) => (
                  <DropdownMenuItem
                    key={bt.type}
                    onClick={() => changeBlockType(index, bt.type)}
                    className={cn(
                      'cursor-pointer',
                      block.type === bt.type && 'bg-muted'
                    )}
                  >
                    <bt.icon className="h-4 w-4 mr-2" />
                    {bt.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Block content */}
            <div className="flex-1 min-w-0">{renderBlockContent(block, index)}</div>

            {/* Delete button */}
            {blocks.length > 1 && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                onClick={() => removeBlock(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        );
      })}

      {/* Add block at end */}
      <div
        className="flex items-center gap-2 p-2 rounded-lg border-2 border-dashed border-transparent hover:border-muted-foreground/25 transition-colors cursor-pointer group/add"
        onClick={() => addBlock(blocks.length - 1)}
      >
        <div className="h-7 w-7 flex items-center justify-center rounded bg-muted/50 group-hover/add:bg-muted transition-colors">
          <Plus className="h-4 w-4 text-muted-foreground" />
        </div>
        <span className="text-sm text-muted-foreground">Add a new block</span>
      </div>
    </div>
  );
}
