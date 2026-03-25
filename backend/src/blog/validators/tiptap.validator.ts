import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

/**
 * Valid Tiptap node types as of Tiptap 2.x
 * This list covers the core nodes and common extensions
 */
const VALID_NODE_TYPES = new Set([
  // Document
  'doc',
  // Block nodes
  'paragraph',
  'heading',
  'blockquote',
  'codeBlock',
  'bulletList',
  'orderedList',
  'listItem',
  'taskList',
  'taskItem',
  'horizontalRule',
  'hardBreak',
  'table',
  'tableRow',
  'tableCell',
  'tableHeader',
  // Inline nodes
  'text',
  'image',
  'mention',
  'emoji',
  // Custom extensions (add project-specific types here)
  'youtube',
  'video',
  'embed',
  'callout',
  'details',
  'detailsSummary',
  'detailsContent',
]);

/**
 * Valid mark types for inline text styling
 */
const VALID_MARK_TYPES = new Set([
  'bold',
  'italic',
  'underline',
  'strike',
  'code',
  'link',
  'textStyle',
  'highlight',
  'subscript',
  'superscript',
]);

/**
 * Maximum nesting depth to prevent deeply nested documents
 * that could cause stack overflow during rendering
 */
const MAX_NESTING_DEPTH = 20;

/**
 * Maximum number of nodes in a document to prevent
 * excessively large documents
 */
const MAX_NODES = 5000;

interface TiptapNode {
  type: string;
  content?: TiptapNode[];
  text?: string;
  attrs?: Record<string, unknown>;
  marks?: TiptapMark[];
}

interface TiptapMark {
  type: string;
  attrs?: Record<string, unknown>;
}

interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validates a Tiptap JSON document structure
 *
 * Checks:
 * 1. Root must be a 'doc' type node
 * 2. All node types must be recognized
 * 3. Text nodes must have string 'text' property
 * 4. Marks must have valid types
 * 5. Nesting depth must not exceed MAX_NESTING_DEPTH
 * 6. Total nodes must not exceed MAX_NODES
 */
function validateTiptapNode(
  node: unknown,
  depth: number = 0,
  nodeCount: { count: number } = { count: 0 },
): ValidationResult {
  // Check depth limit
  if (depth > MAX_NESTING_DEPTH) {
    return {
      isValid: false,
      error: `Document nesting exceeds maximum depth of ${MAX_NESTING_DEPTH}`,
    };
  }

  // Check node count
  nodeCount.count++;
  if (nodeCount.count > MAX_NODES) {
    return {
      isValid: false,
      error: `Document exceeds maximum of ${MAX_NODES} nodes`,
    };
  }

  // Must be an object
  if (!node || typeof node !== 'object' || Array.isArray(node)) {
    return { isValid: false, error: 'Node must be an object' };
  }

  const typedNode = node as TiptapNode;

  // Must have a type
  if (typeof typedNode.type !== 'string' || !typedNode.type) {
    return { isValid: false, error: 'Node must have a string "type" property' };
  }

  // Type must be recognized (allow unknown types with warning, don't block)
  // This is lenient to support custom extensions
  if (!VALID_NODE_TYPES.has(typedNode.type)) {
    // Log warning but allow - extensions may add custom types
    console.warn(`Unknown Tiptap node type: ${typedNode.type}`);
  }

  // Text nodes must have text property
  if (typedNode.type === 'text') {
    if (typeof typedNode.text !== 'string') {
      return {
        isValid: false,
        error: 'Text node must have a string "text" property',
      };
    }
  }

  // Validate marks if present
  if (typedNode.marks !== undefined) {
    if (!Array.isArray(typedNode.marks)) {
      return { isValid: false, error: 'Marks must be an array' };
    }

    for (const mark of typedNode.marks) {
      if (!mark || typeof mark !== 'object') {
        return { isValid: false, error: 'Each mark must be an object' };
      }
      if (typeof mark.type !== 'string') {
        return {
          isValid: false,
          error: 'Each mark must have a string "type" property',
        };
      }
      // Warn but don't block unknown mark types
      if (!VALID_MARK_TYPES.has(mark.type)) {
        console.warn(`Unknown Tiptap mark type: ${mark.type}`);
      }
    }
  }

  // Validate attrs if present
  if (typedNode.attrs !== undefined) {
    if (typeof typedNode.attrs !== 'object' || Array.isArray(typedNode.attrs)) {
      return { isValid: false, error: 'Attrs must be an object' };
    }
  }

  // Recursively validate content
  if (typedNode.content !== undefined) {
    if (!Array.isArray(typedNode.content)) {
      return { isValid: false, error: 'Content must be an array' };
    }

    for (const child of typedNode.content) {
      const childResult = validateTiptapNode(child, depth + 1, nodeCount);
      if (!childResult.isValid) {
        return childResult;
      }
    }
  }

  return { isValid: true };
}

/**
 * Validates a complete Tiptap document
 */
export function validateTiptapDocument(doc: unknown): ValidationResult {
  if (doc === null || doc === undefined) {
    // Empty content is allowed (draft posts)
    return { isValid: true };
  }

  if (typeof doc !== 'object' || Array.isArray(doc)) {
    return { isValid: false, error: 'Document must be an object' };
  }

  const typedDoc = doc as TiptapNode;

  // Root must be 'doc' type
  if (typedDoc.type !== 'doc') {
    return {
      isValid: false,
      error: 'Root node must be of type "doc"',
    };
  }

  return validateTiptapNode(doc);
}

/**
 * Custom class-validator decorator for Tiptap content validation
 *
 * Usage:
 * ```typescript
 * @IsTiptapDocument({ message: 'Invalid Tiptap content structure' })
 * tiptapContent?: Record<string, any>;
 * ```
 */
export function IsTiptapDocument(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isTiptapDocument',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown) {
          // Allow undefined/null (optional field)
          if (value === undefined || value === null) {
            return true;
          }
          const result = validateTiptapDocument(value);
          return result.isValid;
        },
        defaultMessage(args: ValidationArguments) {
          const result = validateTiptapDocument(args.value);
          return result.error || 'Invalid Tiptap document structure';
        },
      },
    });
  };
}
