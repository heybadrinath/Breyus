/**
 * ExpandableList Component
 * Displays a list with "Show X more" functionality and smooth animations
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface ExpandableListProps {
  items: string[];
  initialCount?: number;
  className?: string;
  itemClassName?: string;
  bulletStyle?: 'bullet' | 'number' | 'none';
  renderItem?: (item: string, index: number) => React.ReactNode;
}

export const ExpandableList: React.FC<ExpandableListProps> = ({
  items,
  initialCount = 3,
  className = '',
  itemClassName = '',
  bulletStyle = 'bullet',
  renderItem,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const { visibleItems, hiddenCount, shouldShowToggle } = useMemo(() => {
    const shouldShowToggle = items.length > initialCount;
    const visibleItems = isExpanded ? items : items.slice(0, initialCount);
    const hiddenCount = items.length - initialCount;
    return { visibleItems, hiddenCount, shouldShowToggle };
  }, [items, initialCount, isExpanded]);

  const getBullet = (index: number) => {
    switch (bulletStyle) {
      case 'number':
        return `${index + 1}. `;
      case 'bullet':
        return '• ';
      case 'none':
      default:
        return '';
    }
  };

  const defaultRenderItem = (item: string, index: number) => (
    <li key={index} className={itemClassName}>
      {getBullet(index)}{item}
    </li>
  );

  return (
    <div className={className}>
      <ul className="space-y-1">
        <AnimatePresence mode="sync" initial={false}>
          {visibleItems.map((item, index) => (
            <motion.div
              key={`${index}-${item.slice(0, 20)}`}
              initial={index >= initialCount ? { opacity: 0, height: 0 } : false}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2, delay: index >= initialCount ? (index - initialCount) * 0.05 : 0 }}
            >
              {renderItem ? renderItem(item, index) : defaultRenderItem(item, index)}
            </motion.div>
          ))}
        </AnimatePresence>
      </ul>

      {shouldShowToggle && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="inline-flex items-center gap-1 mt-2 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20 rounded"
        >
          {isExpanded ? (
            <>
              Show less
              <ChevronUp className="w-3.5 h-3.5" />
            </>
          ) : (
            <>
              Show {hiddenCount} more
              <ChevronDown className="w-3.5 h-3.5" />
            </>
          )}
        </button>
      )}
    </div>
  );
};

export default ExpandableList;
