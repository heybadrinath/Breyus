import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import banner1 from "../../../public/assets/banner.svg";

const images = [
    banner1,
    banner1,
    banner1,
    banner1,
    banner1,
    banner1,
    banner1,
];

const Banner: React.FC = () => {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % images.length);
    }, 5000); // 5 sec change

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full h-64 overflow-hidden rounded-2xl shadow-md">
      <AnimatePresence mode="wait">
        <motion.img
          key={images[current]}
          src={images[current]}
          alt="Banner Image"
          className="absolute w-full h-full object-cover"
          initial={{ x: "100%", opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: "-100%", opacity: 0 }}
          transition={{ duration: 0.8 }}
        />
      </AnimatePresence>
    </div>
  );
};

export default Banner;