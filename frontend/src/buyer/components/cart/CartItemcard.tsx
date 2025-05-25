import { Trash2, Plus, Minus } from "lucide-react";
import protein from "../../../assets/protein.png";

type CartItemProps = {
  title: string;
  price: string;
  image: string;
};

export default function CartItem({ title, price, image }: CartItemProps) {
  return (
    <div className="border rounded-lg p-4 flex flex-col space-y-4">
      <div className="flex items-start gap-4">
        <img src={image} alt="product" className="w-24 h-24 object-contain" />
        <div className="flex-1">
          <p className="font-semibold text-sm">{title}</p>
          <p className="text-green-600 text-xs mt-1">In stock</p>

          <div className="flex flex-col sm:flex-row gap-4 mt-3">
            <div className="flex items-center gap-3">
              <button className="p-1 border rounded hover:bg-gray-100">
                <Trash2 size={16} />
              </button>
              <div className="flex items-center border rounded px-2">
                <button className="p-1">
                  <Minus size={14} />
                </button>
                <span className="px-2">1</span>
                <button className="p-1">
                  <Plus size={14} />
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-x-4">
              <button className="text-sm text-blue-600 hover:underline">Save to Wishlist</button>
              <div className="h-4 w-px bg-gray-300 hidden sm:block"></div>
              <button className="text-sm text-blue-600 hover:underline">Ask Queries</button>
              <div className="h-4 w-px bg-gray-300 hidden sm:block"></div>
              <button className="text-sm text-blue-600 hover:underline">View Trade Terms</button>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t pt-2 text-sm font-medium text-right">
        Subtotal (1 item): <span className="font-bold">{price}</span>
      </div>
    </div>
  );
}