import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { ImageGalleryView } from './ImageGalleryView';

export interface ImageGalleryOptions {
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    imageGallery: {
      setImageGallery: (attrs?: { columns?: number }) => ReturnType;
      setGalleryColumns: (columns: number) => ReturnType;
    };
  }
}

/**
 * ImageGallery Extension
 *
 * A CSS Grid container for displaying multiple images side-by-side.
 * Supports 2 or 3 column layouts with drag-to-reorder functionality.
 *
 * Features:
 * - Responsive CSS Grid (2 or 3 columns)
 * - Drag-and-drop reordering via ImageGalleryView
 * - Individual image removal
 * - Column count controls
 *
 * CSS classes:
 * - .blog-image-gallery (base grid)
 * - .cols-2 (2-column grid)
 * - .cols-3 (3-column grid)
 *
 * JSON output: { type: 'imageGallery', attrs: { columns: 2|3 }, content: [image+] }
 */
export const ImageGallery = Node.create<ImageGalleryOptions>({
  name: 'imageGallery',

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  group: 'block',

  // FIXED: Only allow image nodes as children (no paragraphs)
  // This ensures galleries contain only images
  content: 'image+',

  defining: true,

  // Don't isolate the content - allow images to be inserted directly
  isolating: false,

  addAttributes() {
    return {
      columns: {
        default: 2,
        parseHTML: (element) => {
          const cols = element.getAttribute('data-columns');
          return cols ? parseInt(cols, 10) : 2;
        },
        renderHTML: (attributes) => ({
          'data-columns': attributes.columns,
        }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="image-gallery"]',
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    const columns = node.attrs.columns || 2;
    return [
      'div',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        'data-type': 'image-gallery',
        'data-columns': columns,
        class: `blog-image-gallery cols-${columns}`,
      }),
      0,
    ];
  },

  // Use ReactNodeViewRenderer for interactive drag-and-drop
  addNodeView() {
    return ReactNodeViewRenderer(ImageGalleryView);
  },

  addCommands() {
    return {
      setImageGallery:
        (attrs) =>
        ({ chain, state }) => {
          const columns = attrs?.columns || 2;
          // Create a placeholder image for empty galleries
          // In practice, galleries are created via handleGalleryUpload with real images
          const placeholderImage = state.schema.nodes.image.create({
            src: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="150"%3E%3Crect fill="%23ddd" width="200" height="150"/%3E%3Ctext fill="%23999" font-size="14" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EImage%3C/text%3E%3C/svg%3E',
            alt: 'Placeholder',
          });

          return chain()
            .insertContent({
              type: this.name,
              attrs: { columns },
              content: [
                {
                  type: 'image',
                  attrs: placeholderImage.attrs,
                },
              ],
            })
            .run();
        },
      setGalleryColumns:
        (columns) =>
        ({ commands }) => {
          return commands.updateAttributes(this.name, { columns });
        },
    };
  },
});

export default ImageGallery;
