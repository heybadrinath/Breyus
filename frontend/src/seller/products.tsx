import React, { JSX, useState, useEffect } from "react";
import { ReactNode } from "react";
import { Togglebutton } from "./components";
import "../seller/css/product.css"
import apiService from "../services/api.service";



const ProductProgressVector = ({ page }: { page: string }) => { // use 'product, media, price, tags' for different pages in page prop
    let product = false;
    let media = false;
    let price = false;
    let tags = false;
    if (page === "product") {
        product = true;
    } else if (page === "media") {
        product = true;
        media = true;
    } else if (page === "price") {
        product = true;
        media = true;
        price = true;
    } else if (page === "tags") {
        product = true;
        media = true;
        price = true;
        tags = true;
    }
    return (
        <div className={"m-auto w-fit"}>
            <svg className={"transition-all delay-1000 ease-in-out"} width="762" height="86" viewBox="0 0 762 86" fill="none" xmlns="http://www.w3.org/2000/svg">
                <g id="product-progress">
                    <path id="Vector" d="M753.76 2H10.2398C5.68908 2 2 5.80558 2 10.5V75.5C2 80.1944 5.68908 84 10.2398 84H753.76C758.311 84 762 80.1944 762 75.5V10.5C762 5.80558 758.311 2 753.76 2Z" fill="url(#paint0_linear_1_41)" stroke="#353535" stroke-width="3" />
                    <path id="media-dot" fill-opacity={media ? "1" : "0.38"} d="M280.699 53.5C285.517 53.5 289.423 49.4706 289.423 44.5C289.423 39.5294 285.517 35.5 280.699 35.5C275.881 35.5 271.974 39.5294 271.974 44.5C271.974 49.4706 275.881 53.5 280.699 53.5Z" fill="#FFFDFD" />
                    <path id="product-dot" fill-opacity={product ? "1" : "0.38"} d="M92.6378 53.5C97.4562 53.5 101.362 49.4706 101.362 44.5C101.362 39.5294 97.4562 35.5 92.6378 35.5C87.8194 35.5 83.9133 39.5294 83.9133 44.5C83.9133 49.4706 87.8194 53.5 92.6378 53.5Z" fill="white" />
                    <path id="price-dot" fill-opacity={price ? "1" : "0.38"} d="M467.791 53.5C472.609 53.5 476.515 49.4706 476.515 44.5C476.515 39.5294 472.609 35.5 467.791 35.5C462.972 35.5 459.066 39.5294 459.066 44.5C459.066 49.4706 462.972 53.5 467.791 53.5Z" fill="white" />
                    <path id="tags-dot" fill-opacity={tags ? "1" : "0.38"} d="M654.883 53.5C659.701 53.5 663.607 49.4706 663.607 44.5C663.607 39.5294 659.701 35.5 654.883 35.5C650.064 35.5 646.158 39.5294 646.158 44.5C646.158 49.4706 650.064 53.5 654.883 53.5Z" fill="white" />
                    <path id="product-info-text" fill-opacity={product ? "1" : "0"} d="M72.8855 24.644C72.8855 24.9427 72.8157 25.2227 72.6761 25.484C72.5414 25.7453 72.3272 25.956 72.0325 26.116C71.7426 26.276 71.3762 26.356 70.9312 26.356H70.0239V28.5H68.9382V22.916H70.9312C71.35 22.916 71.7067 22.9907 72.0014 23.14C72.2961 23.2893 72.5162 23.4947 72.6606 23.756C72.8109 24.0173 72.8855 24.3133 72.8855 24.644ZM70.8847 25.452C71.1842 25.452 71.4072 25.3827 71.5516 25.244C71.6961 25.1 71.7688 24.9 71.7688 24.644C71.7688 24.1 71.4741 23.828 70.8847 23.828H70.0239V25.452H70.8847ZM74.7419 24.756C74.8815 24.5213 75.0628 24.3373 75.2848 24.204C75.5126 24.0707 75.7714 24.004 76.0603 24.004V25.18H75.7733C75.4321 25.18 75.1742 25.2627 74.9978 25.428C74.8272 25.5933 74.7419 25.8813 74.7419 26.292V28.5H73.6562V24.068H74.7419V24.756ZM78.6999 28.572C78.286 28.572 77.9137 28.4787 77.5832 28.292C77.2516 28.1 76.9909 27.8307 76.7999 27.484C76.6138 27.1373 76.5207 26.7373 76.5207 26.284C76.5207 25.8307 76.6157 25.4307 76.8077 25.084C77.0035 24.7373 77.2701 24.4707 77.6064 24.284C77.9418 24.092 78.317 23.996 78.7309 23.996C79.1439 23.996 79.519 24.092 79.8554 24.284C80.1908 24.4707 80.4545 24.7373 80.6464 25.084C80.8423 25.4307 80.9411 25.8307 80.9411 26.284C80.9411 26.7373 80.8403 27.1373 80.6387 27.484C80.4419 27.8307 80.1734 28.1 79.8321 28.292C79.4958 28.4787 79.1187 28.572 78.6999 28.572ZM78.6999 27.596C78.8957 27.596 79.0799 27.548 79.2505 27.452C79.426 27.3507 79.5656 27.2013 79.6693 27.004C79.772 26.8067 79.8244 26.5667 79.8244 26.284C79.8244 25.8627 79.7158 25.54 79.4987 25.316C79.2864 25.0867 79.0256 24.972 78.7154 24.972C78.4052 24.972 78.1435 25.0867 77.9322 25.316C77.7247 25.54 77.6219 25.8627 77.6219 26.284C77.6219 26.7053 77.7228 27.0307 77.9244 27.26C78.1309 27.484 78.3897 27.596 78.6999 27.596ZM81.4578 26.268C81.4578 25.82 81.5431 25.4227 81.7137 25.076C81.8892 24.7293 82.1277 24.4627 82.4272 24.276C82.7267 24.0893 83.0602 23.996 83.4276 23.996C83.7068 23.996 83.9734 24.06 84.2264 24.188C84.4794 24.3107 84.681 24.476 84.8313 24.684V22.58H85.9325V28.5H84.8313V27.844C84.6965 28.0627 84.5085 28.2387 84.2652 28.372C84.0218 28.5053 83.7407 28.572 83.4199 28.572C83.0583 28.572 82.7267 28.476 82.4272 28.284C82.1277 28.092 81.8892 27.8227 81.7137 27.476C81.5431 27.124 81.4578 26.7213 81.4578 26.268ZM84.839 26.284C84.839 26.012 84.7877 25.78 84.6839 25.588C84.5802 25.3907 84.4406 25.2413 84.2652 25.14C84.0897 25.0333 83.9007 24.98 83.699 24.98C83.4974 24.98 83.3113 25.0307 83.1407 25.132C82.9701 25.2333 82.8305 25.3827 82.7219 25.58C82.6182 25.772 82.5668 26.0013 82.5668 26.268C82.5668 26.5347 82.6182 26.7693 82.7219 26.972C82.8305 27.1693 82.9701 27.3213 83.1407 27.428C83.3161 27.5347 83.5023 27.588 83.699 27.588C83.9007 27.588 84.0897 27.5373 84.2652 27.436C84.4406 27.3293 84.5802 27.18 84.6839 26.988C84.7877 26.7907 84.839 26.556 84.839 26.284ZM91.0489 24.068V28.5H89.9555V27.94C89.8159 28.132 89.6327 28.284 89.4048 28.396C89.1829 28.5027 88.9395 28.556 88.6759 28.556C88.3395 28.556 88.0429 28.484 87.784 28.34C87.5252 28.1907 87.3216 27.9747 87.1714 27.692C87.0269 27.404 86.9542 27.0627 86.9542 26.668V24.068H88.04V26.508C88.04 26.86 88.1253 27.132 88.2959 27.324C88.4665 27.5107 88.6991 27.604 88.9938 27.604C89.2934 27.604 89.5289 27.5107 89.6995 27.324C89.8702 27.132 89.9555 26.86 89.9555 26.508V24.068H91.0489ZM91.8409 26.284C91.8409 25.8253 91.9311 25.4253 92.1123 25.084C92.2936 24.7373 92.5437 24.4707 92.8646 24.284C93.1855 24.092 93.5519 23.996 93.9658 23.996C94.498 23.996 94.9381 24.1347 95.2842 24.412C95.6361 24.684 95.8707 25.068 95.9899 25.564H94.8189C94.7568 25.372 94.6512 25.2227 94.5009 25.116C94.3565 25.004 94.1752 24.948 93.9581 24.948C93.6479 24.948 93.4026 25.0653 93.2213 25.3C93.0401 25.5293 92.9499 25.8573 92.9499 26.284C92.9499 26.7053 93.0401 27.0333 93.2213 27.268C93.4026 27.4973 93.6479 27.612 93.9581 27.612C94.3972 27.612 94.6841 27.4093 94.8189 27.004H95.9899C95.8707 27.484 95.6361 27.8653 95.2842 28.148C94.9323 28.4307 94.4932 28.572 93.9658 28.572C93.5519 28.572 93.1855 28.4787 92.8646 28.292C92.5437 28.1 92.2936 27.8333 92.1123 27.492C91.9311 27.1453 91.8409 26.7427 91.8409 26.284ZM98.0498 24.988V27.132C98.0498 27.2813 98.0828 27.3907 98.1507 27.46C98.2224 27.524 98.3416 27.556 98.5074 27.556H99.0115V28.5H98.329C97.4139 28.5 96.9564 28.0413 96.9564 27.124V24.988H96.4445V24.068H96.9564V22.972H98.0498V24.068H99.0115V24.988H98.0498ZM102.725 22.916V28.5H101.639V22.916H102.725ZM106.179 24.004C106.691 24.004 107.105 24.172 107.42 24.508C107.735 24.8387 107.893 25.3027 107.893 25.9V28.5H106.807V26.052C106.807 25.7 106.722 25.4307 106.551 25.244C106.381 25.052 106.148 24.956 105.853 24.956C105.554 24.956 105.315 25.052 105.14 25.244C104.969 25.4307 104.884 25.7 104.884 26.052V28.5H103.798V24.068H104.884V24.62C105.028 24.428 105.213 24.2787 105.435 24.172C105.662 24.06 105.911 24.004 106.179 24.004ZM110.895 24.988H110.143V28.5H109.042V24.988H108.553V24.068H109.042V23.844C109.042 23.3 109.192 22.9 109.492 22.644C109.791 22.388 110.244 22.268 110.849 22.284V23.228C110.585 23.2227 110.402 23.268 110.298 23.364C110.194 23.46 110.143 23.6333 110.143 23.884V24.068H110.895V24.988ZM113.507 28.572C113.093 28.572 112.721 28.4787 112.39 28.292C112.058 28.1 111.798 27.8307 111.607 27.484C111.421 27.1373 111.328 26.7373 111.328 26.284C111.328 25.8307 111.423 25.4307 111.615 25.084C111.81 24.7373 112.077 24.4707 112.413 24.284C112.749 24.092 113.124 23.996 113.538 23.996C113.951 23.996 114.326 24.092 114.662 24.284C114.998 24.4707 115.261 24.7373 115.453 25.084C115.649 25.4307 115.748 25.8307 115.748 26.284C115.748 26.7373 115.647 27.1373 115.446 27.484C115.249 27.8307 114.98 28.1 114.639 28.292C114.303 28.4787 113.926 28.572 113.507 28.572ZM113.507 27.596C113.703 27.596 113.887 27.548 114.057 27.452C114.233 27.3507 114.372 27.2013 114.476 27.004C114.579 26.8067 114.631 26.5667 114.631 26.284C114.631 25.8627 114.523 25.54 114.306 25.316C114.093 25.0867 113.832 24.972 113.522 24.972C113.212 24.972 112.95 25.0867 112.739 25.316C112.532 25.54 112.429 25.8627 112.429 26.284C112.429 26.7053 112.53 27.0307 112.731 27.26C112.938 27.484 113.197 27.596 113.507 27.596Z" fill="white" />
                    <path id="pricing-text" fill-opacity={price ? "1" : "0"} d="M458.702 24.644C458.702 24.9427 458.632 25.2227 458.492 25.484C458.358 25.7453 458.144 25.956 457.849 26.116C457.559 26.276 457.192 26.356 456.748 26.356H455.84V28.5H454.755V22.916H456.748C457.166 22.916 457.523 22.9907 457.818 23.14C458.112 23.2893 458.333 23.4947 458.477 23.756C458.627 24.0173 458.702 24.3133 458.702 24.644ZM456.701 25.452C457.001 25.452 457.224 25.3827 457.368 25.244C457.512 25.1 457.585 24.9 457.585 24.644C457.585 24.1 457.29 23.828 456.701 23.828H455.84V25.452H456.701ZM460.558 24.756C460.698 24.5213 460.879 24.3373 461.101 24.204C461.329 24.0707 461.588 24.004 461.877 24.004V25.18H461.59C461.248 25.18 460.991 25.2627 460.814 25.428C460.644 25.5933 460.558 25.8813 460.558 26.292V28.5H459.473V24.068H460.558V24.756ZM463.159 23.54C462.967 23.54 462.807 23.4787 462.678 23.356C462.554 23.228 462.492 23.0707 462.492 22.884C462.492 22.6973 462.554 22.5427 462.678 22.42C462.807 22.292 462.967 22.228 463.159 22.228C463.35 22.228 463.508 22.292 463.632 22.42C463.761 22.5427 463.826 22.6973 463.826 22.884C463.826 23.0707 463.761 23.228 463.632 23.356C463.508 23.4787 463.35 23.54 463.159 23.54ZM463.694 24.068V28.5H462.608V24.068H463.694ZM464.487 26.284C464.487 25.8253 464.577 25.4253 464.759 25.084C464.94 24.7373 465.19 24.4707 465.511 24.284C465.832 24.092 466.198 23.996 466.612 23.996C467.144 23.996 467.584 24.1347 467.93 24.412C468.282 24.684 468.517 25.068 468.636 25.564H467.465C467.403 25.372 467.297 25.2227 467.147 25.116C467.003 25.004 466.821 24.948 466.604 24.948C466.294 24.948 466.049 25.0653 465.868 25.3C465.686 25.5293 465.596 25.8573 465.596 26.284C465.596 26.7053 465.686 27.0333 465.868 27.268C466.049 27.4973 466.294 27.612 466.604 27.612C467.043 27.612 467.33 27.4093 467.465 27.004H468.636C468.517 27.484 468.282 27.8653 467.93 28.148C467.579 28.4307 467.139 28.572 466.612 28.572C466.198 28.572 465.832 28.4787 465.511 28.292C465.19 28.1 464.94 27.8333 464.759 27.492C464.577 27.1453 464.487 26.7427 464.487 26.284ZM469.983 23.54C469.791 23.54 469.631 23.4787 469.502 23.356C469.378 23.228 469.316 23.0707 469.316 22.884C469.316 22.6973 469.378 22.5427 469.502 22.42C469.631 22.292 469.791 22.228 469.983 22.228C470.174 22.228 470.332 22.292 470.456 22.42C470.585 22.5427 470.65 22.6973 470.65 22.884C470.65 23.0707 470.585 23.228 470.456 23.356C470.332 23.4787 470.174 23.54 469.983 23.54ZM470.518 24.068V28.5H469.432V24.068H470.518ZM473.971 24.004C474.483 24.004 474.896 24.172 475.212 24.508C475.528 24.8387 475.685 25.3027 475.685 25.9V28.5H474.599V26.052C474.599 25.7 474.514 25.4307 474.343 25.244C474.172 25.052 473.94 24.956 473.645 24.956C473.345 24.956 473.108 25.052 472.931 25.244C472.761 25.4307 472.676 25.7 472.676 26.052V28.5H471.59V24.068H472.676V24.62C472.821 24.428 473.004 24.2787 473.226 24.172C473.454 24.06 473.702 24.004 473.971 24.004ZM478.4 23.996C478.721 23.996 479.003 24.0627 479.245 24.196C479.488 24.324 479.679 24.492 479.819 24.7V24.068H480.912V28.532C480.912 28.9427 480.833 29.308 480.672 29.628C480.512 29.9533 480.272 30.2093 479.951 30.396C479.631 30.588 479.243 30.684 478.788 30.684C478.178 30.684 477.677 30.5373 477.283 30.244C476.895 29.9507 476.676 29.5507 476.624 29.044H477.702C477.759 29.2467 477.88 29.4067 478.066 29.524C478.258 29.6467 478.488 29.708 478.757 29.708C479.073 29.708 479.328 29.6093 479.524 29.412C479.721 29.22 479.819 28.9267 479.819 28.532V27.844C479.679 28.052 479.486 28.2253 479.237 28.364C478.995 28.5027 478.716 28.572 478.4 28.572C478.038 28.572 477.708 28.476 477.407 28.284C477.108 28.092 476.87 27.8227 476.694 27.476C476.523 27.124 476.438 26.7213 476.438 26.268C476.438 25.82 476.523 25.4227 476.694 25.076C476.87 24.7293 477.105 24.4627 477.399 24.276C477.7 24.0893 478.033 23.996 478.4 23.996ZM479.819 26.284C479.819 26.012 479.768 25.78 479.664 25.588C479.561 25.3907 479.422 25.2413 479.245 25.14C479.07 25.0333 478.881 24.98 478.679 24.98C478.477 24.98 478.291 25.0307 478.121 25.132C477.95 25.2333 477.81 25.3827 477.702 25.58C477.599 25.772 477.547 26.0013 477.547 26.268C477.547 26.5347 477.599 26.7693 477.702 26.972C477.81 27.1693 477.95 27.3213 478.121 27.428C478.297 27.5347 478.483 27.588 478.679 27.588C478.881 27.588 479.07 27.5373 479.245 27.436C479.422 27.3293 479.561 27.18 479.664 26.988C479.768 26.7907 479.819 26.556 479.819 26.284Z" fill="white" />
                    <path id="media-text" fill-opacity={media ? "1" : "0"} d="M274.534 22.916V28.5H273.448V24.868L271.998 28.5H271.176L269.718 24.868V28.5H268.632V22.916H269.865L271.587 27.068L273.308 22.916H274.534ZM279.601 26.188C279.601 26.348 279.591 26.492 279.57 26.62H276.429C276.455 26.94 276.564 27.1907 276.755 27.372C276.946 27.5533 277.181 27.644 277.46 27.644C277.864 27.644 278.15 27.4653 278.321 27.108H279.492C279.368 27.5347 279.131 27.8867 278.779 28.164C278.428 28.436 277.995 28.572 277.484 28.572C277.071 28.572 276.698 28.4787 276.367 28.292C276.041 28.1 275.785 27.8307 275.599 27.484C275.419 27.1373 275.328 26.7373 275.328 26.284C275.328 25.8253 275.419 25.4227 275.599 25.076C275.78 24.7293 276.033 24.4627 276.359 24.276C276.685 24.0893 277.06 23.996 277.484 23.996C277.893 23.996 278.257 24.0867 278.577 24.268C278.903 24.4493 279.154 24.708 279.329 25.044C279.511 25.3747 279.601 25.756 279.601 26.188ZM278.476 25.868C278.471 25.58 278.371 25.3507 278.174 25.18C277.978 25.004 277.738 24.916 277.453 24.916C277.184 24.916 276.956 25.0013 276.77 25.172C276.59 25.3373 276.478 25.5693 276.437 25.868H278.476ZM280.114 26.268C280.114 25.82 280.2 25.4227 280.37 25.076C280.546 24.7293 280.783 24.4627 281.084 24.276C281.383 24.0893 281.717 23.996 282.084 23.996C282.363 23.996 282.629 24.06 282.883 24.188C283.136 24.3107 283.338 24.476 283.488 24.684V22.58H284.589V28.5H283.488V27.844C283.353 28.0627 283.164 28.2387 282.922 28.372C282.678 28.5053 282.396 28.572 282.076 28.572C281.714 28.572 281.383 28.476 281.084 28.284C280.783 28.092 280.546 27.8227 280.37 27.476C280.2 27.124 280.114 26.7213 280.114 26.268ZM283.496 26.284C283.496 26.012 283.443 25.78 283.341 25.588C283.237 25.3907 283.097 25.2413 282.922 25.14C282.745 25.0333 282.557 24.98 282.356 24.98C282.154 24.98 281.968 25.0307 281.797 25.132C281.627 25.2333 281.487 25.3827 281.379 25.58C281.275 25.772 281.223 26.0013 281.223 26.268C281.223 26.5347 281.275 26.7693 281.379 26.972C281.487 27.1693 281.627 27.3213 281.797 27.428C281.973 27.5347 282.159 27.588 282.356 27.588C282.557 27.588 282.745 27.5373 282.922 27.436C283.097 27.3293 283.237 27.18 283.341 26.988C283.443 26.7907 283.496 26.556 283.496 26.284ZM286.2 23.54C286.008 23.54 285.848 23.4787 285.719 23.356C285.595 23.228 285.533 23.0707 285.533 22.884C285.533 22.6973 285.595 22.5427 285.719 22.42C285.848 22.292 286.008 22.228 286.2 22.228C286.391 22.228 286.549 22.292 286.673 22.42C286.802 22.5427 286.867 22.6973 286.867 22.884C286.867 23.0707 286.802 23.228 286.673 23.356C286.549 23.4787 286.391 23.54 286.2 23.54ZM286.735 24.068V28.5H285.65V24.068H286.735ZM287.528 26.268C287.528 25.82 287.614 25.4227 287.784 25.076C287.961 24.7293 288.195 24.4627 288.49 24.276C288.79 24.0893 289.124 23.996 289.49 23.996C289.811 23.996 290.09 24.0627 290.328 24.196C290.571 24.3293 290.765 24.4973 290.91 24.7V24.068H292.003V28.5H290.91V27.852C290.77 28.06 290.576 28.2333 290.328 28.372C290.086 28.5053 289.803 28.572 289.483 28.572C289.121 28.572 288.79 28.476 288.49 28.284C288.195 28.092 287.961 27.8227 287.784 27.476C287.614 27.124 287.528 26.7213 287.528 26.268ZM290.91 26.284C290.91 26.012 290.858 25.78 290.754 25.588C290.652 25.3907 290.512 25.2413 290.336 25.14C290.16 25.0333 289.971 24.98 289.77 24.98C289.568 24.98 289.382 25.0307 289.211 25.132C289.041 25.2333 288.901 25.3827 288.792 25.58C288.69 25.772 288.637 26.0013 288.637 26.268C288.637 26.5347 288.69 26.7693 288.792 26.972C288.901 27.1693 289.041 27.3213 289.211 27.428C289.388 27.5347 289.574 27.588 289.77 27.588C289.971 27.588 290.16 27.5373 290.336 27.436C290.512 27.3293 290.652 27.18 290.754 26.988C290.858 26.7907 290.91 26.556 290.91 26.284Z" fill="white" />
                    <line className="transition-all ease-in-out delay-1000" x1="90" y1="44.5" y2="44.5" x2={(page === "product") ? 90 : (page === "media") ? 281 : (page === "price") ? 461 : (page === "tags") ? 655 : 90} stroke="white" strokeWidth="2" />

                </g>
                <defs>
                    <linearGradient id="paint0_linear_1_41" x1="0.545918" y1="43" x2="763.454" y2="43" gradientUnits="userSpaceOnUse">
                        <stop offset="0.9999" />
                        <stop offset="1" stop-color="#353535" />
                    </linearGradient>
                </defs>
            </svg>
        </div>
    );
}; // page attributes 'product', 'media', 'price', 'tags'



const ProductLayout = ({ productype, Body }: { productype: string, Body: ReactNode }) => {
    return (
        <div className={"w-[840px] h-fit mx-auto my-14 flex flex-col"}>
            <ProductProgressVector page={productype} />
            <div className={"w-[850px] h-[fit] px-4 absolute py-8 translate-y-16 border-[#00000021] shadow-lg rounded-lg border-[2px]"}>
                {Body}

            </div>
        </div>
    );
}

// Interface to define product data structure
interface ProductData {
    name: string;
    moq: string;
    preciseDescription: string;
    detailedDescription: string;
    category: string;
    hsnCode: string;
    productImage: string | null;
    testReports: string | null;
    price: string;
    sku: string;
    onSale: boolean;
    discount: string;
    salePrice: string;
    costOfGoods: string;
    profit: string;
    margin: string;
    tags: string[];
}

// Initialize empty product data
const initialProductData: ProductData = {
    name: '',
    moq: '',
    preciseDescription: '',
    detailedDescription: '',
    category: '',
    hsnCode: '',
    productImage: null,
    testReports: null,
    price: '',
    sku: '',
    onSale: false,
    discount: '',
    salePrice: '',
    costOfGoods: '',
    profit: '',
    margin: '',
    tags: []
};

const ProductInformation = ({ setPageNo, productData, setProductData }: ProductProps) => {
    return (
        <ProductLayout productype="product" Body={
            <div className="flex flex-col">
                <h1 className=" font-bold m-4 text-2xl">Product Information</h1>

                <div className="flex w-full">
                    <input 
                        placeholder="Name" 
                        className={"border-b-2 m-4 p-2 focus:outline-none w-full"} 
                        type="text" 
                        name="Name" 
                        id="Name" 
                        value={productData.name}
                        onChange={(e) => setProductData({...productData, name: e.target.value})}
                    />
                    <select 
                        className="w-full bg-transparent p-3 m-4 outline-none border-b-2 text-gray-800 placeholder-gray-400"
                        value={productData.moq}
                        onChange={(e) => setProductData({...productData, moq: e.target.value})}
                    >
                        <option className=" font-extralight" disabled value="">MOQ</option>
                        <option>100 KG</option>
                        <option>200 KG</option>
                        <option>500 KG</option>
                    </select>
                </div>

                <div className="flex ">

                    <div id="description" className="flex flex-col mx-4">
                        <h1 className="font-semibold text-md m-4">Description</h1>
                        <input 
                            placeholder="Precise description" 
                            className="px-2 py-4 border-x border-t focus:outline-none border-[#00000053] rounded-tl-lg rounded-tr-lg" 
                            type="text" 
                            name="precise-description" 
                            id="precise-description" 
                            value={productData.preciseDescription}
                            onChange={(e) => setProductData({...productData, preciseDescription: e.target.value})}
                        />
                        <textarea 
                            placeholder="Detailed Description" 
                            className="px-2 py-2 w-[25vw] h-[20vh] focus:outline-none border-[#00000053] border-x border-y rounded-bl-lg rounded-br-lg" 
                            name="Detailed-Description" 
                            id="Detailed-Description"
                            value={productData.detailedDescription}
                            onChange={(e) => setProductData({...productData, detailedDescription: e.target.value})}
                        />
                    </div>

                    <div className="mx-4 flex w-full flex-col" id="Category-hsn">
                        <h1 className="font-semibold text-md m-4">Category</h1>
                        <select 
                            className="bg-transparent p-3 border-b-2 my-4 mx-2" 
                            id="Product-Categories"
                            value={productData.category}
                            onChange={(e) => setProductData({...productData, category: e.target.value})}
                        >
                            <option value="">Select Category</option>
                            <option>Oils</option>
                            <option>dummy-1</option>
                            <option>dummy-2</option>
                        </select>

                        <h1 className="font-semibold text-md m-4">HSN Code:</h1>
                        <input 
                            className="focus:outline-none border-b-2 p-2 mx-2" 
                            placeholder="xxxxxxx" 
                            type="text"
                            value={productData.hsnCode}
                            onChange={(e) => setProductData({...productData, hsnCode: e.target.value})}
                        />
                    </div>

                </div>

                <button onClick={() => setPageNo(1)} className={" bg-gradient-to-r from-[#000000] to-[#353535D9] text-white px-8 py-1 rounded-md ml-auto w-fit"}>Next</button>
            </div>
        } />
    );
};


const Media = ({ setPageNo, productData, setProductData }: ProductProps) => {
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, fileType: 'productImage' | 'testReports') => {
        const file = event.target.files?.[0];
        if (file) {
            // Convert the file to base64 for storage
            const reader = new FileReader();
            reader.onloadend = () => {
                setProductData({
                    ...productData,
                    [fileType]: reader.result as string
                });
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div>
            <ProductLayout productype="media" Body={
                <div className="flex flex-col px-4 py-2">
                    <h1 className=" font-bold m-4 text-2xl">Media</h1>
                    <div id="product-image" className="mb-4">
                        <p className="mb-2">Product Image</p>
                        <input 
                            type="file" 
                            onChange={(e) => handleFileChange(e, 'productImage')}
                        />
                        {productData.productImage && (
                            <div className="mt-2">
                                <p>Image Preview:</p>
                                <img 
                                    src={productData.productImage} 
                                    alt="Product preview" 
                                    className="max-w-xs max-h-40 mt-2"
                                />
                            </div>
                        )}
                    </div>
                    <div id="test-reports" className="mb-4">
                        <p className="mb-2">Test Report Files</p>
                        <input 
                            type="file" 
                            onChange={(e) => handleFileChange(e, 'testReports')}
                        />
                        {productData.testReports && (
                            <p className="mt-2">Test report uploaded</p>
                        )}
                    </div>
                    <div className="h-fit w-full flex mt-6">
                        <button onClick={() => { setPageNo(0) }} className={" bg-gradient-to-r from-[#000000] to-[#353535D9] text-white px-8 py-1 rounded-md  w-fit"}>Prev</button>
                        <button onClick={() => { setPageNo(2) }} className={" bg-gradient-to-r from-[#000000] to-[#353535D9] text-white px-8 py-1 rounded-md ml-auto w-fit"}>Next</button>
                    </div>

                </div>

            } />
        </div>
    );
}

const Price = ({ setPageNo, productData, setProductData }: ProductProps) => {
    const handleOnSaleToggle = () => {
        setProductData({...productData, onSale: !productData.onSale});
    };

    return (
        <ProductLayout productype="price" Body={
            <div>
                <h1 className=" font-bold m-4 text-2xl">Price</h1>

                <div className="grid grid-cols-3 gap-2 price-container">
                    {/* first row  */}
                    <input 
                        placeholder="Price" 
                        type="text"
                        value={productData.price} 
                        onChange={(e) => setProductData({...productData, price: e.target.value})}
                    />
                    <select className="min-w-[150px] bg-transparent">
                        {/* <option value="option-1">Options</option> */}
                    </select>
                    <input 
                        placeholder="SKU" 
                        type="text"
                        value={productData.sku}
                        onChange={(e) => setProductData({...productData, sku: e.target.value})}
                    />


                    {/* second row */}
                    <div className="col-span-3 ml-6 flex">
                        <div onClick={handleOnSaleToggle}>
                            <Togglebutton isActive={productData.onSale} />
                        </div>
                        <span className="my-auto mx-3">On Sale</span>
                    </div>


                    {/* third row */}
                    <input 
                        type="text" 
                        placeholder="Discount"
                        value={productData.discount}
                        onChange={(e) => setProductData({...productData, discount: e.target.value})}
                    />
                    <div className="col-span-2">
                        <input 
                            type="text" 
                            placeholder="Sale price"
                            value={productData.salePrice}
                            onChange={(e) => setProductData({...productData, salePrice: e.target.value})}
                        />
                    </div>


                    {/* Fourth row */}
                    <input 
                        type="text" 
                        placeholder="Cost of goods"
                        value={productData.costOfGoods}
                        onChange={(e) => setProductData({...productData, costOfGoods: e.target.value})}
                    />
                    <input 
                        type="text" 
                        placeholder="profit"
                        value={productData.profit}
                        onChange={(e) => setProductData({...productData, profit: e.target.value})}
                    />
                    <div className="flex">
                        <svg className="my-auto" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <g className="inline" opacity="0.5">
                                <path d="M5.5 17C5.08334 17 4.72934 16.8543 4.438 16.563C4.14667 16.2717 4.00067 15.9173 4 15.5C3.99934 15.0827 4.14534 14.7287 4.438 14.438C4.73067 14.1473 5.08467 14.0013 5.5 14H18.5C18.9167 14 19.271 14.146 19.563 14.438C19.855 14.73 20.0007 15.084 20 15.5C19.9993 15.916 19.8537 16.2703 19.563 16.563C19.2723 16.8557 18.918 17.0013 18.5 17H5.5ZM5.5 10C5.08334 10 4.72934 9.85433 4.438 9.563C4.14667 9.27167 4.00067 8.91733 4 8.5C3.99934 8.08267 4.14534 7.72867 4.438 7.438C4.73067 7.14733 5.08467 7.00133 5.5 7H18.5C18.9167 7 19.271 7.146 19.563 7.438C19.855 7.73 20.0007 8.084 20 8.5C19.9993 8.916 19.8537 9.27033 19.563 9.563C19.2723 9.85567 18.918 10.0013 18.5 10H5.5Z" fill="black" />
                            </g>
                        </svg>
                        <input className="w-full" type="text" placeholder="Margin" />
                    </div>

                </div>

                <div id="next-prev-btn-div" className="h-fit w-full flex mt-6">
                    <button onClick={() => { setPageNo(1) }} className={" bg-gradient-to-r from-[#000000] to-[#353535D9] text-white px-8 py-1 rounded-md  w-fit"}>Prev</button>
                    <button onClick={() => { setPageNo(3) }} className={" bg-gradient-to-r from-[#000000] to-[#353535D9] text-white px-8 py-1 rounded-md ml-auto w-fit"}>Next</button>
                </div>
            </div>
        } />
    );
}

const Tags = ({ setPageNo, productData, setProductData, saveProduct }: ProductProps) => {
    const [tag, setTag] = useState('');

    const addTag = () => {
        if (tag.trim() !== '') {
            setProductData({
                ...productData,
                tags: [...productData.tags, tag.trim()]
            });
            setTag('');
        }
    };

    const removeTag = (indexToRemove: number) => {
        setProductData({
            ...productData,
            tags: productData.tags.filter((_, index) => index !== indexToRemove)
        });
    };

    return (
        <ProductLayout productype="tags" Body={
            <div>
                <h1 className={"font-bold m-4 text-2xl"}>Tags</h1>
                <div className="p-4">
                    <div className="flex items-center mb-4">
                        <input 
                            type="text" 
                            placeholder="Add a tag"
                            className="border p-2 rounded-l-md focus:outline-none flex-grow"
                            value={tag}
                            onChange={(e) => setTag(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && addTag()}
                        />
                        <button 
                            onClick={addTag}
                            className="bg-gray-800 text-white p-2 rounded-r-md"
                        >
                            Add
                        </button>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-6">
                        {productData.tags.map((tag, index) => (
                            <div key={index} className="bg-gray-200 px-3 py-1 rounded-full flex items-center">
                                <span>{tag}</span>
                                <button 
                                    onClick={() => removeTag(index)} 
                                    className="ml-2 text-gray-600 hover:text-red-500"
                                >
                                    &times;
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="h-fit w-full flex mt-6">
                    <button onClick={() => { setPageNo(2) }} className={" bg-gradient-to-r from-[#000000] to-[#353535D9] text-white px-8 py-1 rounded-md  w-fit"}>Prev</button>
                    <button 
                        onClick={saveProduct} 
                        className={" bg-gradient-to-r from-[#000000] to-[#353535D9] text-white px-8 py-1 rounded-md ml-auto w-fit"}
                    >
                        Save Product
                    </button>
                </div>
            </div>

        } />
    );
}

type ProductProps = {
    setPageNo: (pageNo: number) => void;
    productData: ProductData;
    setProductData: React.Dispatch<React.SetStateAction<ProductData>>;
    saveProduct?: () => void;
};

function AddProduct() {
    const [page_no, setpage] = useState(0); // 0: Product Information, 1: Media, 2: Price, 3: Tags "active page"
    const [productData, setProductData] = useState<ProductData>(() => {
        // Try to load saved data from localStorage
        const savedData = localStorage.getItem('productFormData');
        return savedData ? JSON.parse(savedData) : initialProductData;
    });
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [saveError, setSaveError] = useState('');

    // Save form data to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem('productFormData', JSON.stringify(productData));
    }, [productData]);

    const saveProduct = async () => {
        try {
            setIsSaving(true);
            setSaveError('');
            
            // Convert string values to appropriate types for backend
            const productToSave = {
                ...productData,
                price: productData.price ? parseFloat(productData.price) : 0,
                discount: productData.discount ? parseFloat(productData.discount) : 0,
                salePrice: productData.salePrice ? parseFloat(productData.salePrice) : 0,
                costOfGoods: productData.costOfGoods ? parseFloat(productData.costOfGoods) : 0,
                profit: productData.profit ? parseFloat(productData.profit) : 0,
                margin: productData.margin ? parseFloat(productData.margin) : 0,
            };
            
            // Save to backend
            const response = await apiService.products.create(productToSave);
            
            // Clear local storage after successful save
            localStorage.removeItem('productFormData');
            
            // Reset form
            setProductData(initialProductData);
            setpage(0);
            
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
        } catch (error) {
            console.error('Error saving product:', error);
            setSaveError('Failed to save product. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    let Product_pages: JSX.Element[] = [
        <ProductInformation setPageNo={setpage} productData={productData} setProductData={setProductData} />,
        <Media setPageNo={setpage} productData={productData} setProductData={setProductData} />,
        <Price setPageNo={setpage} productData={productData} setProductData={setProductData} />,
        <Tags setPageNo={setpage} productData={productData} setProductData={setProductData} saveProduct={saveProduct} />
    ];

    return (
        <>
            {saveSuccess && (
                <div className="fixed top-5 right-5 bg-green-500 text-white px-4 py-2 rounded shadow-lg z-50">
                    Product saved successfully!
                </div>
            )}
            
            {saveError && (
                <div className="fixed top-5 right-5 bg-red-500 text-white px-4 py-2 rounded shadow-lg z-50">
                    {saveError}
                </div>
            )}
            
            {isSaving && (
                <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center bg-black bg-opacity-50 z-50">
                    <div className="bg-white p-5 rounded-lg">
                        <p className="text-xl">Saving product...</p>
                    </div>
                </div>
            )}
            
            {Product_pages[page_no]}
        </>
    );
}

const Inventory = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                setLoading(true);
                const response = await apiService.products.getAll();
                setProducts(response.data);
            } catch (error) {
                console.error('Error fetching products:', error);
                setError('Failed to load products. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, []);

    return (
        <div className="flex flex-col w-[80%] h-fit mx-auto my-14 shadow-lg rounded-lg border-[#00000021] border-[2px] p-8">
            <div className="flex justify-between items-center">
                <div><h1 className="font-bold text-2xl">All Products</h1><p className="text-[#00000048]">Check whether the things are thier or not </p></div>
                <div>
                    <button className="mx-3 bg-gradient-to-r from-[#000000] to-[#353535D9] text-white px-8 py-2 rounded-md w-fit">New Product</button>
                    <button className="mx-3 border-[1px] text-blue-500 border-blue-500 px-8 py-2 rounded-md w-fit">Import CSV File</button>
                    <button className="mx-3 border-[1px] text-blue-500 border-blue-500 px-8 py-2 rounded-md w-fit">Export CSV File</button>
                </div>
            </div>

            <div className="flex items-center space-x-2 m-8">
                <select className="border rounded-md px-3 py-1 focus:outline-none">
                    <option value="5">5</option>
                    <option value="10">10</option>
                    <option value="25">25</option>
                    <option value="50">50</option>
                </select>
                <span className="text-gray-500">entries per page</span>
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-40">
                    <p>Loading products...</p>
                </div>
            ) : error ? (
                <div className="flex justify-center items-center h-40 text-red-500">
                    <p>{error}</p>
                </div>
            ) : (
                <div className="overflow-x-auto my-8">
                    <table className="min-w-full table-auto">
                        <thead>
                            <tr className="bg-gray-100 text-gray-600 uppercase text-sm leading-normal">
                                <th className="py-3 px-6 text-left">Product</th>
                                <th className="py-3 px-6 text-left">Category</th>
                                <th className="py-3 px-6 text-left">Price</th>
                                <th className="py-3 px-6 text-left">SKU</th>
                                <th className="py-3 px-6 text-left">Quantity</th>
                                <th className="py-3 px-6 text-left">Status</th>
                                <th className="py-3 px-6 text-left">Action</th>
                            </tr>
                        </thead>
                        <tbody className="text-gray-600 text-sm font-light">
                            {products.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="py-6 text-center">No products found</td>
                                </tr>
                            ) : (
                                products.map((product: any) => (
                                    <tr key={product.id} className="border-b border-gray-200 hover:bg-gray-100">
                                        <td className="py-6 px-6 text-left">
                                            <input type="checkbox" className="form-checkbox" />
                                            {product.name}
                                        </td>
                                        <td className="py-6 px-6 text-left">{product.category || '-'}</td>
                                        <td className="py-6 px-6 text-left">${product.price}</td>
                                        <td className="py-6 px-6 text-left">{product.sku || '-'}</td>
                                        <td className="py-6 px-6 text-left">0</td>
                                        <td className="py-6 px-6 text-left">
                                            <span className={`${product.onSale ? 'bg-green-200 text-green-800' : 'bg-red-300 text-red-800'} py-1 px-3 rounded-full text-xs`}>
                                                {product.onSale ? 'In Stock' : 'Out of Stock'}
                                            </span>
                                        </td>
                                        <td className="py-6 px-6 text-left">
                                            <button className="text-blue-500 hover:underline">Edit</button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};
export { AddProduct, Inventory };