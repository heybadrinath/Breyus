import React, { useState, useCallback } from 'react';

interface MediaUploadProps {
  productImages: File[];
  testReports: File[];
  onProductImagesChange: (newImages: File[]) => void;
  onTestReportsChange: (newReports: File[]) => void;
}


const MediaUpload: React.FC<MediaUploadProps> = ({productImages, testReports, onProductImagesChange, onTestReportsChange}) => {
  

  // Handle drag over to allow dropping
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    // You can change the box style to show a hover effect
    e.currentTarget.classList.add('border-dashed', 'border-blue-500');
  };

  // Handle drag leave to remove hover effect
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove('border-dashed', 'border-blue-500');
  };

  // Handle drop event (files dropped)
  const handleDrop = (e: React.DragEvent<HTMLDivElement>, type: 'product' | 'test') => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove('border-dashed', 'border-blue-500'); // Remove hover effect
    
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

  // Handle file selection (via click)
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: 'product' | 'test') => {
    const files = e.target.files;
    if (files) {
      let fileArray = Array.from(files);
      if (type === 'product') {
        // Only allow images
        fileArray = fileArray.filter(file => file.type.startsWith('image/'));
        // Rename files
        fileArray = fileArray.map(file => new File([file], `product-images-${file.name}`, { type: file.type }));
        onProductImagesChange([...productImages, ...fileArray]);
      } else {
        // Allow images and PDFs
        fileArray = fileArray.filter(file => file.type.startsWith('image/') || file.type === 'application/pdf');
        // Rename files
        fileArray = fileArray.map(file => new File([file], `test-reports-${file.name}`, { type: file.type }));
        onTestReportsChange([...testReports, ...fileArray]);
      }
    }
  };

  // Handle clicking to open file dialog (triggered by custom box)
  const handleClick = (e: React.MouseEvent<HTMLDivElement>, type: 'product' | 'test') => {
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

  return (
    <div>
      <div className="flex flex-col h-full">
        <h1 className="section-title font-bold mb-6 text-2xl">Media</h1>
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1 product-card">
            <h2 className="text-lg font-semibold mb-3">Product Images</h2>
            <p className="text-gray-500 text-sm mb-4">Upload product photos</p>

            {/* Product images drag & drop box */}
            <div
              className="border-2 border-gray-400 border-dashed px-6 py-20 rounded-lg flex justify-center items-center cursor-pointer"
              onClick={(e) => handleClick(e, 'product')}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, 'product')}
            >
              <p className="text-gray-500">Drag & drop your files here or click to select</p>
            </div>
            <div className="mt-4">
              {productImages.length > 0 && (
                <div className="grid grid-cols-4 gap-4">
                  {productImages.map((file, index) => (
                    <div key={index}>
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`Product Image ${index}`}
                        className="w-15 h-15 object-cover rounded-md"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 product-card">
            <h2 className="text-lg font-semibold mb-3">Test Reports</h2>
            <p className="text-gray-500 text-sm mb-4">Upload test certificates (PDF, JPG)</p>

            {/* Test reports drag & drop box */}
            <div
              className="border-2 border-gray-400 border-dashed px-6 py-20 rounded-lg flex justify-center items-center cursor-pointer"
              onClick={(e) => handleClick(e, 'test')}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, 'test')}
            >
              <p className="text-gray-500">Drag & drop your files here or click to select</p>
            </div>
            <div className="mt-4">
              {testReports.length > 0 && (
                <div className="grid grid-cols-3 gap-4">
                  {testReports.map((file, index) => (
                    <div key={index}>
                      <p className="text-sm">{file.name}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MediaUpload;
