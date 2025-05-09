type AddToCartButtonProps = {
    onClick?: () => void;
  };
  
  const AddToCartButton: React.FC<AddToCartButtonProps> = ({ onClick }) => {
    return (
      <button
        onClick={onClick}
        className="mt-4 border border-gray-300 rounded-full px-6 py-2 text-gray-700 text-sm font-medium hover:bg-gray-100 transition"
      >
        Add to cart
      </button>
    );
  };
  
  export default AddToCartButton;