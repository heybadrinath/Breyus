interface ProductVisualProps {
    src: string;
    alt: string;
    className?: string;
  }
  
  const ProductVisual: React.FC<ProductVisualProps> = ({ src, alt, className = '' }) => (
    <div className={`flex justify-center items-center bg-gray-50 p-4 rounded-lg ${className}`}>
      <img src={src} alt={alt} className="object-contain max-h-[400px]" />
    </div>
  );
  
  export default ProductVisual;