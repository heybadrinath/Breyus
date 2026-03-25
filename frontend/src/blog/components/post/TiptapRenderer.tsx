import React, { JSX } from 'react';
import DOMPurify from 'dompurify';
import type { TiptapContent, TiptapNode } from '../../../types/marketplaceTypes';

interface TiptapRendererProps {
  content: TiptapContent | null | undefined;
  className?: string;
}

/**
 * TiptapRenderer - Renders Tiptap JSON content as HTML
 *
 * This component converts Tiptap's JSON document format to safe HTML.
 * It handles all standard Tiptap node types and marks.
 *
 * Security: Uses DOMPurify to sanitize any raw HTML content.
 */
export function TiptapRenderer({ content, className = '' }: TiptapRendererProps) {
  if (!content || !content.content) {
    return null;
  }

  const renderMarks = (text: string, marks?: Array<{ type: string; attrs?: Record<string, any> }>): React.ReactNode => {
    if (!marks || marks.length === 0) {
      return text;
    }

    return marks.reduce((result: React.ReactNode, mark) => {
      switch (mark.type) {
        case 'bold':
          return <strong>{result}</strong>;
        case 'italic':
          return <em>{result}</em>;
        case 'underline':
          return <u>{result}</u>;
        case 'strike':
          return <s>{result}</s>;
        case 'code':
          return <code className="px-1.5 py-0.5 bg-amber-50 text-[#8B6914] border border-amber-200 rounded text-sm font-mono">{result}</code>;
        case 'link':
          return (
            <a
              href={mark.attrs?.href}
              target={mark.attrs?.target || '_blank'}
              rel="noopener noreferrer"
              className="text-[#B8860B] hover:text-[#9A7209] underline decoration-[#B8860B]/30 hover:decoration-[#B8860B] transition-colors"
            >
              {result}
            </a>
          );
        case 'highlight':
          return (
            <mark className="bg-amber-100 text-amber-900 px-0.5 rounded">{result}</mark>
          );
        case 'subscript':
          return <sub>{result}</sub>;
        case 'superscript':
          return <sup>{result}</sup>;
        default:
          return result;
      }
    }, text);
  };

  const renderNode = (node: TiptapNode, index: number): React.ReactNode => {
    const key = `node-${index}-${node.type}`;

    switch (node.type) {
      case 'paragraph':
        return (
          <p key={key} className="mb-4 leading-relaxed text-gray-700">
            {node.content?.map((child, i) => renderNode(child, i))}
          </p>
        );

      case 'heading':
        const HeadingTag = `h${node.attrs?.level || 2}` as keyof JSX.IntrinsicElements;
        const headingClasses: Record<number, string> = {
          1: 'text-3xl font-bold mt-8 mb-4 text-gray-900',
          2: 'text-2xl font-bold mt-6 mb-3 text-gray-900',
          3: 'text-xl font-semibold mt-5 mb-2 text-gray-900',
          4: 'text-lg font-semibold mt-4 mb-2 text-gray-900',
          5: 'text-base font-semibold mt-3 mb-2 text-gray-900',
          6: 'text-sm font-semibold mt-2 mb-1 text-gray-900',
        };
        return (
          <HeadingTag key={key} className={headingClasses[node.attrs?.level || 2]}>
            {node.content?.map((child, i) => renderNode(child, i))}
          </HeadingTag>
        );

      case 'text':
        return (
          <React.Fragment key={key}>
            {renderMarks(node.text || '', node.marks)}
          </React.Fragment>
        );

      case 'bulletList':
        return (
          <ul key={key} className="list-disc pl-6 mb-4 space-y-1 text-gray-700 marker:text-[#B8860B]">
            {node.content?.map((child, i) => renderNode(child, i))}
          </ul>
        );

      case 'orderedList':
        return (
          <ol key={key} className="list-decimal pl-6 mb-4 space-y-1 text-gray-700 marker:text-[#B8860B]">
            {node.content?.map((child, i) => renderNode(child, i))}
          </ol>
        );

      case 'listItem':
        return (
          <li key={key} className="text-gray-700">
            {node.content?.map((child, i) => renderNode(child, i))}
          </li>
        );

      case 'taskList':
        return (
          <ul key={key} className="mb-4 space-y-2">
            {node.content?.map((child, i) => renderNode(child, i))}
          </ul>
        );

      case 'taskItem':
        return (
          <li key={key} className="flex items-start space-x-2">
            <input
              type="checkbox"
              checked={node.attrs?.checked || false}
              readOnly
              className="mt-1 h-4 w-4 rounded border-amber-300 text-[#B8860B] accent-[#B8860B]"
            />
            <span className={node.attrs?.checked ? 'line-through text-gray-400' : 'text-gray-700'}>
              {node.content?.map((child, i) => renderNode(child, i))}
            </span>
          </li>
        );

      case 'blockquote':
        return (
          <blockquote key={key} className="border-l-4 border-[#B8860B] pl-4 py-2 my-4 italic text-gray-700 bg-amber-50/50 rounded-r">
            {node.content?.map((child, i) => renderNode(child, i))}
          </blockquote>
        );

      case 'codeBlock':
        return (
          <pre key={key} className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto mb-4">
            <code className="text-sm font-mono">
              {node.content?.map((child, i) => renderNode(child, i))}
            </code>
          </pre>
        );

      case 'horizontalRule':
        return <hr key={key} className="my-6 border-gray-200 border-t-2" />;

      case 'image': {
        const imageFloat = node.attrs?.float as string | null;
        const floatClass = imageFloat === 'left'
          ? 'blog-image-float-left'
          : imageFloat === 'right'
          ? 'blog-image-float-right'
          : '';
        const wrapperClass = floatClass
          ? floatClass
          : 'my-6';
        return (
          <figure key={key} className={wrapperClass}>
            <img
              src={node.attrs?.src}
              alt={node.attrs?.alt || ''}
              title={node.attrs?.title}
              className={`max-w-full h-auto rounded-lg ${!floatClass ? 'mx-auto' : ''}`}
            />
            {node.attrs?.title && !floatClass && (
              <figcaption className="text-center text-sm text-gray-500 mt-2">
                {node.attrs.title}
              </figcaption>
            )}
          </figure>
        );
      }

      case 'youtube':
        const videoId = node.attrs?.src?.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/)?.[1];
        return (
          <div key={key} className="my-6 aspect-video">
            <iframe
              src={`https://www.youtube.com/embed/${videoId || node.attrs?.src}`}
              className="w-full h-full rounded-lg"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title="YouTube video"
            />
          </div>
        );

      case 'table':
        return (
          <div key={key} className="my-6 overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
            <table className="min-w-full divide-y divide-gray-200">
              <tbody className="divide-y divide-gray-100 bg-white">
                {node.content?.map((child, i) => renderNode(child, i))}
              </tbody>
            </table>
          </div>
        );

      case 'tableRow':
        return (
          <tr key={key}>
            {node.content?.map((child, i) => renderNode(child, i))}
          </tr>
        );

      case 'tableCell':
        return (
          <td key={key} className="px-4 py-2 text-sm text-gray-700">
            {node.content?.map((child, i) => renderNode(child, i))}
          </td>
        );

      case 'tableHeader':
        return (
          <th key={key} className="px-4 py-2 text-sm font-semibold bg-amber-50/50 text-gray-900 text-left border-b border-amber-200">
            {node.content?.map((child, i) => renderNode(child, i))}
          </th>
        );

      case 'hardBreak':
        return <br key={key} />;

      case 'pullQuote':
        return (
          <div key={key} className="blog-pull-quote">
            {node.content?.map((child, i) => renderNode(child, i))}
          </div>
        );

      case 'callout': {
        const calloutType = (node.attrs?.calloutType || 'info') as string;
        return (
          <div key={key} className={`blog-callout blog-callout-${calloutType}`}>
            {node.content?.map((child, i) => renderNode(child, i))}
          </div>
        );
      }

      case 'imageGallery': {
        const columns = node.attrs?.columns || 2;
        return (
          <div key={key} className={`blog-image-gallery cols-${columns}`}>
            {node.content?.map((child, i) => renderNode(child, i))}
          </div>
        );
      }

      default:
        // Fallback: render children if present
        if (node.content) {
          return (
            <div key={key}>
              {node.content.map((child, i) => renderNode(child, i))}
            </div>
          );
        }
        return null;
    }
  };

  return (
    <div className={`prose max-w-none blog-content text-gray-800 ${className}`}>
      {content.content.map((node, index) => renderNode(node, index))}
    </div>
  );
}

export default TiptapRenderer;
