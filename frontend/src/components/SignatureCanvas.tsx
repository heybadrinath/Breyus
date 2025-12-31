import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Eraser, Pen, Download, RotateCcw } from 'lucide-react';

interface SignatureCanvasProps {
    onSignatureChange: (dataUrl: string | null) => void;
    width?: number;
    height?: number;
    strokeColor?: string;
    strokeWidth?: number;
    backgroundColor?: string;
}

export const SignatureCanvas: React.FC<SignatureCanvasProps> = ({
    onSignatureChange,
    width = 400,
    height = 200,
    strokeColor = '#000000',
    strokeWidth = 2,
    backgroundColor = '#ffffff',
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [hasSignature, setHasSignature] = useState(false);
    const [currentStrokeColor, setCurrentStrokeColor] = useState(strokeColor);
    const [currentStrokeWidth, setCurrentStrokeWidth] = useState(strokeWidth);

    // Initialize canvas
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Set background color
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, width, height);
    }, [width, height, backgroundColor]);

    const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return null;

        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        if ('touches' in e) {
            const touch = e.touches[0];
            return {
                x: (touch.clientX - rect.left) * scaleX,
                y: (touch.clientY - rect.top) * scaleY,
            };
        } else {
            return {
                x: (e.clientX - rect.left) * scaleX,
                y: (e.clientY - rect.top) * scaleY,
            };
        }
    };

    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        const coords = getCoordinates(e);
        if (!coords) return;

        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!ctx) return;

        ctx.beginPath();
        ctx.moveTo(coords.x, coords.y);
        setIsDrawing(true);
    };

    const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        if (!isDrawing) return;

        const coords = getCoordinates(e);
        if (!coords) return;

        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!ctx) return;

        ctx.strokeStyle = currentStrokeColor;
        ctx.lineWidth = currentStrokeWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineTo(coords.x, coords.y);
        ctx.stroke();

        if (!hasSignature) {
            setHasSignature(true);
        }
    };

    const stopDrawing = () => {
        if (isDrawing) {
            setIsDrawing(false);
            updateSignature();
        }
    };

    const updateSignature = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        // Check if canvas has any drawing
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // Check if all pixels are the background color
        let isBlank = true;
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            // Assuming white background (255, 255, 255)
            if (r !== 255 || g !== 255 || b !== 255) {
                isBlank = false;
                break;
            }
        }

        if (isBlank) {
            onSignatureChange(null);
            setHasSignature(false);
        } else {
            onSignatureChange(canvas.toDataURL('image/png'));
            setHasSignature(true);
        }
    }, [onSignatureChange]);

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!ctx || !canvas) return;

        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        setHasSignature(false);
        onSignatureChange(null);
    };

    const downloadSignature = () => {
        const canvas = canvasRef.current;
        if (!canvas || !hasSignature) return;

        const link = document.createElement('a');
        link.download = 'signature.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
    };

    // Prevent scrolling when drawing on touch devices
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const preventScroll = (e: TouchEvent) => {
            if (isDrawing) {
                e.preventDefault();
            }
        };

        canvas.addEventListener('touchmove', preventScroll, { passive: false });
        return () => {
            canvas.removeEventListener('touchmove', preventScroll);
        };
    }, [isDrawing]);

    return (
        <div className="flex flex-col gap-3">
            {/* Toolbar */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    {/* Color picker */}
                    <label className="flex items-center gap-2 text-sm text-gray-600">
                        <Pen className="w-4 h-4" />
                        <input
                            type="color"
                            value={currentStrokeColor}
                            onChange={(e) => setCurrentStrokeColor(e.target.value)}
                            className="w-8 h-8 cursor-pointer rounded border border-gray-300"
                        />
                    </label>

                    {/* Stroke width */}
                    <label className="flex items-center gap-2 text-sm text-gray-600">
                        Width:
                        <input
                            type="range"
                            min="1"
                            max="10"
                            value={currentStrokeWidth}
                            onChange={(e) => setCurrentStrokeWidth(Number(e.target.value))}
                            className="w-20"
                        />
                        <span className="w-4">{currentStrokeWidth}</span>
                    </label>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={clearCanvas}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Clear signature"
                    >
                        <Eraser className="w-4 h-4" />
                        Clear
                    </button>

                    <button
                        onClick={downloadSignature}
                        disabled={!hasSignature}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Download signature"
                    >
                        <Download className="w-4 h-4" />
                        Save
                    </button>
                </div>
            </div>

            {/* Canvas */}
            <div className="relative border-2 border-dashed border-gray-300 rounded-lg overflow-hidden bg-white">
                <canvas
                    ref={canvasRef}
                    width={width}
                    height={height}
                    className="cursor-crosshair touch-none"
                    style={{ width: '100%', height: 'auto', maxHeight: `${height}px` }}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                />

                {/* Placeholder text */}
                {!hasSignature && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <p className="text-gray-400 text-sm">Sign here</p>
                    </div>
                )}
            </div>

            {/* Status */}
            <div className="flex items-center justify-between text-sm text-gray-500">
                <span>
                    {hasSignature ? (
                        <span className="flex items-center gap-1 text-green-600">
                            <span className="w-2 h-2 bg-green-500 rounded-full" />
                            Signature captured
                        </span>
                    ) : (
                        'Draw your signature above'
                    )}
                </span>
                {hasSignature && (
                    <button
                        onClick={clearCanvas}
                        className="flex items-center gap-1 text-gray-500 hover:text-gray-700"
                    >
                        <RotateCcw className="w-3 h-3" />
                        Reset
                    </button>
                )}
            </div>
        </div>
    );
};

export default SignatureCanvas;
