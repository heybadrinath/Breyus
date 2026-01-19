
interface ProductRowProp {
    imageUrl?: string;
    productName?: string;
    hsn?: string;
    category?: string;
    price?: string;
    currency?: string;
    onSalePrice?: string;
    quantity?: string;
    unit?: string;
    moq?: string;
    moqUnit?: string;
    sku?: string;
    status?: string;
    isActive?: boolean;
    isUpdatingActive?: boolean;
    onEyeClick?: () => void;
    onEditClick?: () => void;
    onDeleteClick?: () => void;
    onToggleActive?: (nextActive: boolean) => void;
}

export const ProductRow: React.FC<ProductRowProp> = ({ imageUrl, productName, hsn, category, price, currency, onSalePrice, quantity, unit, moq, moqUnit, sku, status, isActive, isUpdatingActive, onEyeClick, onEditClick, onDeleteClick, onToggleActive }) => {
    const statusClasses = status === 'Out of Stock'
        ? 'bg-red-100 text-red-700'
        : 'bg-green-100 text-green-800';

    return (
        <tr className="hover:bg-gray-50" >

            <td className="px-6 py-4">
                <div className="flex items-center">
                    <div className="h-16 w-16 flex-shrink-0">
                        <img
                            className="h-16 w-16 rounded-lg object-cover border"
                            src={imageUrl || '/placeholder-product.svg'}
                            alt={productName}
                        />
                    </div>
                    <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 line-clamp">
                            {productName}
                        </div>
                        <div className="text-xs text-gray-400">{(hsn) ? `HSN Code: ${hsn}` : ''}</div>
                    </div>
                </div>
            </td>
            <td className="px-6 py-4">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    {category}
                </span>
            </td>
            <td className="px-6 py-4 text-sm text-gray-900">
                <div className="font-medium">{(price) ? price + ' ' + currency : ''}</div>
                <div className="text-xs text-green-600"> {(onSalePrice) ? `Sale: ${onSalePrice + ' ' + currency}` : ''}</div>
            </td>
            <td className="px-6 py-4 text-sm text-gray-900">
                <div className="font-medium">{quantity || ''}</div>
            </td>
            <td className="px-6 py-4 text-sm text-gray-900">
                <div className="font-medium">{unit || ''}</div>
            </td>
            <td className="px-6 py-4 text-sm text-gray-900">
                <div className="font-medium">{moq ? `${moq} ${moqUnit || ''}` : ''}</div>
            </td>
            <td className="px-6 py-4 text-sm text-gray-900">
                <div className="font-medium">{sku || ''}</div>
            </td>
            <td className="px-6 py-4">
                {status && (
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClasses}`}>
                        {status}
                    </span>
                )}
            {onToggleActive && (
                    <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                        <input
                            type="checkbox"
                            checked={!!isActive}
                            onChange={(event) => onToggleActive(event.target.checked)}
                            disabled={isUpdatingActive}
                            className="h-4 w-4 rounded border-gray-300 text-black focus:ring-black"
                            aria-label="Toggle product visibility"
                            title={isActive ? 'Visible to buyers' : 'Hidden from buyers'}
                        />
                        <span
                            className={`min-w-[74px] text-left inline-flex items-center justify-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${isActive ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}
                        >
                            {isActive ? 'Visible' : 'Hidden'}
                        </span>
                    </div>
                )}
            </td>
            <td className="px-6 py-4 text-sm font-medium">
                <div className="flex items-center gap-2">
                    <button
                        onClick={onEyeClick} 
                        className="text-blue-600 hover:text-blue-900 transition-colors duration-200"
                        title="View Details"
                    >
                        <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                        </svg>
                    </button>
                    <button
                        onClick={onEditClick}
                        className="text-gray-600 hover:text-gray-900 transition-colors duration-200"
                        title="Edit Product"
                    >
                        <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                        </svg>
                    </button>
                    <button
                        onClick={onDeleteClick}
                        className="text-red-600 hover:text-red-900 transition-colors duration-200"
                        title="Delete Product"
                    >
                        <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                        </svg>
                    </button>
                </div>
            </td>
        </tr >
    )
}
