import React from 'react';
import { Upload, X, FileText, Image as ImageIcon } from 'lucide-react';

interface MediaUploadProps {
  productImages: File[];
  testReports: File[];
  onProductImagesChange: (newImages: File[]) => void;
  onTestReportsChange: (newReports: File[]) => void;
}

const MediaUpload: React.FC<MediaUploadProps> = ({
  productImages,
  testReports,
  onProductImagesChange,
  onTestReportsChange
}) => {

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.add('border-[#C4A962]', 'bg-amber-50');
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove('border-[#C4A962]', 'bg-amber-50');
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, type: 'product' | 'test') => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove('border-[#C4A962]', 'bg-amber-50');

    const files = e.dataTransfer.files;
    if (files.length) {
      let fileArray = Array.from(files);
      if (type === 'product') {
        fileArray = fileArray.filter(file => file.type.startsWith('image/'));
        fileArray = fileArray.map(file => new File([file], `product-images-${file.name}`, { type: file.type }));
        onProductImagesChange([...productImages, ...fileArray]);
      } else {
        fileArray = fileArray.filter(file => file.type.startsWith('image/') || file.type === 'application/pdf');
        fileArray = fileArray.map(file => new File([file], `test-reports-${file.name}`, { type: file.type }));
        onTestReportsChange([...testReports, ...fileArray]);
      }
    }
  };

  const handleClick = (type: 'product' | 'test') => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.multiple = true;
    fileInput.accept = type === 'product' ? 'image/*' : '.pdf,image/*';

    fileInput.onchange = (event) => {
      if (event.target && event.target instanceof HTMLInputElement && event.target.files) {
        const files = event.target.files;
        let fileArray = Array.from(files);
        if (type === 'product') {
          fileArray = fileArray.filter(file => file.type.startsWith('image/'));
          fileArray = fileArray.map(file => new File([file], `product-images-${file.name}`, { type: file.type }));
          onProductImagesChange([...productImages, ...fileArray]);
        } else {
          fileArray = fileArray.filter(file => file.type.startsWith('image/') || file.type === 'application/pdf');
          fileArray = fileArray.map(file => new File([file], `test-reports-${file.name}`, { type: file.type }));
          onTestReportsChange([...testReports, ...fileArray]);
        }
      }
    };

    fileInput.click();
  };

  const removeProductImage = (index: number) => {
    const newImages = productImages.filter((_, i) => i !== index);
    onProductImagesChange(newImages);
  };

  const removeTestReport = (index: number) => {
    const newReports = testReports.filter((_, i) => i !== index);
    onTestReportsChange(newReports);
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <h1 className="text-2xl font-bold text-gray-900">Media</h1>

      <div className="grid grid-cols-2 gap-6">
        {/* Product Images Section */}
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Product Images</h2>
            <p className="text-sm text-gray-500">Upload high-quality product photos</p>
          </div>

          {/* Drop Zone */}
          <div
            className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer transition-all duration-200 hover:border-[#C4A962] hover:bg-amber-50"
            onClick={() => handleClick('product')}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, 'product')}
          >
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                <Upload className="w-6 h-6 text-gray-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">
                  Drag & drop images here
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  or click to browse (JPG, PNG)
                </p>
              </div>
            </div>
          </div>

          {/* Image Previews */}
          {productImages.length > 0 && (
            <div className="grid grid-cols-4 gap-3">
              {productImages.map((file, index) => (
                <div key={index} className="relative group">
                  <img
                    src={URL.createObjectURL(file)}
                    alt={`Product ${index + 1}`}
                    className="w-full h-20 object-cover rounded-lg border border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={() => removeProductImage(index)}
                    className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <p className="text-xs text-gray-400">
            {productImages.length} image{productImages.length !== 1 ? 's' : ''} selected
          </p>
        </div>

        {/* Test Reports Section */}
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Test Reports</h2>
            <p className="text-sm text-gray-500">Upload quality certificates (PDF, JPG)</p>
          </div>

          {/* Drop Zone */}
          <div
            className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer transition-all duration-200 hover:border-[#C4A962] hover:bg-amber-50"
            onClick={() => handleClick('test')}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, 'test')}
          >
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                <FileText className="w-6 h-6 text-gray-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">
                  Drag & drop files here
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  or click to browse (PDF, JPG, PNG)
                </p>
              </div>
            </div>
          </div>

          {/* File List */}
          {testReports.length > 0 && (
            <div className="space-y-2">
              {testReports.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="flex items-center gap-3">
                    {file.type === 'application/pdf' ? (
                      <FileText className="w-5 h-5 text-red-500" />
                    ) : (
                      <ImageIcon className="w-5 h-5 text-blue-500" />
                    )}
                    <span className="text-sm text-gray-700 truncate max-w-[180px]">
                      {file.name.replace('test-reports-', '')}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeTestReport(index)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <p className="text-xs text-gray-400">
            {testReports.length} file{testReports.length !== 1 ? 's' : ''} selected
          </p>
        </div>
      </div>
    </div>
  );
};

export default MediaUpload;
