import { MessageCircle, Heart, Share2 } from "lucide-react";
import AddToCartButton from "./AddToCartButton";

const ProductCTA: React.FC = () => (
  <div className="space-y-4 mt-6">
    <AddToCartButton />

    <button className="w-full py-2 border rounded-lg font-semibold">
      View Test Reports
    </button>
    <button className="w-full py-2 border rounded-lg font-semibold">
      Trade Terms
    </button>

    <div className="flex justify-between text-sm text-black mt-4 border-t pt-4">
      <div className="flex items-center gap-2">
        <MessageCircle size={16} /> Chat
      </div>
      <div className="flex items-center gap-2">
        <Heart size={16} /> Wishlist
      </div>
      <div className="flex items-center gap-2">
        <Share2 size={16} /> Share
      </div>
    </div>
  </div>
);

export default ProductCTA;