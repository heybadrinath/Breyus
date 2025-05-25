import React, { ReactNode, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";


// Section-3 Image imports 
import BreyusLogo from "./seller/vectors/full-logo.svg";
import LaptopHero from "./assets/laptop-hero.svg";
import PersonalisedAnalysisImg from "./assets/section-3/personalised-analysis.svg"
import IntegratedDashboardImg from "./assets/section-3/integrated-dashboard.svg"
import SeamlessIncotermsImg from "./assets/section-3/seamless-incoterms.svg"
import AutomatedDocumentationImg from "./assets/section-3/Automated-documentation.svg"
import SecuredTradeDealsImg from "./assets/section-3/secured-trade-deals.svg"
import SecureSettlementSystemImg from "./assets/section-3/secure-settlements-system.svg"


const Navbar = () => (
    <div className="border-b border-gray-200 px-2 py-2 flex">
        <div id="logo" className="my-auto">
            <img className="h-auto w-[180px]" src={BreyusLogo} alt="Breyus" />
        </div>
        <div id="nav" className="flex w-fit justify-between my-auto mx-auto font-[500] xl:text-lg lg:text-md md:text-sm">
            <Link className="mx-4 text-black my-auto" to={'/'}>Features</Link>
            <Link className="mx-4 text-black my-auto" to={'/'}>Testimonials</Link>
            <Link className="mx-4 text-black my-auto" to={'/'}>Schedule</Link>
            <Link className="mx-4 text-black my-auto" to={'/'}>Contact Us</Link>
        </div>
        <div id="login-signup-btn" className="flex">
            <Button className=" md:text-sm md:px-6">Sign Up</Button>
            <Button className='bg-black text-white lg:text-sm md:px-6'>Login In</Button>
        </div>

    </div>
);

const Section3 = () => {
    const [xOffset, setXOffset] = useState("95%");

  useEffect(() => {
    const updateOffset = () => {
      const width = window.innerWidth;
      if (width < 1400) setXOffset("55%");
      else if (width < 1587) setXOffset("70%");
      else if(width <1675) setXOffset("80%")
      else setXOffset("95%");
      
    };
    updateOffset();
    window.addEventListener("resize", updateOffset);
    return () => window.removeEventListener("resize", updateOffset);
  }, []);
    return(
    <BorderBox className="">
        <div className="flex h-fit relative w-full overflow-x-hidden">
            <div id="left-content" className=" w-fit mx-20 my-20">
                <h1 className="text-5xl font-extrabold">
                    <span>Unlock Efficiency with</span>
                    <br/>
                    <span className="text-[#867C5B]">Intelligent Automation.</span>
                    </h1>
                <Section3Content icons={PersonalisedAnalysisImg} heading="Personalised Analysis." paragraph="Smart insights tailored to your trade data."/>
                <Section3Content icons={IntegratedDashboardImg} heading="Integrated Dashboard." paragraph="All your operations. One clear view."/>
                <Section3Content icons={SeamlessIncotermsImg} heading="Seamless Incoterms." paragraph="Auto-mapped Incoterms for smooth global deals."/>
                <Section3Content icons={AutomatedDocumentationImg} heading="Automated Documentation." paragraph="Instant, error-free document generation."/>
                <Section3Content icons={SecuredTradeDealsImg} heading="Secured Trade Deals." paragraph="AI-backed security for every transaction."/>
                <Section3Content icons={SecureSettlementSystemImg} heading="Secured Settlement System." paragraph="Fast, protected, and reliable settlements."/>

            </div>

            <motion.div
            initial={{ x: "100%", opacity: 0 }}
            whileInView={{ x: xOffset, opacity: 1 }}
            viewport={{once: true}}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="w-[fit] absolute z-[-2]">
            <img className="w-auto h-[800px] object-contain z-[-3]" src={LaptopHero} alt="" />
        </motion.div>
        </div>
        
    </BorderBox>
);
}

export default () => (
    <div>
        <Navbar />
        <div className="h-screen">.</div>
        <Section3 />
    </div>
);









// components for hero

type ButtonProps = {
    onClick?: () => void;
    className?: string;
    children: ReactNode;
};

type BorderBoxProps = {
    children: ReactNode;
    className?: string;
}
type Section3ContentProps = {
    icons?: string;
    heading?: string;
    paragraph?: string;
}

const Button: React.FC<ButtonProps> = ({ onClick, className = '', children }) => (
    <button onClick={() => onClick}
        className={`${className} px-12 py-3 mx-6 my-2 border-gray-300 border rounded-xl font-semibold`}>
        {children}
    </button>
);

const BorderBox: React.FC<BorderBoxProps> = ({ className = '', children }) => (
    <div className={`w-full border-t border-b flex border-dashed border-gray-400 ${className}`}>
        <div className="mx-20  border-l border-r border-dashed w-full border-gray-400 flex">
            {children}
        </div>
    </div>
)

const Section3Content: React.FC<Section3ContentProps> = ({heading, paragraph, icons= ''}) => (
    <div className="flex my-6">
        <img src={icons} className="mb-auto m-2" alt="" />
        <p className="px-3 w-[400px] text-2xl"><span className="text-black font-bold">{heading}</span> <span className="text-[#696969]">{paragraph}</span></p>
    </div>
)

