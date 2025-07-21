import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import banner1 from "../assets/banner.svg"
// import banner2 from "../assets/banner.svg"



const images = [
  banner1,
  // banner2,
  // banner3,
  // banner4,
  // banner5,
  // banner6,
  // banner7,
];

const Banner: React.FC = () => {
  const [current, setCurrent] = useState(0);

  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     setCurrent((prev) => (prev + 1) % images.length);
  //   }, 5000); // 5 sec change

  //   return () => clearInterval(interval);
  // }, []);

  return (
    <div className="relative w-full h-64 overflow-hidden rounded-2xl shadow-md">
      <div className="absolute w-full h-full flex">
        <AnimatePresence>
          <motion.img
            key={images[current]}
            src={images[current]}
            alt="Banner Image"
            className="w-full h-full object-cover"
            // initial={{ x: "100%" }} // Slide in from the right
            // animate={{ x: 0 }} // Slide to the center
            // exit={{ x: "-100%" }} // Slide out to the left
            // transition={{ duration: 0.8 }}
          />
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Banner;
