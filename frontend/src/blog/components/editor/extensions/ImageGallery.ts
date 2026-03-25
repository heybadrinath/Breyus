import { Node, mergeAttributes } from '@tiptap/core';

export interface ImageGalleryOptions {
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    imageGallery: {
      setImageGallery: (attrs?: { columns?: number }) => ReturnType;
    };
  }
}

/**
 * ImageGallery Extension
 *
 * A CSS Grid container for displaying multiple images side-by-side.
 * Supports 2 or 3 column layouts.
 *
 * CSS classes:
 * - .blog-image-gallery (base grid)
 * - .cols-2 (2-column grid)
 * - .cols-3 (3-column grid)
 *
 * JSON output: { type: 'imageGallery', attrs: { columns: 2|3 }, content: [image+] }
 *
 * Content model: allows paragraphs (which can contain inline images)
 * and image nodes directly. The gallery is rendered as a grid.
 */
export const ImageGallery = Node.create<ImageGalleryOptions>({
  name: 'imageGallery',

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  group: 'block',

  // Allow paragraphs and images as children
  content: '(paragraph | image)+',

  defining: true,

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

  addCommands() {
    return {
      setImageGallery:
        (attrs) =>
        ({ chain }) => {
          const columns = attrs?.columns || 2;
          return chain()
            .insertContent({
              type: this.name,
              attrs: { columns },
              content: [
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: 'Add images to this gallery...' }],
                },
              ],
            })
            .run();
        },
    };
  },
});

export default ImageGallery;
