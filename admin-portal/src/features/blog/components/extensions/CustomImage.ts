import Image from '@tiptap/extension-image';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { ImageResizeView } from './ImageResizeView';

export type ImageFloat = 'left' | 'right' | null;

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    customImage: {
      setImageFloat: (float: ImageFloat) => ReturnType;
    };
  }
}

/**
 * CustomImage Extension
 *
 * Extends the default Tiptap Image with:
 * - `float` attribute for text wrapping (left/right/null)
 * - `width` and `height` attributes for resize persistence
 * - Interactive resize handles via ReactNodeViewRenderer
 *
 * CSS classes applied:
 * - .blog-image-float-left (float left, max-width 45%, margin-right)
 * - .blog-image-float-right (float right, max-width 45%, margin-left)
 *
 * JSON output: { type: 'image', attrs: { src, alt, title, float, width, height } }
 */
export const CustomImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      float: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-float') || null,
        renderHTML: (attributes) => {
          if (!attributes.float) return {};
          return { 'data-float': attributes.float };
        },
      },
      width: {
        default: null,
        parseHTML: (element) => {
          const width = element.getAttribute('width') || element.style.width;
          return width ? parseInt(width, 10) : null;
        },
        renderHTML: (attributes) => {
          if (!attributes.width) return {};
          return { width: attributes.width };
        },
      },
      height: {
        default: null,
        parseHTML: (element) => {
          const height = element.getAttribute('height') || element.style.height;
          return height ? parseInt(height, 10) : null;
        },
        renderHTML: (attributes) => {
          if (!attributes.height) return {};
          return { height: attributes.height };
        },
      },
    };
  },

  // Use ReactNodeViewRenderer for interactive resize handles
  addNodeView() {
    return ReactNodeViewRenderer(ImageResizeView);
  },

  addCommands() {
    return {
      ...this.parent?.(),
      setImageFloat:
        (float: ImageFloat) =>
        ({ commands }) => {
          // Bug #11 fix: Use this.name instead of hardcoded 'image' string
          // This ensures the command targets the correct node type if renamed
          return commands.updateAttributes(this.name, { float });
        },
    };
  },
});

export default CustomImage;
