import React from "react";

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
    <div>
      <div className="flex flex-col h-full">
        <h1 className="section-title font-bold mb-6 text-2xl">Tags</h1>

        <div className="product-card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Product Tags <span className="text-sm text-gray-500">({tagsData.tags.length}/5)</span></h2>
            <button
              onClick={() => {
                // Auto-generate tags functionality can be implemented here
                console.log('Auto-generate tags clicked');
              }}

              className={`flex items-center text-sm px-3 py-1.5 rounded-md ${'bg-blue-50 text-blue-600 hover:bg-blue-100'
                }`}
            >
              <span>Auto-Generate Tags</span>
            </button>
          </div>

          <div className="border border-gray-200 rounded-xl p-4 mb-4">
            <input
              type="text"
              placeholder={tagsData.tags.length >= 5 ? "Maximum 5 tags reached" : "Add your tag (press Enter or comma)"}
              className="outline-none px-3 py-2 mb-4 bg-transparent border-b border-gray-200 w-full focus:border-gray-400 transition-all"
              value={tagsData.input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              disabled={tagsData.tags.length >= 5}
            />

            <div className="flex flex-wrap gap-2 mt-2">
              {tagsData.tags.map((tag, idx) => (
                <div
                  key={`${tag}-${idx}`}
                  className="flex items-center bg-gradient-to-r from-black to-[#353535] text-white rounded-full px-3 py-1.5 transition-all hover:shadow-md"
                >
                  <span className="mr-1 text-sm">{tag}</span>
                  <button
                    className="ml-1 text-white hover:text-gray-200 focus:outline-none text-sm transition-colors"
                    onClick={() => removeTag(idx)}
                    aria-label={`Remove tag ${tag}`}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="text-sm text-gray-600">
            <p>Tags help buyers find your products. Choose descriptive words related to your product.</p>
            <ul className="list-disc ml-5 mt-2">
              <li>Use specific keywords relevant to your product</li>
              <li>Include material, usage, and key features</li>
              <li>Avoid generic terms or irrelevant words</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Tags;