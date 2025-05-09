import ProductVisual from "../components/ProductVisual";
import ProductDetails from "../components/ProductDetails";
import ProductCTA from "../components/ProductCTA";

const ProductDisplay = () => {
  return (
    <div className="p-4 max-w-7xl mx-auto flex flex-col md:flex-row gap-6">
      {/* Left - Image and Visual */}
      <div className="w-full md:w-1/2">
        <ProductVisual
          src="/protein-pack.png"
          alt="De-Carbon Protein Sample"
        />
      </div>

      {/* Right - Product Info */}
      <div className="w-full md:w-1/2 flex flex-col justify-between">
        <ProductDetails
          title="Redragon Shiva K512 RGB Backlit Membrane Wired Gaming Keyboard with Multimedia Keys"
          rating={4.0}
          price="₹4,500,000.00"
        />
        <ProductCTA />
      </div>
    </div>
  );
};

export default ProductDisplay;