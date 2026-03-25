import { NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Columns2, Columns3, Trash2 } from 'lucide-react';

/**
 * ImageGalleryView Component
 *
 * A React NodeView for the ImageGallery extension that provides:
 * - Drag-and-drop reordering of images within the gallery
 * - Column count controls (2 or 3 columns)
 * - Visual feedback during drag operations
 *
 * Uses @dnd-kit for accessible drag-and-drop functionality.
 */

interface GalleryImage {
  id: string;
  src: string;
  alt?: string;
  index: number;
}

interface SortableImageProps {
  id: string;
  src: string;
  alt?: string;
  onRemove: () => void;
}

/**
 * Generate a stable, unique ID for an image based on its src URL and index
 * Fix #6: Use combination of index and URL hash to prevent collisions
 * The index ensures uniqueness even if two URLs hash to same value
 */
function generateStableId(src: string, index: number): string {
  // Use a better hash algorithm (djb2) combined with index for uniqueness
  let hash = 5381;
  for (let i = 0; i < src.length; i++) {
    hash = ((hash << 5) + hash) ^ src.charCodeAt(i);
  }
  // Combine hash with index to guarantee uniqueness within gallery
  return `img-${index}-${Math.abs(hash).toString(36)}`;
}

function SortableImage({ id, src, alt, onRemove }: SortableImageProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 100 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`gallery-item relative group ${isDragging ? 'dragging' : ''}`}
    >
      <img
        src={src}
        alt={alt || ''}
        className="w-full h-full object-cover rounded-md"
        draggable={false}
        loading="lazy"
      />

      {/* Drag handle overlay - visible on hover */}
      <div className="gallery-item-overlay">
        <div
          {...attributes}
          {...listeners}
          className="gallery-drag-handle"
        >
          <GripVertical className="h-5 w-5 text-foreground" />
        </div>
      </div>

      {/* Remove button */}
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onRemove();
        }}
        className="absolute top-2 right-2 p-1.5 bg-destructive/90 text-destructive-foreground rounded-md opacity-0 group-hover:opacity-100 transition-opacity z-10"
        title="Remove image"
        type="button"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}

export function ImageGalleryView({
  node,
  updateAttributes,
  deleteNode,
  editor,
  getPos,
}: NodeViewProps) {
  const columns = node.attrs.columns || 2;
  const isMountedRef = useRef(true);

  // Track mounted state
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Extract images from the node content
  const initialImages = useMemo<GalleryImage[]>(() => {
    const imgs: GalleryImage[] = [];
    let imageIndex = 0;

    node.content.forEach((child) => {
      if (child.type.name === 'image' && child.attrs.src) {
        imgs.push({
          // Fix #6: Pass index to ensure unique IDs even with duplicate URLs
          id: generateStableId(child.attrs.src, imageIndex),
          src: child.attrs.src,
          alt: child.attrs.alt || '',
          index: imageIndex,
        });
        imageIndex++;
      }
    });

    return imgs;
  }, [node.content]);

  // Use local state for images to enable smooth drag-and-drop
  const [images, setImages] = useState<GalleryImage[]>(initialImages);

  // Fix #10: Track current image count in ref to avoid stale closure in timeout
  const imagesCountRef = useRef(initialImages.length);
  useEffect(() => {
    imagesCountRef.current = images.length;
  }, [images.length]);

  // Sync local state when node content changes externally
  useEffect(() => {
    setImages(initialImages);
  }, [initialImages]);

  // Auto-delete empty galleries
  // Fix #10: Use ref to check current count, avoiding stale closure
  useEffect(() => {
    if (images.length === 0 && isMountedRef.current) {
      const timer = setTimeout(() => {
        // Check the ref (current value) not the closure (stale value)
        if (isMountedRef.current && imagesCountRef.current === 0) {
          deleteNode();
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [images.length, deleteNode]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  /**
   * Handle drag end - reorder images in the gallery
   */
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      if (!over || active.id === over.id) {
        return;
      }

      setImages((currentImages) => {
        const oldIndex = currentImages.findIndex((item) => item.id === active.id);
        const newIndex = currentImages.findIndex((item) => item.id === over.id);

        if (oldIndex === -1 || newIndex === -1) {
          return currentImages;
        }

        const reorderedImages = arrayMove(currentImages, oldIndex, newIndex);

        // Update Tiptap document with new order
        if (editor && typeof getPos === 'function') {
          try {
            const pos = getPos();
            if (typeof pos !== 'number') return reorderedImages;

            const { state } = editor.view;
            const nodeAtPos = state.doc.nodeAt(pos);

            if (!nodeAtPos || nodeAtPos.type.name !== 'imageGallery') {
              return reorderedImages;
            }

            // Create new image nodes in the reordered sequence
            const newImageNodes = reorderedImages.map((img) =>
              state.schema.nodes.image.create({ src: img.src, alt: img.alt })
            );

            // Create a new gallery node with reordered images
            const newGallery = state.schema.nodes.imageGallery.create(
              { columns },
              newImageNodes
            );

            // Replace the gallery node
            const tr = state.tr.replaceWith(pos, pos + nodeAtPos.nodeSize, newGallery);
            editor.view.dispatch(tr);
          } catch (error) {
            console.error('Error reordering gallery images:', error);
          }
        }

        return reorderedImages;
      });
    },
    [columns, editor, getPos]
  );

  /**
   * Handle removing an image from the gallery
   */
  const handleRemoveImage = useCallback(
    (idToRemove: string) => {
      const newImages = images.filter((img) => img.id !== idToRemove);

      if (newImages.length === 0) {
        deleteNode();
        return;
      }

      setImages(newImages);

      // Update Tiptap document
      if (editor && typeof getPos === 'function') {
        try {
          const pos = getPos();
          if (typeof pos !== 'number') return;

          const { state } = editor.view;
          const nodeAtPos = state.doc.nodeAt(pos);

          if (!nodeAtPos || nodeAtPos.type.name !== 'imageGallery') {
            return;
          }

          const newImageNodes = newImages.map((img) =>
            state.schema.nodes.image.create({ src: img.src, alt: img.alt })
          );

          const newGallery = state.schema.nodes.imageGallery.create(
            { columns },
            newImageNodes
          );

          const tr = state.tr.replaceWith(pos, pos + nodeAtPos.nodeSize, newGallery);
          editor.view.dispatch(tr);
        } catch (error) {
          console.error('Error removing gallery image:', error);
        }
      }
    },
    [columns, deleteNode, editor, getPos, images]
  );

  const setColumnCount = useCallback(
    (newColumns: number) => {
      updateAttributes({ columns: newColumns });
    },
    [updateAttributes]
  );

  // If no images, show placeholder
  if (images.length === 0) {
    return (
      <NodeViewWrapper className="my-6">
        <div className="text-center py-8 border-2 border-dashed border-border rounded-lg text-muted-foreground">
          <p className="text-sm">Empty gallery - will be removed</p>
        </div>
      </NodeViewWrapper>
    );
  }

  return (
    <NodeViewWrapper className="my-6">
      {/* Gallery Controls */}
      <div className="flex items-center gap-2 mb-3 px-1">
        <span className="text-xs text-muted-foreground font-medium">
          Gallery ({images.length} {images.length === 1 ? 'image' : 'images'})
        </span>
        <div className="flex-1" />
        <button
          onClick={() => setColumnCount(2)}
          className={`p-1.5 rounded transition-colors ${
            columns === 2 ? 'bg-primary text-primary-foreground' : 'hover:bg-accent text-muted-foreground'
          }`}
          title="2 columns"
          type="button"
        >
          <Columns2 className="h-4 w-4" />
        </button>
        <button
          onClick={() => setColumnCount(3)}
          className={`p-1.5 rounded transition-colors ${
            columns === 3 ? 'bg-primary text-primary-foreground' : 'hover:bg-accent text-muted-foreground'
          }`}
          title="3 columns"
          type="button"
        >
          <Columns3 className="h-4 w-4" />
        </button>
        <div className="w-px h-5 bg-border mx-1" />
        <button
          onClick={() => deleteNode()}
          className="p-1.5 rounded transition-colors text-destructive hover:bg-destructive/10"
          title="Delete gallery"
          type="button"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* Gallery Grid with Drag-and-Drop */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={images} strategy={rectSortingStrategy}>
          <div className={`blog-image-gallery cols-${columns}`}>
            {images.map((image) => (
              <SortableImage
                key={image.id}
                id={image.id}
                src={image.src}
                alt={image.alt}
                onRemove={() => handleRemoveImage(image.id)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </NodeViewWrapper>
  );
}

export default ImageGalleryView;
