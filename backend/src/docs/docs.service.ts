import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { marked } from 'marked';
import hljs from 'highlight.js';

interface DocModule {
  name: string;
  slug: string;
  description: string;
  icon: string;
  category: 'core' | 'business' | 'supporting';
}

@Injectable()
export class DocsService {
  private readonly docsPath: string;
  private readonly modules: DocModule[] = [
    { name: 'Authentication', slug: 'auth', description: 'Session validation, logout, and password management', icon: 'shield', category: 'core' },
    { name: 'Login', slug: 'login', description: 'User authentication with OTP verification', icon: 'log-in', category: 'core' },
    { name: 'Onboarding', slug: 'onboarding', description: 'User registration and company setup wizard', icon: 'user-plus', category: 'core' },
    { name: 'Products', slug: 'products', description: 'Product catalog and inventory management', icon: 'package', category: 'business' },
    { name: 'Trade', slug: 'trade', description: 'Trade lifecycle, negotiation, and document management', icon: 'trending-up', category: 'business' },
    { name: 'Company', slug: 'company', description: 'Company profiles and delivery addresses', icon: 'building', category: 'business' },
    { name: 'Wishlist', slug: 'wishlist', description: 'Save and manage favorite products', icon: 'heart', category: 'supporting' },
    { name: 'Inbox', slug: 'inbox', description: 'Real-time messaging and conversations', icon: 'message-square', category: 'supporting' },
    { name: 'Users', slug: 'users', description: 'User account information', icon: 'users', category: 'supporting' },
    { name: 'Analytics', slug: 'analytics', description: 'Dashboard metrics and chart data', icon: 'bar-chart-2', category: 'supporting' },
  ];

  constructor() {
    // Path to api_docs folder (relative to backend)
    this.docsPath = path.join(process.cwd(), '..', 'api_docs');

    // Configure marked with highlight.js
    marked.setOptions({
      gfm: true,
      breaks: false,
      highlight: (code: string, lang: string): string => {
        if (lang && hljs.getLanguage(lang)) {
          try {
            return hljs.highlight(code, { language: lang, ignoreIllegals: true }).value;
          } catch (e) {
            return code;
          }
        }
        try {
          return hljs.highlightAuto(code).value;
        } catch (e) {
          return code;
        }
      },
    });

    // Create custom renderer
    const renderer = new marked.Renderer();

    // Custom code block renderer with language badge and copy button
    renderer.code = (code: string, language: string | undefined): string => {
      const lang = language || 'text';
      let highlighted: string;

      try {
        if (lang && hljs.getLanguage(lang)) {
          highlighted = hljs.highlight(code, { language: lang, ignoreIllegals: true }).value;
        } else {
          highlighted = hljs.highlightAuto(code).value;
        }
      } catch (e) {
        highlighted = code;
      }

      return `<div class="code-block" data-lang="${lang}">
        <div class="code-header">
          <span class="code-lang">${lang}</span>
          <button class="copy-btn" onclick="copyCode(this)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
            <span>Copy</span>
          </button>
        </div>
        <pre><code class="hljs language-${lang}">${highlighted}</code></pre>
      </div>`;
    };

    // Custom inline code renderer
    renderer.codespan = (text: string): string => {
      return `<code class="inline-code">${text}</code>`;
    };

    // Custom heading renderer with anchor links
    renderer.heading = (text: string, level: number): string => {
      const slug = text.toLowerCase().replace(/<[^>]*>/g, '').replace(/[^\w]+/g, '-').replace(/^-|-$/g, '');
      return `<h${level} id="${slug}" class="doc-h${level}">
        <a href="#${slug}" class="heading-anchor">#</a>
        ${text}
      </h${level}>`;
    };

    // Custom table renderer
    renderer.table = (header: string, body: string): string => {
      return `<div class="table-wrapper">
        <table class="doc-table">
          <thead>${header}</thead>
          <tbody>${body}</tbody>
        </table>
      </div>`;
    };

    // Custom blockquote renderer (for callouts)
    renderer.blockquote = (quote: string): string => {
      // Check if it's a special callout (starts with Note:, Warning:, etc.)
      const noteMatch = quote.match(/^<p>\s*(Note|Warning|Info|Tip|Important):\s*/i);
      if (noteMatch) {
        const type = noteMatch[1].toLowerCase();
        const cleanContent = quote.replace(noteMatch[0], '<p>');
        return `<div class="callout callout-${type}">
          <div class="callout-icon">${this.getCalloutIcon(type)}</div>
          <div class="callout-content">${cleanContent}</div>
        </div>`;
      }
      return `<blockquote class="doc-quote">${quote}</blockquote>`;
    };

    // Custom link renderer
    renderer.link = (href: string, title: string | null, text: string): string => {
      const titleAttr = title ? ` title="${title}"` : '';
      const isExternal = href.startsWith('http');
      const externalAttrs = isExternal ? ' target="_blank" rel="noopener noreferrer"' : '';
      const externalIcon = isExternal ? '<svg class="external-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>' : '';
      return `<a href="${href}"${titleAttr}${externalAttrs} class="doc-link">${text}${externalIcon}</a>`;
    };

    // Custom horizontal rule
    renderer.hr = (): string => {
      return '<hr class="doc-hr">';
    };

    // Apply custom renderer
    marked.setOptions({ renderer });
  }

  private getCalloutIcon(type: string): string {
    const icons: Record<string, string> = {
      note: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>',
      warning: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>',
      info: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>',
      tip: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18h6"></path><path d="M10 22h4"></path><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"></path></svg>',
      important: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>',
    };
    return icons[type] || icons.note;
  }

  getModules(): DocModule[] {
    return this.modules;
  }

  getModulesByCategory(): Record<string, DocModule[]> {
    return {
      core: this.modules.filter(m => m.category === 'core'),
      business: this.modules.filter(m => m.category === 'business'),
      supporting: this.modules.filter(m => m.category === 'supporting'),
    };
  }

  getReadme(): string {
    try {
      const readmePath = path.join(this.docsPath, 'README.md');
      return fs.readFileSync(readmePath, 'utf-8');
    } catch (error) {
      return '# API Documentation\n\nREADME not found.';
    }
  }

  getModuleDoc(slug: string): string | null {
    try {
      const docPath = path.join(this.docsPath, `${slug}.md`);
      return fs.readFileSync(docPath, 'utf-8');
    } catch (error) {
      return null;
    }
  }

  getModuleInfo(slug: string): DocModule | undefined {
    return this.modules.find(m => m.slug === slug);
  }

  // Convert markdown to HTML using marked
  markdownToHtml(markdown: string): string {
    return marked(markdown);
  }
}
