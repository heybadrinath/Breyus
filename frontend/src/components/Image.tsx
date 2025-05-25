import React, { useState, useEffect } from 'react';

interface ImageProps {
  src?: string;
  alt: string;
  className?: string;
  fallbackSrc?: string;
  loadingClassName?: string;
  errorClassName?: string;
  showLoadingSpinner?: boolean;
  showErrorText?: boolean;
  onLoad?: () => void;
  onError?: () => void;
  style?: React.CSSProperties;
}

const Image: React.FC<ImageProps> = ({
  src,
  alt,
  className = '',
  fallbackSrc = '/placeholder-product.svg',
  loadingClassName = '',
  errorClassName = '',
  showLoadingSpinner = true,
  showErrorText = true,
  onLoad,
  onError,
  style,
  ...props
}) => {
  const [imageSrc, setImageSrc] = useState(src || fallbackSrc);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setImageSrc(src || fallbackSrc);
    setIsLoading(true);
    setHasError(false);
  }, [src, fallbackSrc]);

  const handleImageLoad = () => {
    setIsLoading(false);
    setHasError(false);
    onLoad?.();
  };

  const handleImageError = () => {
    setIsLoading(false);
    setHasError(true);
    
    // Try fallback if not already using it
    if (imageSrc !== fallbackSrc) {
      setImageSrc(fallbackSrc);
      setHasError(false);
      setIsLoading(true);
    }
    
    onError?.();
  };

  const containerClasses = `relative ${className}`;
  const imageClasses = `${className} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-200`;

  return (
    <div className={containerClasses} style={style}>
      {/* Loading Spinner */}
      {isLoading && showLoadingSpinner && (
        <div className={`absolute inset-0 flex items-center justify-center bg-gray-100 ${loadingClassName}`}>
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-400"></div>
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading && !showLoadingSpinner && (
        <div className={`absolute inset-0 bg-gray-200 image-loading ${loadingClassName}`}></div>
      )}

      {/* Image */}
      <img
        src={imageSrc}
        alt={alt}
        className={imageClasses}
        onLoad={handleImageLoad}
        onError={handleImageError}
        style={{
          objectFit: 'cover',
          objectPosition: 'center',
          ...style,
        }}
        {...props}
      />

      {/* Error State */}
      {hasError && imageSrc === fallbackSrc && showErrorText && (
        <div className={`absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-400 text-xs ${errorClassName}`}>
          No Image
        </div>
      )}
    </div>
  );
};

export default Image; 