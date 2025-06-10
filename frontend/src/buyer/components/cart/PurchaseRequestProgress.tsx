import React from "react"

interface PurchaseRequestProgressProps {
    step1: string;
    step2: string;
    step3: string;
    step4: string;
    currentStep: number;
    className?: string;
}

export default function PurchaseRequestProgress({ 
    step1, 
    step2, 
    step3, 
    step4, 
    currentStep,
    className = ""
}: PurchaseRequestProgressProps) {
    const progressWidth = 92.5 + (currentStep * 187);
    
    return (
        <svg width="762" className={`${className}`} height="91" viewBox="0 0 762 91" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Background Container */}
            <path 
                d="M751.814 6H10.1858C5.1126 6 1 10.2533 1 15.5V80.5C1 85.7467 5.1126 90 10.1858 90H751.814C756.887 90 761 85.7467 761 80.5V15.5C761 10.2533 756.887 6 751.814 6Z" 
                fill="#282828" 
                stroke="black"
            />
            
            {/* Blur Effect */}
            <filter id="blur">
                <feGaussianBlur in="SourceGraphic" stdDeviation="2" />
            </filter>
            
            {/* Animated Background with Blur */}
            <g filter="url(#blur)">
                <path 
                    d="M751.814 6H10.1858C5.1126 6 1 10.2533 1 15.5V80.5C1 85.7467 5.1126 90 10.1858 90H751.814C756.887 90 761 85.7467 761 80.5V15.5C761 10.2533 756.887 6 751.814 6Z" 
                    fill="url(#paint1_linear_23_12)"
                 
                    className="transition-all duration-500 ease-in-out"
                    opacity={currentStep >= 0 ? 1 : 0}
                    style={{
                        clipPath: `inset(0 ${761 - progressWidth}px 0 0)`
                    }}
                />
            </g>
            
            {/* Progress Line */}
            <line 
                x1="92.5" 
                y1="46" 
                x2={progressWidth}
                y2="46" 
                stroke="white"
                className="transition-all duration-500 ease-in-out"
            />

            {/* Step Circles */}
            <ellipse 
                cx="92.5" 
                cy="46" 
                rx="8.5" 
                ry="9" 
                fill="white" 
                fillOpacity={currentStep >= 0 ? 1 : 0.38}
                className="transition-all duration-300 ease-in-out"
            />
            <ellipse 
                cx="279.5" 
                cy="46" 
                rx="8.5" 
                ry="9" 
                fill="white" 
                fillOpacity={currentStep >= 1 ? 1 : 0.38}
                className="transition-all duration-300 ease-in-out"
            />
            <ellipse 
                cx="466.5" 
                cy="46" 
                rx="8.5" 
                ry="9" 
                fill="white" 
                fillOpacity={currentStep >= 2 ? 1 : 0.38}
                className="transition-all duration-300 ease-in-out"
            />
            <ellipse 
                cx="653.5" 
                cy="46" 
                rx="8.5" 
                ry="9" 
                fill="white" 
                fillOpacity={currentStep >= 3 ? 1 : 0.38}
                className="transition-all duration-300 ease-in-out"
            />

            {/* Step Labels */}
            <text
                x="92.5"
                y="29"
                textAnchor="middle"
                fontSize="13"
                fill="#ffff"
                className="transition-all duration-300 ease-in-out"
                style={{
                    opacity: currentStep >= 0 ? 1 : 0,
                    transform: `translateY(${currentStep >= 0 ? '0' : '10px'})`
                }}
            >
                {step1}
            </text>
            <text
                x="279.5"
                y="29"
                textAnchor="middle"
                fontSize="13"
                fill="#ffff"
                className="transition-all duration-300 ease-in-out"
                style={{
                    opacity: currentStep >= 1 ? 1 : 0,
                    transform: `translateY(${currentStep >= 1 ? '0' : '10px'})`
                }}
            >
                {step2}
            </text>
            <text
                x="466.5"
                y="29"
                textAnchor="middle"
                fontSize="13"
                fill="#ffff"
                className="transition-all duration-300 ease-in-out"
                style={{
                    opacity: currentStep >= 2 ? 1 : 0,
                    transform: `translateY(${currentStep >= 2 ? '0' : '10px'})`
                }}
            >
                {step3}
            </text>
            <text
                x="653.5"
                y="29"
                textAnchor="middle"
                fontSize="13"
                fill="#ffff"
                className="transition-all duration-300 ease-in-out"
                style={{
                    opacity: currentStep >= 3 ? 1 : 0,
                    transform: `translateY(${currentStep >= 3 ? '0' : '10px'})`
                }}
            >
                {step4}
            </text>

            <defs>
                <linearGradient id="paint0_linear_23_12" x1="0.516539" y1="48" x2="761.483" y2="48" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#000"/>
                    <stop offset="1" stopColor=" 	#282828"/>
                </linearGradient>
                <linearGradient id="paint1_linear_23_12" x1="0.516539" y1="48" x2="761.483" y2="48" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#000000"/>
                    <stop offset="0.3" stopColor="#1a1a1a"/>
                    <stop offset="0.6" stopColor="#2a2a2a"/>
                    <stop offset="0.8" stopColor="#303030"/>
                    <stop offset="1" stopColor="#303030"/>
                </linearGradient>
            </defs>
        </svg>
    );
}