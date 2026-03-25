import { Node, mergeAttributes } from '@tiptap/core';

export type CalloutType = 'info' | 'warning' | 'success' | 'tip';

export interface CalloutOptions {
  HTMLAttributes: Record<string, any>;
  types: CalloutType[];
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    callout: {
      setCallout: (attrs?: { type?: CalloutType }) => ReturnType;
      toggleCallout: (attrs?: { type?: CalloutType }) => ReturnType;
      unsetCallout: () => ReturnType;
      updateCalloutType: (type: CalloutType) => ReturnType;
    };
  }
}

/**
 * Callout Extension
 *
 * Colored callout/admonition blocks for editorial content.
 * Supports 4 variants: info, warning, success, tip.
 *
 * CSS classes:
 * - .blog-callout (base)
 * - .blog-callout-info (blue left border)
 * - .blog-callout-warning (amber left border)
 * - .blog-callout-success (green left border)
 * - .blog-callout-tip (purple left border)
 *
 * JSON output: { type: 'callout', attrs: { calloutType: 'info' }, content: [paragraph+] }
 */
export const Callout = Node.create<CalloutOptions>({
  name: 'callout',

  addOptions() {
    return {
      HTMLAttributes: {},
      types: ['info', 'warning', 'success', 'tip'],
    };
  },

  group: 'block',

  content: 'paragraph+',

  defining: true,

  addAttributes() {
    return {
      calloutType: {
        default: 'info',
        parseHTML: (element) =>
          element.getAttribute('data-callout-type') || 'info',
        renderHTML: (attributes) => ({
          'data-callout-type': attributes.calloutType,
        }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="callout"]',
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    const calloutType = node.attrs.calloutType as CalloutType;
    return [
      'div',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        'data-type': 'callout',
        'data-callout-type': calloutType,
        class: `blog-callout blog-callout-${calloutType}`,
      }),
      0,
    ];
  },

  addCommands() {
    return {
      setCallout:
        (attrs) =>
        ({ commands }) => {
          return commands.wrapIn(this.name, { calloutType: attrs?.type || 'info' });
        },
      toggleCallout:
        (attrs) =>
        ({ commands }) => {
          return commands.toggleWrap(this.name, { calloutType: attrs?.type || 'info' });
        },
      unsetCallout:
        () =>
        ({ commands }) => {
          return commands.lift(this.name);
        },
      updateCalloutType:
        (type) =>
        ({ commands }) => {
          return commands.updateAttributes(this.name, { calloutType: type });
        },
    };
  },
});

export default Callout;
