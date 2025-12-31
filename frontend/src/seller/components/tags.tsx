import React from "react";
import { X, Sparkles } from "lucide-react";

interface TagsProps {
  tagsData: {
    tags: string[];
    input: string;
  };
  setTagsData: React.Dispatch<React.SetStateAction<{
    tags: string[];
    input: string;
  }>>;
}

const Tags: React.FC<TagsProps> = ({ tagsData, setTagsData }) => {

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag();
    }
  };

  const addTag = () => {
    const trimmedInput = tagsData.input.trim();
    if (trimmedInput && tagsData.tags.length < 5 && !tagsData.tags.includes(trimmedInput)) {
      setTagsData(prev => ({
        ...prev,
        tags: [...prev.tags, trimmedInput],
        input: ''
      }));
    }
  };

  const removeTag = (index: number) => {
    setTagsData(prev => ({
      ...prev,
      tags: prev.tags.filter((_, i) => i !== index)
    }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTagsData(prev => ({
      ...prev,
      input: e.target.value
    }));
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <h1 className="text-2xl font-bold text-gray-900">Tags</h1>

      <div className="space-y-6">
        {/* Header with Auto-generate button */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Product Tags</h2>
            <p className="text-sm text-gray-500">{tagsData.tags.length} of 5 tags added</p>
          </div>
          <button
            onClick={() => {
              // Auto-generate tags functionality
              console.log('Auto-generate tags clicked');
            }}
            className="flex items-center gap-2 px-4 py-2 bg-[#C4A962] text-white rounded-lg hover:bg-[#B39952] transition-colors text-sm font-medium"
          >
            <Sparkles className="w-4 h-4" />
            Auto-Generate Tags
          </button>
        </div>

        {/* Tag Input Area */}
        <div className="border border-gray-300 rounded-xl p-6">
          <input
            type="text"
            placeholder={tagsData.tags.length >= 5 ? "Maximum 5 tags reached" : "Type a tag and press Enter or comma..."}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C4A962] focus:border-transparent outline-none mb-4"
            value={tagsData.input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            disabled={tagsData.tags.length >= 5}
          />

          {/* Tags Display */}
          <div className="flex flex-wrap gap-2 min-h-[40px]">
            {tagsData.tags.length === 0 ? (
              <p className="text-sm text-gray-400">No tags added yet</p>
            ) : (
              tagsData.tags.map((tag, idx) => (
                <div
                  key={`${tag}-${idx}`}
                  className="flex items-center bg-gray-900 text-white rounded-full px-4 py-2 gap-2 transition-all hover:bg-gray-800"
                >
                  <span className="text-sm">{tag}</span>
                  <button
                    className="text-gray-400 hover:text-white focus:outline-none transition-colors"
                    onClick={() => removeTag(idx)}
                    aria-label={`Remove tag ${tag}`}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Help Text */}
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm font-medium text-gray-700 mb-2">Tips for effective tags:</p>
          <ul className="text-sm text-gray-600 space-y-1">
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span>
              Use specific keywords relevant to your product
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span>
              Include material, usage, and key features
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span>
              Avoid generic terms or irrelevant words
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Tags;
