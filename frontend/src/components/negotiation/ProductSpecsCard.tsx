import React from 'react';
import { Package, Hash, Award, FileCheck, ChevronRight, ShoppingBag } from 'lucide-react';
import { getImageUrl } from '../../utils/imageUtils';

interface ProductSpecsProps {
    product: {
        _id?: string;
        name?: string;
        hsn?: string;
        certifications?: string[];
        testReportImages?: string[];
        productImages?: string[];
        description?: string;
        specifications?: Record<string, string>;
    } | null;
    quantity: number | string;
    unit: string;
    onViewProduct?: () => void;
}

/**
 * ProductSpecsCard
 *
 * Displays product details in a clean, light card design
 * with prominent quantity display and key specifications.
 */
const ProductSpecsCard: React.FC<ProductSpecsProps> = ({
    product,
    quantity,
    unit,
    onViewProduct
}) => {
    if (!product) {
        return (
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-center h-32 text-gray-400">
                    <div className="text-center">
                        <Package className="w-10 h-10 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Product information unavailable</p>
                    </div>
                </div>
            </div>
        );
    }

    const hasCertifications = product.certifications && product.certifications.length > 0;
    const hasTestReports = product.testReportImages && product.testReportImages.length > 0;

    return (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            {/* Product Image Header */}
            <div className="relative h-36 bg-gradient-to-br from-gray-100 to-gray-50">
                {product.productImages?.[0] ? (
                    <img
                        src={getImageUrl(product.productImages[0])}
                        alt={product.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                        }}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-16 h-16 text-gray-300" />
                    </div>
                )}
                {/* Gradient overlay for better text readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

                {/* Product name */}
                <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 className="text-white font-bold text-xl drop-shadow-md">
                        {product.name || 'Product Name'}
                    </h3>
                </div>
            </div>

            {/* Content */}
            <div className="p-5 space-y-4">
                {/* Quantity - Prominent Display */}
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
                    <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center">
                        <ShoppingBag className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <p className="text-xs text-blue-600 font-medium uppercase tracking-wide">
                            Requested Quantity
                        </p>
                        <p className="text-xl font-bold text-blue-900">
                            {quantity} <span className="text-sm font-medium text-blue-600">{unit}</span>
                        </p>
                    </div>
                </div>

                {/* HSN Code */}
                {product.hsn && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                        <div className="w-8 h-8 rounded-lg bg-gray-200 flex items-center justify-center">
                            <Hash className="w-4 h-4 text-gray-600" />
                        </div>
                        <div>
                            <p className="text-[10px] uppercase tracking-wider text-gray-500">
                                HSN Code
                            </p>
                            <p className="font-mono font-semibold text-gray-800">
                                {product.hsn}
                            </p>
                        </div>
                    </div>
                )}

                {/* Certifications */}
                {hasCertifications && (
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                            <Award className="w-4 h-4 text-amber-500" />
                            Certifications
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                            {product.certifications!.slice(0, 4).map((cert, index) => (
                                <span
                                    key={index}
                                    className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg text-xs font-medium"
                                >
                                    {cert}
                                </span>
                            ))}
                            {product.certifications!.length > 4 && (
                                <span className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs">
                                    +{product.certifications!.length - 4} more
                                </span>
                            )}
                        </div>
                    </div>
                )}

                {/* Test Reports Indicator */}
                {hasTestReports && (
                    <div className="flex items-center gap-2 p-2.5 bg-green-50 rounded-lg border border-green-100">
                        <FileCheck className="w-4 h-4 text-green-600" />
                        <span className="text-xs font-medium text-green-700">
                            {product.testReportImages!.length} Test Report{product.testReportImages!.length > 1 ? 's' : ''} Available
                        </span>
                    </div>
                )}

                {/* View Full Product Button */}
                {onViewProduct && (
                    <button
                        onClick={onViewProduct}
                        className="w-full flex items-center justify-center gap-2 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-medium transition-colors"
                    >
                        View Full Product Details
                        <ChevronRight className="w-4 h-4" />
                    </button>
                )}
            </div>
        </div>
    );
};

export default ProductSpecsCard;
