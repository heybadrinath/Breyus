import { NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * ImageResizeView Component
 *
 * A React NodeView for the CustomImage extension that provides:
 * - Visual resize handles at corners
 * - Drag-to-resize with aspect ratio preservation
 * - Click to select for bubble menu
 * - Proper cleanup of event listeners on unmount
 *
 * The component maintains its own resize state and updates the
 * Tiptap node attributes when resizing is complete.
 *
 * FIXES APPLIED:
 * - Bug #1: Added isMountedRef to prevent updates after unmount
 * - Bug #6: Respect max-width constraints for floated images
 * - Bug #7: Fixed corner delta logic to use diagonal distance
 * - Bug #12: Added error handling and null checks
 */

interface ResizeState {
  isResizing: boolean;
  startX: number;
  startY: number;
  startWidth: number;
  startHeight: number;
  aspectRatio: number;
  corner: 'nw' | 'ne' | 'sw' | 'se' | null;
}

const INITIAL_RESIZE_STATE: ResizeState = {
  isResizing: false,
  startX: 0,
  startY: 0,
  startWidth: 0,
  startHeight: 0,
  aspectRatio: 1,
  corner: null,
};

export function ImageResizeView({ node, updateAttributes, selected }: NodeViewProps) {
  const imageRef = useRef<HTMLImageElement>(null);
  const isMountedRef = useRef(true);
  const [resizeState, setResizeState] = useState<ResizeState>(INITIAL_RESIZE_STATE);
  // Fix #5: Track image load state to handle aspect ratio correctly
  const [_imageLoaded, setImageLoaded] = useState(false);

  // Track mounted state for cleanup safety
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Fix #5: Handle image load to ensure correct aspect ratio
  const handleImageLoad = useCallback(() => {
    setImageLoaded(true);
    // If no dimensions are set, store the natural dimensions
    const img = imageRef.current;
    if (img && !node.attrs.width && !node.attrs.height) {
      const naturalWidth = img.naturalWidth;
      const naturalHeight = img.naturalHeight;
      if (naturalWidth > 0 && naturalHeight > 0) {
        // Only update if the image is larger than a reasonable size
        const maxInitialWidth = 600;
        if (naturalWidth > maxInitialWidth) {
          const scale = maxInitialWidth / naturalWidth;
          updateAttributes({
            width: Math.round(naturalWidth * scale),
            height: Math.round(naturalHeight * scale),
          });
        }
      }
    }
  }, [node.attrs.width, node.attrs.height, updateAttributes]);

  // Get current dimensions from attrs or use natural dimensions
  const width = node.attrs.width;
  const height = node.attrs.height;
  const float = node.attrs.float as 'left' | 'right' | null;

  // Calculate max width based on float state
  // Floated images should not exceed 45% of container (handled by CSS, but we enforce in resize too)
  const getMaxWidth = useCallback(() => {
    if (float === 'left' || float === 'right') {
      // For floated images, limit to reasonable size
      // The CSS max-width: 45% will also apply, but inline styles override it
      // So we clamp to 400px for floated images to maintain layout
      return 400;
    }
    return 800;
  }, [float]);

  // Build class names based on float attribute
  const getImageClasses = useCallback(() => {
    const classes = ['rounded-lg', 'h-auto', 'block'];
    if (float === 'left') {
      classes.push('blog-image-float-left');
    } else if (float === 'right') {
      classes.push('blog-image-float-right');
    } else {
      classes.push('mx-auto', 'shadow-sm', 'my-6', 'max-w-full');
    }
    return classes.join(' ');
  }, [float]);

  // Handle mouse down on resize handle
  const handleResizeStart = useCallback(
    (e: React.MouseEvent, corner: 'nw' | 'ne' | 'sw' | 'se') => {
      e.preventDefault();
      e.stopPropagation();

      const img = imageRef.current;
      if (!img) return;

      const currentWidth = img.offsetWidth;
      const currentHeight = img.offsetHeight;
      // Fix #5: Use natural dimensions for aspect ratio if available
      const naturalRatio = img.naturalHeight > 0 ? img.naturalWidth / img.naturalHeight : 0;
      const displayRatio = currentHeight > 0 ? currentWidth / currentHeight : 0;
      // Prefer natural ratio, fallback to display ratio, default to 1
      const aspectRatio = naturalRatio || displayRatio || 1;

      setResizeState({
        isResizing: true,
        startX: e.clientX,
        startY: e.clientY,
        startWidth: currentWidth,
        startHeight: currentHeight,
        aspectRatio,
        corner,
      });
    },
    []
  );

  // Handle mouse move and mouse up during resize
  useEffect(() => {
    if (!resizeState.isResizing) return;

    const { startX, startY, startWidth, aspectRatio, corner } = resizeState;
    const maxWidth = getMaxWidth();
    const minWidth = 100;

    const handleMouseMove = (e: MouseEvent) => {
      // Safety check - don't proceed if unmounted
      if (!isMountedRef.current) return;

      const img = imageRef.current;
      if (!img) return;

      try {
        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;

        // Calculate diagonal distance for uniform resize behavior
        // Use the larger of the two deltas, adjusted for corner direction
        let effectiveDelta: number;

        switch (corner) {
          case 'se':
            // Bottom-right: positive delta = larger
            effectiveDelta = Math.max(deltaX, deltaY * aspectRatio);
            break;
          case 'sw':
            // Bottom-left: negative deltaX = larger, positive deltaY = larger
            effectiveDelta = Math.max(-deltaX, deltaY * aspectRatio);
            break;
          case 'ne':
            // Top-right: positive deltaX = larger, negative deltaY = larger
            effectiveDelta = Math.max(deltaX, -deltaY * aspectRatio);
            break;
          case 'nw':
            // Top-left: negative delta = larger
            effectiveDelta = Math.max(-deltaX, -deltaY * aspectRatio);
            break;
          default:
            effectiveDelta = deltaX;
        }

        // Calculate new dimensions maintaining aspect ratio
        let newWidth = startWidth + effectiveDelta;

        // Clamp to bounds
        newWidth = Math.min(maxWidth, Math.max(minWidth, newWidth));
        const newHeight = newWidth / aspectRatio;

        // Apply dimensions directly to the element for live preview
        img.style.width = `${Math.round(newWidth)}px`;
        img.style.height = `${Math.round(newHeight)}px`;
      } catch (error) {
        console.error('Error during image resize:', error);
      }
    };

    const handleMouseUp = () => {
      // Safety check - don't update state if unmounted
      if (!isMountedRef.current) return;

      try {
        const img = imageRef.current;
        if (img) {
          // Get the final dimensions and update the node attributes
          const finalWidth = Math.round(img.offsetWidth);
          const finalHeight = Math.round(img.offsetHeight);
          updateAttributes({
            width: finalWidth,
            height: finalHeight,
          });
        }
      } catch (error) {
        console.error('Error finalizing image resize:', error);
      }

      // Only update state if still mounted
      if (isMountedRef.current) {
        setResizeState(INITIAL_RESIZE_STATE);
      }
    };

    // Add listeners to document for capturing mouse events outside the element
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    // Cleanup function - always remove listeners
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizeState, updateAttributes, getMaxWidth]);

  // Compute style object
  const imageStyle: React.CSSProperties = {};
  if (width && !float) {
    // Only apply pixel width for non-floated images
    // Floated images use CSS percentage-based max-width
    imageStyle.width = `${width}px`;
    imageStyle.height = height ? `${height}px` : 'auto';
  } else if (width && float) {
    // For floated images, use width but let CSS handle max-width
    imageStyle.width = `${Math.min(width, getMaxWidth())}px`;
    imageStyle.height = 'auto';
  }

  return (
    <NodeViewWrapper
      className={`image-resize-wrapper ${selected ? 'selected' : ''} ${resizeState.isResizing ? 'resizing' : ''}`}
      data-drag-handle
    >
      <img
        ref={imageRef}
        src={node.attrs.src}
        alt={node.attrs.alt || ''}
        title={node.attrs.title || ''}
        className={getImageClasses()}
        style={imageStyle}
        draggable={false}
        onLoad={handleImageLoad}
        loading="lazy"
      />

      {/* Resize handles - only show when selected or on hover, hide during resize for cleaner UX */}
      {!resizeState.isResizing && (
        <>
          <div
            className="resize-handle nw"
            onMouseDown={(e) => handleResizeStart(e, 'nw')}
            role="button"
            aria-label="Resize from top-left corner"
          />
          <div
            className="resize-handle ne"
            onMouseDown={(e) => handleResizeStart(e, 'ne')}
            role="button"
            aria-label="Resize from top-right corner"
          />
          <div
            className="resize-handle sw"
            onMouseDown={(e) => handleResizeStart(e, 'sw')}
            role="button"
            aria-label="Resize from bottom-left corner"
          />
          <div
            className="resize-handle se"
            onMouseDown={(e) => handleResizeStart(e, 'se')}
            role="button"
            aria-label="Resize from bottom-right corner"
          />
        </>
      )}
    </NodeViewWrapper>
  );
}

export default ImageResizeView;
