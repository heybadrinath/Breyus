import { Star } from "lucide-react";

interface ProductDetailsProps {
  title: string;
  rating: number;
  price: string;
  className?: string;
}

const ProductDetails: React.FC<ProductDetailsProps> = ({
  title,
  rating,
  price,
  className = '',
}) => (
  <div className={`space-y-4 ${className}`}>
    <h2 className="text-2xl font-bold">{title}</h2>
    <div className="flex items-center gap-1 text-yellow-500">
      <span className="text-black font-medium">{rating.toFixed(1)}</span>
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={`w-4 h-4 ${
            i < rating ? "fill-yellow-500" : "text-gray-300"
          }`}
          fill={i < rating ? "currentColor" : "none"}
        />
      ))}
    </div>
    <p className="text-xl font-semibold text-black">Price: {price}</p>
  </div>
);

export default ProductDetails;