import React from "react";

interface CardCountProps {
  selected: number;
  total: number;
  allSelected: boolean;
  onToggleAll: () => void;
  onRemove?: () => void;
  onMoveToWishlist?: () => void;
}

const CardCount: React.FC<CardCountProps> = ({
  selected,
  total,
  allSelected,
  onToggleAll,
  onRemove,
  onMoveToWishlist,
}) => {
  return (
    <div className="flex items-center justify-between w-full py-2 px-2 bg-white">
      <div className="flex items-center gap-4">
        <button
          aria-label={allSelected ? "Deselect all" : "Select all"}
          onClick={onToggleAll}
          className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-sm focus:outline-none focus:ring-2 focus:ring-black"
        >
          {allSelected ? (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M5 10.5L9 14.5L15 7.5" stroke="#111" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : (
            <span className="block w-4 h-4" />
          )}
        </button>
        <span className="font-bold text-xl">
          {selected}/{total} <span className="font-extrabold text-base">ITEMS SELECTED</span>
        </span>
      </div>
      <div className="flex items-center gap-6 text-lg font-bold">
        <button
          className="text-gray-400 hover:text-black transition"
          onClick={onRemove}
        >
          REMOVE
        </button>
        <span className="h-6 w-px bg-gray-300 mx-2" />
        <button
          className="text-gray-400 hover:text-black transition"
          onClick={onMoveToWishlist}
        >
          MOVE TO WISHLIST
        </button>
      </div>
    </div>
  );
};

export default CardCount;
