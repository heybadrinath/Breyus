import { Node, mergeAttributes } from '@tiptap/core';

export interface PullQuoteOptions {
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    pullQuote: {
      setPullQuote: () => ReturnType;
      togglePullQuote: () => ReturnType;
      unsetPullQuote: () => ReturnType;
    };
  }
}

/**
 * PullQuote Extension
 *
 * A styled blockquote variant for editorial pull quotes.
 * Renders with `.blog-pull-quote` class (left gold border, italic, light bg).
 *
 * JSON output: { type: 'pullQuote', content: [paragraph+] }
 */
export const PullQuote = Node.create<PullQuoteOptions>({
  name: 'pullQuote',

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  group: 'block',

  content: 'paragraph+',

  defining: true,

  parseHTML() {
    return [
      {
        tag: 'div[data-type="pull-quote"]',
      },
      {
        tag: 'blockquote[data-type="pull-quote"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        'data-type': 'pull-quote',
        class: 'blog-pull-quote',
      }),
      0,
    ];
  },

  addCommands() {
    return {
      setPullQuote:
        () =>
        ({ commands }) => {
          return commands.wrapIn(this.name);
        },
      togglePullQuote:
        () =>
        ({ commands }) => {
          return commands.toggleWrap(this.name);
        },
      unsetPullQuote:
        () =>
        ({ commands }) => {
          return commands.lift(this.name);
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      'Mod-Shift-q': () => this.editor.commands.togglePullQuote(),
    };
  },
});

export default PullQuote;
