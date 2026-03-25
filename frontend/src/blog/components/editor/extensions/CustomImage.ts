import Image from '@tiptap/extension-image';

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
 * Extends the default Tiptap Image with a `float` attribute.
 * When float is 'left' or 'right', the image wraps with text using:
 * - .blog-image-float-left (float left, max-width 45%, margin-right)
 * - .blog-image-float-right (float right, max-width 45%, margin-left)
 *
 * JSON output: { type: 'image', attrs: { src, alt, title, float } }
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
    };
  },

  renderHTML({ HTMLAttributes }) {
    const float = HTMLAttributes['data-float'] || HTMLAttributes.float;
    const classes = ['rounded-lg', 'max-w-full', 'h-auto', 'my-6'];

    if (float === 'left') {
      classes.push('blog-image-float-left');
    } else if (float === 'right') {
      classes.push('blog-image-float-right');
    } else {
      classes.push('mx-auto', 'shadow-sm');
    }

    // Remove the data-float from the element attributes to keep HTML clean
    const { 'data-float': _removed, float: _floatRemoved, ...cleanAttrs } = HTMLAttributes;

    return [
      'img',
      {
        ...cleanAttrs,
        'data-float': float || undefined,
        class: classes.join(' '),
      },
    ];
  },

  addCommands() {
    return {
      ...this.parent?.(),
      setImageFloat:
        (float: ImageFloat) =>
        ({ commands }) => {
          return commands.updateAttributes('image', { float });
        },
    };
  },
});

export default CustomImage;
