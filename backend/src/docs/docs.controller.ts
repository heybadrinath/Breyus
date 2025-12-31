import { Controller, Get, Param, Res } from '@nestjs/common';
import { Response } from 'express';
import { DocsService } from './docs.service';

@Controller('docs')
export class DocsController {
  constructor(private readonly docsService: DocsService) {}

  @Get()
  getDocsHome(@Res() res: Response) {
    const modules = this.docsService.getModulesByCategory();
    const readme = this.docsService.getReadme();
    const readmeHtml = this.docsService.markdownToHtml(readme);

    const html = this.generateHomePage(modules, readmeHtml);
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  }

  @Get(':slug')
  getModuleDoc(@Param('slug') slug: string, @Res() res: Response) {
    const moduleInfo = this.docsService.getModuleInfo(slug);
    const moduleDoc = this.docsService.getModuleDoc(slug);

    if (!moduleInfo || !moduleDoc) {
      res.status(404).send(this.generate404Page(slug));
      return;
    }

    const docHtml = this.docsService.markdownToHtml(moduleDoc);
    const modules = this.docsService.getModulesByCategory();
    const html = this.generateModulePage(moduleInfo, docHtml, modules);

    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  }

  private getBaseStyles(): string {
    return `
      /* ============================================
         NOTION-LIKE DARK THEME FOR API DOCS
         ============================================ */

      :root {
        /* Colors - Notion-inspired dark palette */
        --bg-primary: #191919;
        --bg-secondary: #202020;
        --bg-tertiary: #2a2a2a;
        --bg-elevated: #252525;
        --bg-hover: #333333;
        --bg-active: #3a3a3a;

        --text-primary: #ebebeb;
        --text-secondary: #9b9b9b;
        --text-muted: #6b6b6b;
        --text-faint: #4a4a4a;

        --accent: #528bff;
        --accent-hover: #6b9fff;
        --accent-muted: rgba(82, 139, 255, 0.15);

        --border: #333333;
        --border-light: #404040;

        --success: #4ade80;
        --success-bg: rgba(74, 222, 128, 0.1);
        --warning: #fbbf24;
        --warning-bg: rgba(251, 191, 36, 0.1);
        --error: #f87171;
        --error-bg: rgba(248, 113, 113, 0.1);
        --info: #60a5fa;
        --info-bg: rgba(96, 165, 250, 0.1);

        /* Code colors - One Dark Pro inspired */
        --code-bg: #1e1e1e;
        --code-border: #333333;

        /* Sizing */
        --sidebar-width: 260px;
        --content-max-width: 900px;
        --radius-sm: 4px;
        --radius-md: 8px;
        --radius-lg: 12px;
      }

      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      html {
        scroll-behavior: smooth;
      }

      body {
        font-family: ui-sans-serif, -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, 'Apple Color Emoji', Arial, sans-serif, 'Segoe UI Emoji', 'Segoe UI Symbol';
        background: var(--bg-primary);
        color: var(--text-primary);
        line-height: 1.7;
        font-size: 15px;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
      }

      /* ============================================
         LAYOUT
         ============================================ */

      .layout {
        display: flex;
        min-height: 100vh;
      }

      /* ============================================
         SIDEBAR
         ============================================ */

      .sidebar {
        width: var(--sidebar-width);
        background: var(--bg-secondary);
        border-right: 1px solid var(--border);
        position: fixed;
        top: 0;
        left: 0;
        height: 100vh;
        overflow-y: auto;
        z-index: 100;
        display: flex;
        flex-direction: column;
      }

      .sidebar-header {
        padding: 16px;
        border-bottom: 1px solid var(--border);
        flex-shrink: 0;
      }

      .logo {
        display: flex;
        align-items: center;
        gap: 12px;
        text-decoration: none;
      }

      .logo-icon {
        width: 32px;
        height: 32px;
        background: linear-gradient(135deg, var(--accent), #a855f7);
        border-radius: var(--radius-md);
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 700;
        font-size: 14px;
        color: white;
      }

      .logo-text {
        font-size: 15px;
        font-weight: 600;
        color: var(--text-primary);
      }

      .logo-subtitle {
        font-size: 11px;
        color: var(--text-muted);
        margin-top: 1px;
      }

      .sidebar-content {
        padding: 8px;
        flex: 1;
        overflow-y: auto;
      }

      .nav-section {
        margin-bottom: 16px;
      }

      .nav-section-title {
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: var(--text-muted);
        padding: 8px 12px 6px;
      }

      .nav-item {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 12px;
        border-radius: var(--radius-sm);
        color: var(--text-secondary);
        text-decoration: none;
        font-size: 14px;
        transition: all 0.15s ease;
        margin-bottom: 1px;
      }

      .nav-item:hover {
        background: var(--bg-hover);
        color: var(--text-primary);
      }

      .nav-item.active {
        background: var(--accent-muted);
        color: var(--accent);
      }

      .nav-icon {
        width: 16px;
        height: 16px;
        opacity: 0.6;
        flex-shrink: 0;
      }

      .nav-item:hover .nav-icon,
      .nav-item.active .nav-icon {
        opacity: 1;
      }

      /* ============================================
         MAIN CONTENT
         ============================================ */

      .main {
        flex: 1;
        margin-left: var(--sidebar-width);
        min-height: 100vh;
        display: flex;
        flex-direction: column;
      }

      .header {
        background: var(--bg-secondary);
        border-bottom: 1px solid var(--border);
        padding: 12px 24px;
        position: sticky;
        top: 0;
        z-index: 50;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }

      .breadcrumb {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 13px;
        color: var(--text-secondary);
      }

      .breadcrumb a {
        color: var(--text-secondary);
        text-decoration: none;
      }

      .breadcrumb a:hover {
        color: var(--text-primary);
      }

      .breadcrumb-separator {
        color: var(--text-faint);
      }

      .breadcrumb-current {
        color: var(--text-primary);
        font-weight: 500;
      }

      .header-actions {
        display: flex;
        gap: 8px;
      }

      .btn {
        padding: 6px 12px;
        border-radius: var(--radius-sm);
        font-size: 13px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.15s ease;
        border: none;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        text-decoration: none;
      }

      .btn-primary {
        background: var(--accent);
        color: white;
      }

      .btn-primary:hover {
        background: var(--accent-hover);
      }

      .btn-secondary {
        background: var(--bg-tertiary);
        color: var(--text-primary);
        border: 1px solid var(--border);
      }

      .btn-secondary:hover {
        background: var(--bg-hover);
        border-color: var(--border-light);
      }

      .content {
        padding: 32px 48px;
        max-width: calc(var(--content-max-width) + 96px);
        flex: 1;
      }

      /* ============================================
         HOME PAGE
         ============================================ */

      .hero {
        text-align: center;
        padding: 40px 0 48px;
      }

      .hero-badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 4px 12px;
        background: var(--accent-muted);
        color: var(--accent);
        border-radius: 20px;
        font-size: 12px;
        font-weight: 500;
        margin-bottom: 16px;
      }

      .hero-title {
        font-size: 40px;
        font-weight: 700;
        margin-bottom: 12px;
        color: var(--text-primary);
        letter-spacing: -0.5px;
      }

      .hero-description {
        font-size: 16px;
        color: var(--text-secondary);
        max-width: 500px;
        margin: 0 auto 24px;
        line-height: 1.6;
      }

      .quick-links {
        display: flex;
        gap: 8px;
        justify-content: center;
        flex-wrap: wrap;
      }

      /* Module cards */
      .modules-section {
        margin-bottom: 40px;
      }

      .section-header {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 16px;
        padding-bottom: 8px;
        border-bottom: 1px solid var(--border);
      }

      .section-icon {
        width: 24px;
        height: 24px;
        color: var(--text-muted);
      }

      .section-title {
        font-size: 14px;
        font-weight: 600;
        color: var(--text-primary);
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .modules-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
        gap: 12px;
      }

      .module-card {
        background: var(--bg-secondary);
        border: 1px solid var(--border);
        border-radius: var(--radius-md);
        padding: 16px;
        transition: all 0.15s ease;
        cursor: pointer;
        text-decoration: none;
        display: block;
      }

      .module-card:hover {
        border-color: var(--accent);
        background: var(--bg-elevated);
      }

      .module-header {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 8px;
      }

      .module-icon {
        width: 32px;
        height: 32px;
        background: var(--bg-tertiary);
        border-radius: var(--radius-sm);
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--accent);
      }

      .module-icon svg {
        width: 16px;
        height: 16px;
      }

      .module-name {
        font-size: 14px;
        font-weight: 600;
        color: var(--text-primary);
      }

      .module-description {
        font-size: 13px;
        color: var(--text-secondary);
        line-height: 1.5;
      }

      .module-arrow {
        margin-left: auto;
        opacity: 0;
        transition: all 0.15s ease;
        color: var(--accent);
      }

      .module-card:hover .module-arrow {
        opacity: 1;
        transform: translateX(2px);
      }

      /* ============================================
         DOCUMENTATION CONTENT
         ============================================ */

      .doc-content {
        background: var(--bg-secondary);
        border: 1px solid var(--border);
        border-radius: var(--radius-lg);
        padding: 32px 40px;
      }

      /* Headings */
      .doc-h1 {
        font-size: 32px;
        font-weight: 700;
        margin-bottom: 8px;
        padding-bottom: 16px;
        border-bottom: 1px solid var(--border);
        color: var(--text-primary);
        letter-spacing: -0.5px;
        position: relative;
      }

      .doc-h2 {
        font-size: 22px;
        font-weight: 600;
        margin: 40px 0 16px;
        padding-bottom: 8px;
        border-bottom: 1px solid var(--border);
        color: var(--text-primary);
        position: relative;
      }

      .doc-h3 {
        font-size: 17px;
        font-weight: 600;
        margin: 28px 0 12px;
        color: var(--text-primary);
        position: relative;
      }

      .doc-h4 {
        font-size: 15px;
        font-weight: 600;
        margin: 24px 0 8px;
        color: var(--text-primary);
      }

      /* Heading anchors */
      .heading-anchor {
        position: absolute;
        left: -24px;
        color: var(--text-faint);
        text-decoration: none;
        opacity: 0;
        transition: opacity 0.15s ease;
        font-weight: 400;
      }

      .doc-h1:hover .heading-anchor,
      .doc-h2:hover .heading-anchor,
      .doc-h3:hover .heading-anchor {
        opacity: 1;
      }

      .heading-anchor:hover {
        color: var(--accent);
      }

      /* Paragraphs */
      .doc-content p {
        margin-bottom: 16px;
        color: var(--text-secondary);
        line-height: 1.7;
      }

      /* Strong/Bold */
      .doc-content strong {
        color: var(--text-primary);
        font-weight: 600;
      }

      /* Lists */
      .doc-content ul,
      .doc-content ol {
        margin: 16px 0;
        padding-left: 24px;
      }

      .doc-content li {
        margin-bottom: 8px;
        color: var(--text-secondary);
        line-height: 1.6;
      }

      .doc-content li::marker {
        color: var(--text-muted);
      }

      /* Horizontal rule */
      .doc-hr {
        border: none;
        height: 1px;
        background: var(--border);
        margin: 32px 0;
      }

      /* Links */
      .doc-link {
        color: var(--accent);
        text-decoration: none;
        border-bottom: 1px solid transparent;
        transition: border-color 0.15s ease;
      }

      .doc-link:hover {
        border-bottom-color: var(--accent);
      }

      .external-icon {
        display: inline-block;
        margin-left: 4px;
        vertical-align: middle;
        opacity: 0.6;
      }

      /* ============================================
         CODE BLOCKS
         ============================================ */

      .code-block {
        margin: 20px 0;
        border-radius: var(--radius-md);
        overflow: hidden;
        background: var(--code-bg);
        border: 1px solid var(--code-border);
      }

      .code-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 8px 16px;
        background: rgba(255, 255, 255, 0.03);
        border-bottom: 1px solid var(--code-border);
      }

      .code-lang {
        font-size: 11px;
        font-weight: 600;
        color: var(--text-muted);
        text-transform: uppercase;
        letter-spacing: 0.5px;
        font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace;
      }

      .copy-btn {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 4px 10px;
        font-size: 12px;
        font-weight: 500;
        background: transparent;
        border: 1px solid var(--border);
        border-radius: var(--radius-sm);
        color: var(--text-secondary);
        cursor: pointer;
        transition: all 0.15s ease;
        font-family: inherit;
      }

      .copy-btn:hover {
        background: var(--bg-hover);
        color: var(--text-primary);
        border-color: var(--border-light);
      }

      .copy-btn.copied {
        background: var(--success-bg);
        color: var(--success);
        border-color: var(--success);
      }

      .code-block pre {
        margin: 0;
        padding: 16px;
        overflow-x: auto;
      }

      .code-block code {
        font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace;
        font-size: 13px;
        line-height: 1.6;
        color: #abb2bf;
      }

      /* Inline code */
      .inline-code {
        font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace;
        font-size: 0.9em;
        background: var(--bg-tertiary);
        padding: 2px 6px;
        border-radius: var(--radius-sm);
        color: #e06c75;
        border: 1px solid var(--border);
      }

      /* ============================================
         SYNTAX HIGHLIGHTING - One Dark Pro
         ============================================ */

      .hljs-comment,
      .hljs-quote {
        color: #5c6370;
        font-style: italic;
      }

      .hljs-doctag,
      .hljs-keyword,
      .hljs-formula {
        color: #c678dd;
      }

      .hljs-section,
      .hljs-name,
      .hljs-selector-tag,
      .hljs-deletion,
      .hljs-subst {
        color: #e06c75;
      }

      .hljs-literal {
        color: #56b6c2;
      }

      .hljs-string,
      .hljs-regexp,
      .hljs-addition,
      .hljs-attribute,
      .hljs-meta .hljs-string {
        color: #98c379;
      }

      .hljs-attr,
      .hljs-variable,
      .hljs-template-variable,
      .hljs-type,
      .hljs-selector-class,
      .hljs-selector-attr,
      .hljs-selector-pseudo,
      .hljs-number {
        color: #d19a66;
      }

      .hljs-symbol,
      .hljs-bullet,
      .hljs-link,
      .hljs-meta,
      .hljs-selector-id,
      .hljs-title {
        color: #61afef;
      }

      .hljs-built_in,
      .hljs-title.class_,
      .hljs-class .hljs-title {
        color: #e6c07b;
      }

      .hljs-emphasis {
        font-style: italic;
      }

      .hljs-strong {
        font-weight: bold;
      }

      .hljs-link {
        text-decoration: underline;
      }

      /* ============================================
         TABLES
         ============================================ */

      .table-wrapper {
        margin: 20px 0;
        overflow-x: auto;
        border-radius: var(--radius-md);
        border: 1px solid var(--border);
      }

      .doc-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 14px;
      }

      .doc-table th {
        background: var(--bg-tertiary);
        padding: 12px 16px;
        text-align: left;
        font-weight: 600;
        color: var(--text-primary);
        border-bottom: 1px solid var(--border);
        white-space: nowrap;
      }

      .doc-table td {
        padding: 12px 16px;
        border-bottom: 1px solid var(--border);
        color: var(--text-secondary);
      }

      .doc-table tr:last-child td {
        border-bottom: none;
      }

      .doc-table tr:hover td {
        background: var(--bg-hover);
      }

      /* ============================================
         BLOCKQUOTES & CALLOUTS
         ============================================ */

      .doc-quote {
        border-left: 3px solid var(--border-light);
        padding: 12px 20px;
        margin: 20px 0;
        background: var(--bg-tertiary);
        border-radius: 0 var(--radius-md) var(--radius-md) 0;
        color: var(--text-secondary);
      }

      .doc-quote p {
        margin-bottom: 0;
      }

      .callout {
        display: flex;
        gap: 12px;
        padding: 16px;
        margin: 20px 0;
        border-radius: var(--radius-md);
        border: 1px solid;
      }

      .callout-icon {
        flex-shrink: 0;
        margin-top: 2px;
      }

      .callout-content {
        flex: 1;
      }

      .callout-content p {
        margin-bottom: 0;
      }

      .callout-note {
        background: var(--info-bg);
        border-color: rgba(96, 165, 250, 0.3);
        color: var(--info);
      }

      .callout-info {
        background: var(--info-bg);
        border-color: rgba(96, 165, 250, 0.3);
        color: var(--info);
      }

      .callout-tip {
        background: var(--success-bg);
        border-color: rgba(74, 222, 128, 0.3);
        color: var(--success);
      }

      .callout-warning {
        background: var(--warning-bg);
        border-color: rgba(251, 191, 36, 0.3);
        color: var(--warning);
      }

      .callout-important {
        background: var(--error-bg);
        border-color: rgba(248, 113, 113, 0.3);
        color: var(--error);
      }

      /* ============================================
         FOOTER
         ============================================ */

      .footer {
        padding: 16px 48px;
        border-top: 1px solid var(--border);
        margin-top: auto;
        color: var(--text-muted);
        font-size: 12px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      /* ============================================
         404 PAGE
         ============================================ */

      .error-page {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 60vh;
        text-align: center;
      }

      .error-code {
        font-size: 100px;
        font-weight: 800;
        color: var(--bg-tertiary);
        line-height: 1;
      }

      .error-title {
        font-size: 20px;
        font-weight: 600;
        margin: 16px 0 8px;
        color: var(--text-primary);
      }

      .error-description {
        color: var(--text-secondary);
        margin-bottom: 24px;
        font-size: 14px;
      }

      /* ============================================
         SCROLLBAR
         ============================================ */

      ::-webkit-scrollbar {
        width: 8px;
        height: 8px;
      }

      ::-webkit-scrollbar-track {
        background: transparent;
      }

      ::-webkit-scrollbar-thumb {
        background: var(--border);
        border-radius: 4px;
      }

      ::-webkit-scrollbar-thumb:hover {
        background: var(--border-light);
      }

      /* ============================================
         RESPONSIVE
         ============================================ */

      @media (max-width: 1024px) {
        .sidebar {
          transform: translateX(-100%);
          transition: transform 0.3s ease;
        }

        .sidebar.open {
          transform: translateX(0);
        }

        .main {
          margin-left: 0;
        }

        .content {
          padding: 24px;
        }

        .doc-content {
          padding: 24px;
        }
      }

      @media (max-width: 640px) {
        .hero-title {
          font-size: 28px;
        }

        .modules-grid {
          grid-template-columns: 1fr;
        }

        .doc-h1 {
          font-size: 24px;
        }

        .doc-h2 {
          font-size: 18px;
        }
      }
    `;
  }

  private getIcons(): string {
    return `
      <svg style="display:none">
        <symbol id="icon-shield" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </symbol>
        <symbol id="icon-log-in" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/>
        </symbol>
        <symbol id="icon-user-plus" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/>
        </symbol>
        <symbol id="icon-package" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
        </symbol>
        <symbol id="icon-trending-up" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
        </symbol>
        <symbol id="icon-building" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/>
        </symbol>
        <symbol id="icon-heart" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
        </symbol>
        <symbol id="icon-message-square" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </symbol>
        <symbol id="icon-users" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </symbol>
        <symbol id="icon-bar-chart-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
        </symbol>
        <symbol id="icon-home" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
        </symbol>
        <symbol id="icon-book-open" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
        </symbol>
        <symbol id="icon-external-link" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
        </symbol>
        <symbol id="icon-arrow-right" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
        </symbol>
        <symbol id="icon-chevron-right" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="9 18 15 12 9 6"/>
        </symbol>
        <symbol id="icon-zap" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
        </symbol>
      </svg>
    `;
  }

  private getScript(): string {
    return `
      <script>
        function copyCode(btn) {
          const codeBlock = btn.closest('.code-block');
          const code = codeBlock.querySelector('code').textContent;
          navigator.clipboard.writeText(code).then(() => {
            btn.classList.add('copied');
            btn.querySelector('span').textContent = 'Copied!';
            setTimeout(() => {
              btn.classList.remove('copied');
              btn.querySelector('span').textContent = 'Copy';
            }, 2000);
          });
        }

        // Smooth scroll for anchor links
        document.addEventListener('DOMContentLoaded', () => {
          document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
              e.preventDefault();
              const target = document.querySelector(this.getAttribute('href'));
              if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }
            });
          });
        });
      </script>
    `;
  }

  private generateSidebar(modules: Record<string, any[]>, activeSlug?: string): string {
    const categoryLabels = {
      core: 'Core Modules',
      business: 'Business Modules',
      supporting: 'Supporting Modules'
    };

    let sidebarHtml = `
      <aside class="sidebar">
        <div class="sidebar-header">
          <a href="/docs" class="logo">
            <div class="logo-icon">B</div>
            <div>
              <div class="logo-text">Breyus</div>
              <div class="logo-subtitle">API Docs</div>
            </div>
          </a>
        </div>
        <nav class="sidebar-content">
          <div class="nav-section">
            <a href="/docs" class="nav-item ${!activeSlug ? 'active' : ''}">
              <svg class="nav-icon"><use href="#icon-home"/></svg>
              Overview
            </a>
          </div>
    `;

    for (const [category, mods] of Object.entries(modules)) {
      sidebarHtml += `
        <div class="nav-section">
          <div class="nav-section-title">${categoryLabels[category]}</div>
      `;

      for (const mod of mods) {
        const isActive = activeSlug === mod.slug;
        sidebarHtml += `
          <a href="/docs/${mod.slug}" class="nav-item ${isActive ? 'active' : ''}">
            <svg class="nav-icon"><use href="#icon-${mod.icon}"/></svg>
            ${mod.name}
          </a>
        `;
      }

      sidebarHtml += `</div>`;
    }

    sidebarHtml += `
        </nav>
      </aside>
    `;

    return sidebarHtml;
  }

  private generateHomePage(modules: Record<string, any[]>, readmeHtml: string): string {
    const categoryInfo = {
      core: { title: 'Core Modules', icon: 'shield' },
      business: { title: 'Business Modules', icon: 'trending-up' },
      supporting: { title: 'Supporting Modules', icon: 'package' }
    };

    let moduleSections = '';
    for (const [category, mods] of Object.entries(modules)) {
      const info = categoryInfo[category];
      moduleSections += `
        <section class="modules-section">
          <div class="section-header">
            <svg class="section-icon"><use href="#icon-${info.icon}"/></svg>
            <h2 class="section-title">${info.title}</h2>
          </div>
          <div class="modules-grid">
      `;

      for (const mod of mods) {
        moduleSections += `
          <a href="/docs/${mod.slug}" class="module-card">
            <div class="module-header">
              <div class="module-icon">
                <svg><use href="#icon-${mod.icon}"/></svg>
              </div>
              <span class="module-name">${mod.name}</span>
              <svg class="module-arrow" width="16" height="16"><use href="#icon-arrow-right"/></svg>
            </div>
            <p class="module-description">${mod.description}</p>
          </a>
        `;
      }

      moduleSections += `</div></section>`;
    }

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Breyus API Documentation</title>
        <style>${this.getBaseStyles()}</style>
      </head>
      <body>
        ${this.getIcons()}
        <div class="layout">
          ${this.generateSidebar(modules)}
          <main class="main">
            <header class="header">
              <div class="breadcrumb">
                <svg width="14" height="14"><use href="#icon-book-open"/></svg>
                <span class="breadcrumb-current">Documentation</span>
              </div>
              <div class="header-actions">
                <a href="/" class="btn btn-secondary">
                  <svg width="14" height="14"><use href="#icon-external-link"/></svg>
                  Back to App
                </a>
              </div>
            </header>
            <div class="content">
              <div class="hero">
                <div class="hero-badge">
                  <svg width="12" height="12"><use href="#icon-zap"/></svg>
                  v1.1
                </div>
                <h1 class="hero-title">Breyus API</h1>
                <p class="hero-description">
                  Complete API documentation for the B2B commodity trading platform.
                </p>
                <div class="quick-links">
                  <a href="/docs/auth" class="btn btn-primary">
                    <svg width="14" height="14"><use href="#icon-shield"/></svg>
                    Get Started
                  </a>
                  <a href="/docs/trade" class="btn btn-secondary">
                    <svg width="14" height="14"><use href="#icon-trending-up"/></svg>
                    Trade API
                  </a>
                </div>
              </div>

              ${moduleSections}

              <div class="doc-content" style="margin-top: 40px;">
                ${readmeHtml}
              </div>
            </div>
            <footer class="footer">
              <span>&copy; 2024 Breyus</span>
              <span>Built with NestJS</span>
            </footer>
          </main>
        </div>
        ${this.getScript()}
      </body>
      </html>
    `;
  }

  private generateModulePage(moduleInfo: any, docHtml: string, modules: Record<string, any[]>): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${moduleInfo.name} API - Breyus</title>
        <style>${this.getBaseStyles()}</style>
      </head>
      <body>
        ${this.getIcons()}
        <div class="layout">
          ${this.generateSidebar(modules, moduleInfo.slug)}
          <main class="main">
            <header class="header">
              <div class="breadcrumb">
                <a href="/docs">Docs</a>
                <svg class="breadcrumb-separator" width="14" height="14"><use href="#icon-chevron-right"/></svg>
                <span class="breadcrumb-current">${moduleInfo.name}</span>
              </div>
              <div class="header-actions">
                <a href="/" class="btn btn-secondary">
                  <svg width="14" height="14"><use href="#icon-external-link"/></svg>
                  Back to App
                </a>
              </div>
            </header>
            <div class="content">
              <div class="doc-content">
                ${docHtml}
              </div>
            </div>
            <footer class="footer">
              <span>&copy; 2024 Breyus</span>
              <span>Built with NestJS</span>
            </footer>
          </main>
        </div>
        ${this.getScript()}
      </body>
      </html>
    `;
  }

  private generate404Page(slug: string): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>404 - Not Found</title>
        <style>${this.getBaseStyles()}</style>
      </head>
      <body>
        ${this.getIcons()}
        <div class="layout">
          <main class="main" style="margin-left: 0;">
            <div class="content">
              <div class="error-page">
                <div class="error-code">404</div>
                <h1 class="error-title">Page Not Found</h1>
                <p class="error-description">
                  The documentation for "${slug}" doesn't exist.
                </p>
                <a href="/docs" class="btn btn-primary">
                  <svg width="14" height="14"><use href="#icon-home"/></svg>
                  Back to Docs
                </a>
              </div>
            </div>
          </main>
        </div>
      </body>
      </html>
    `;
  }
}
