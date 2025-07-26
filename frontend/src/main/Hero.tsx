import React, { ReactNode, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

// section-1 image imports
import NovalLogo from "../assets/noval_logo.svg";


// Section-3 Image imports 
import BreyusLogo from "../assets/Logos/full-logo.svg";
import LaptopHero from "../assets/laptop-hero.svg";
import PersonalisedAnalysisImg from "../assets/section-3/personalised-analysis.svg"
import IntegratedDashboardImg from "../assets/section-3/integrated-dashboard.svg"
import SeamlessIncotermsImg from "../assets/section-3/seamless-incoterms.svg"
import AutomatedDocumentationImg from "../assets/section-3/Automated-documentation.svg"
import SecuredTradeDealsImg from "../assets/section-3/secured-trade-deals.svg"
import SecureSettlementSystemImg from "../assets/section-3/secure-settlements-system.svg"

// Section-4 Image imports
import TotalTradeVolume from "../assets/section-4/Total-Trade-Volume.svg";
import TradeDataTrained from "../assets/section-4/Trade-Data-Trained.svg";
import TraderTradeEfficiency from "../assets/section-4/Trader-Trade-Efficiency.svg";
import TraderTradeGrowth from "../assets/section-4/Trader-Trade-Growth.svg";
import worldmap from "../assets/worldmap.svg";

const Navbar = () => {
    const navigate = useNavigate();
    return (
        <div className="border-b border-gray-200 px-2 py-2 flex">
            <div id="logo" className="my-auto">
                <img className="h-auto w-[180px]" src={BreyusLogo} alt="Breyus" />
            </div>
            <div id="nav" className="flex w-fit justify-between my-auto mx-auto font-[500] xl:text-lg lg:text-md md:text-sm">
                <a className="mx-4 text-black my-auto" href="#features">Features</a>
                <a className="mx-4 text-black my-auto" href='#impact'>Impact</a>
                <Link className="mx-4 text-black my-auto" to={'https://calendly.com/breyuscrew/30min'}>Schedule</Link>
                <a className="mx-4 text-black my-auto" href="#contact-us">Contact Us</a>
            </div>
            <div id="login-signup-btn" className="flex">
                <Button onClick={() => navigate("/onboarding")} className=" md:text-sm md:px-6">Sign Up</Button>
                <Button onClick={() => navigate("/login")} className='bg-black text-white lg:text-sm md:px-6'>Sign In</Button>

                {/* Temp buttons for signin and signup
                 <Button onClick={() => navigate("/seller/signup")} className=" md:text-sm md:px-6">Sign Up</Button>
                 <Button onClick={() => navigate("/buyer/signin")} className='bg-black text-white lg:text-sm md:px-6'>Buyer Login In</Button>
                 <Button onClick={() => navigate("/seller/signin")} className='bg-black text-white lg:text-sm md:px-6'>Seller Login In</Button> */}
            </div>

        </div>
    )
};


const Section1 = () => {
    const navigate = useNavigate();
    return (
        
        <BorderBox className="border-t-0">
            <div className="w-full flex flex-col">
                <div id="top" className="my-18">
                    <h1 className="mx-auto my-2 w-[50vw] text-center font-extrabold text-6xl">Connecting Commodities via AI, Globally</h1>
                    <p className="w-fit mx-auto my-2 text-2xl text-[#ACACAC]">Explore The Unborn Path Unfazed with Breyus</p>
                    <Section1Temp />
                </div>

                <div id="bottom-btns" className="flex mx-auto">
                    <Button onClick={() => navigate("/onboarding")} className="!border-black border-2">Get Started</Button>
                    <Button onClick={() => window.location.href='https://calendly.com/breyuscrew/30min'} className="bg-black text-white">Schedule Now</Button>
                </div>
                <div className="flex mx-auto mt-24 mb-16 flex-col">
                    <h1 className="text-3xl font-light"><span className="font-extrabold text-[#867C5B]">Trusted by</span> Global Trader of Sustainable Commodities <span className="font-extrabold text-black">Noval India.</span></h1>
                    <img className="w-44 mx-auto my-4" src={NovalLogo} alt="" />
                    
                </div>

            </div>

        </BorderBox>
    );
};


const Section2 = () => {

    return (
        <BorderBox className="flex">
            <div id="features" className="mx-auto w-fit">
                <Section2Temp />
            </div>
            <div id="content" className="flex flex-col m-4 ml-auto w-fit">
                <h1 className="text-5xl font-extrabold">
                    <span>You ask. We trade.</span>
                    <br />
                    <span className="text-[#867C5B]">All powered by AI.</span>
                </h1>
                <Section3Content className="!text-xl !w-[550px]" icons={PersonalisedAnalysisImg} heading="Prompt-based matching." paragraph="Describe what you want in plain English. Our AI finds the best trades instantly." />
                <Section3Content className="!text-xl !w-[550px]" icons={PersonalisedAnalysisImg} heading="Personalised picks." paragraph="Every suggestion is tuned to your goals, trading style, and risk level." />
                <div className="border-dashed border m-3 rounded-xl border-gray-500 relative">
                    <div className="flex px-3 py-2 bg-black text-white w-fit rounded-xl text-[10px] absolute -top-3 h-fit right-10">upcoming</div>

                    <Section3Content className="!text-xl !w-[550px]" icons={''} heading="Ai Driven Real-time insights." paragraph="Stay a step ahead with live market trends, curated and explained by AI." />
                    <Section3Content className="!text-xl !w-[550px]" icons={''} heading="Real-time insights." paragraph="Stay a step ahead with live market trends, curated and explained by AI." />
                </div>


            </div>

        </BorderBox>
    );
}


const Section3 = () => {
    const [xOffset, setXOffset] = useState("95%");

    useEffect(() => {
        const updateOffset = () => {
            const width = window.innerWidth;
            if (width < 1400) setXOffset("55%");
            else if (width < 1587) setXOffset("70%");
            else if (width < 1675) setXOffset("80%")
            else setXOffset("95%");

        };
        updateOffset();
        window.addEventListener("resize", updateOffset);
        return () => window.removeEventListener("resize", updateOffset);
    }, []);
    return (
        <BorderBox className="">
            <div className="flex h-fit relative w-full overflow-x-hidden">
                <div id="left-content" className=" w-fit mx-20 my-20">
                    <h1 className="text-5xl font-extrabold">
                        <span>Unlock Efficiency with</span>
                        <br />
                        <span className="text-[#867C5B]">Intelligent Automation.</span>
                    </h1>
                    <Section3Content icons={PersonalisedAnalysisImg} heading="Personalised Analysis." paragraph="Smart insights tailored to your trade data." />
                    <Section3Content icons={IntegratedDashboardImg} heading="Integrated Dashboard." paragraph="All your operations. One clear view." />
                    <Section3Content icons={SeamlessIncotermsImg} heading="Seamless Incoterms." paragraph="Auto-mapped Incoterms for smooth global deals." />
                    <Section3Content icons={AutomatedDocumentationImg} heading="Automated Documentation." paragraph="Instant, error-free document generation." />
                    <Section3Content icons={SecuredTradeDealsImg} heading="Secured Trade Deals." paragraph="AI-backed security for every transaction." />
                    <Section3Content icons={SecureSettlementSystemImg} heading="Secured Settlement System." paragraph="Fast, protected, and reliable settlements." />

                </div>

                <motion.div
                    initial={{ x: "120%", opacity: 0 }}
                    whileInView={{ x: xOffset, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className="w-[fit] absolute z-[-2]">
                    <img className="w-auto h-[800px] object-contain z-[-3]" src={LaptopHero} alt="" />
                </motion.div>
            </div>

        </BorderBox>
    );
}

const Section4 = () => {
    
    return (
        <BorderBox className='bg-no-repeat bg-cover bg-center' style={{ backgroundImage: `url(${worldmap})` }}>
            <div id="impact" className="w-fit mx-auto flex flex-col h-[80vh]">
                <div className="flex mx-auto">
                    <h1 className="text-4xl font-extrabold mb-24 mt-24">
                        The 4 Ts That Drive <span className="text-[#867C5B] font-extrabold">Global Trade Forward.</span>
                    </h1>
                </div>

                {/* Bottom section  */}
                <div className="flex">
                    {/* Trade growth metrics */}
                    <div className="flex flex-col gap-2 w-[340px] p-6  rounded-xl">
                        <img className="w-[60px] h-auto" alt="" src={TraderTradeGrowth} />
                        <div className="flex items-center gap-2">
                            <span className="text-4xl font-extrabold text-black">100%</span>
                            <svg width="24" height="24" className="inline-block" viewBox="0 0 24 24" fill="none">
                                <path d="M12 19V5M12 5L7 10M12 5L17 10" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                        <div>
                            <span className="text-lg font-medium text-black">TRADER <span className="font-extrabold">TRADE GROWTH.</span></span>
                        </div>
                        <div className="text-base text-black/80 leading-snug">
                            Growth in traders trade<br />
                            volume through <span className="font-extrabold text-[#867C5B]">BREYUS</span>
                        </div>
                    </div>

                    {/* Trade efficiency metrics */}
                    <div className="flex flex-col gap-2 w-[340px] p-6 rounded-xl">
                        <img className="w-[60px] h-auto" alt="" src={TraderTradeEfficiency} />
                        <div className="flex items-center gap-2">
                            <span className="text-4xl font-extrabold text-black">10%</span>
                            <svg width="24" height="24" className="inline-block" viewBox="0 0 24 24" fill="none">
                                <path d="M12 19V5M12 5L7 10M12 5L17 10" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                        <div>
                            <span className="text-lg font-medium text-black">TRADER <span className="font-extrabold">TRADE EFFICIENCY.</span></span>
                        </div>
                        <div className="text-base text-black/80 leading-snug">
                            Growth in traders trade<br />
                            volume through <span className="font-extrabold text-[#867C5B]">BREYUS</span>
                        </div>
                    </div>

                    {/* Trade volume metrics */}
                    <div className="flex flex-col gap-2 w-[340px] p-6  rounded-xl">
                        <img className="w-[60px] h-auto" alt="" src={TotalTradeVolume} />
                        <div className="flex items-center gap-2">
                            <span className="text-4xl font-extrabold text-black">100+</span>
                            <svg width="24" height="24" className="inline-block" viewBox="0 0 24 24" fill="none">
                                <path d="M12 19V5M12 5L7 10M12 5L17 10" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                        <div>
                            <span className="text-lg font-medium text-black">TOTAL <span className="font-extrabold">TRADE VOLUME.</span></span>
                        </div>
                        <div className="text-base text-black/80 leading-snug">
                            Aggregate value of executed <br />
                            trades in <span className="font-extrabold text-[#867C5B]">BREYUS</span>
                        </div>
                    </div>

                    {/* Trade Data Trained metrics */}
                    <div className="flex flex-col gap-2 w-[340px] p-6 rounded-xl">
                        <img className="w-[60px] h-auto" alt="" src={TradeDataTrained} />
                        <div className="flex items-center gap-2">
                            <span className="text-4xl font-extrabold text-black">3.5 Lakhs+</span>
                            <svg width="24" height="24" className="inline-block" viewBox="0 0 24 24" fill="none">
                                <path d="M12 19V5M12 5L7 10M12 5L17 10" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                        <div>
                            <span className="text-lg font-medium text-black">TRADER <span className="font-extrabold"> DATA TRAINED.</span></span>
                        </div>
                        <div className="text-base text-black/80 leading-snug">
                            Total number of trade data's <br />
                            trained to <span className="font-extrabold text-[#867C5B]">BREYUS</span>
                        </div>
                    </div>
                </div>

            </div>
        </BorderBox>
    );
}



const Section5 = () => {
    const year = new Date().getFullYear();
    return (
        <BorderBox>
            <div id={"contact-us"} className="h-[fit] my-16 w-full">
                <div className="bg-[#2c2727] w-[50vw] h-[fit] py-12 rounded-xl mx-auto my-auto flex flex-col">
                    <h1 className="text-white mx-auto my-10 text-3xl font-extrabold">Understand Breyus Better!</h1>
                    <div className="flex items-center bg-white rounded-full p-1 w-full max-w-xl mx-auto">
                        <input
                            type="email"
                            placeholder="What’s Your Work Email ?"
                            className="flex-1 bg-transparent text-gray-500 placeholder-gray-400 px-4 py-3 rounded-xl focus:outline-none mx-auto"
                        />
                        <button className="bg-black text-white font-medium px-6 py-3 rounded-full hover:bg-gray-900 transition">
                            See Demo
                        </button>
                    </div>
                    <p className="text-center mt-8 text-white">We care about your data. Read our <span className="text-[#0076D3]">privacy policy.</span></p>
                </div>

                <footer className="font-semibold mx-auto flex flex-col w-fit mt-32 mb-8">
                    <div className="flex">
                        <Link className="mx-5 my-2" to={'/'}>Privacy Policy</Link>
                        <Link className="mx-5 my-2" to={'/'}>Terms of Use</Link>
                        <Link className="mx-5 my-2" to={'/'}>Trust</Link>
                    </div>
                    <div className="flex mx-auto my-2">
                        &copy; {`${year}`} Breyus All rights Reserved
                    </div>
                </footer>

            </div>

        </BorderBox>
    );
}



const Hero = () => (
    <div className=" !scroll-smooth">
        <Navbar />
        <Section1 />
        <Section2 />
        <Section3 />
        <Section4 />
        <Section5 />
    </div>
);

export default Hero;









// components for hero

type ButtonProps = {
    onClick?: () => void;
    className?: string;
    children: ReactNode;
};

type BorderBoxProps = {
    children: ReactNode;
    className?: string;
    style?: React.CSSProperties;
}
type Section3ContentProps = {
    icons?: string;
    heading?: string;
    paragraph?: string;
    className?: string;
}

const Button: React.FC<ButtonProps> = ({ onClick, className = '', children }) => (
    <button onClick={onClick}
        className={`${className} px-12 py-3 mx-6 my-2 border-gray-300 border rounded-xl font-semibold transition-all hover:scale-105`}>
        {children}
    </button>
);

const BorderBox: React.FC<BorderBoxProps> = ({ className = '', children, style }) => (
    <div className={`w-full border-t border-b flex border-dashed border-gray-400 ${className}`}>
        <div className="mx-20  border-l border-r border-dashed w-full border-gray-400 flex" style={style}>
            {children}
        </div>
    </div>
)

const Section3Content: React.FC<Section3ContentProps> = ({ heading, paragraph, icons = '', className = '' }) => (
    <div className="flex my-6">
        <img src={icons} className="mb-auto m-2" alt="" />
        <p className={`px-3 w-[400px] text-2xl ${className}`}><span className="text-black font-bold">{heading}</span> <span className="text-[#696969]">{paragraph}</span></p>
    </div>
)



const Section1Temp = () =>(
    <svg className="flex mx-auto my-2" width="1019" height="455" viewBox="0 0 1019 455" fill="none" xmlns="http://www.w3.org/2000/svg">
<line x1="626.077" y1="449.572" x2="626.077" y2="-0.000152588" stroke="url(#paint0_linear_2_95)"/>
<line x1="698.079" y1="449.574" x2="698.079" y2="0.00180054" stroke="url(#paint1_linear_2_95)"/>
<line x1="770.081" y1="449.574" x2="770.081" y2="0.00180054" stroke="url(#paint2_linear_2_95)"/>
<line x1="842.082" y1="449.574" x2="842.082" y2="0.00180054" stroke="url(#paint3_linear_2_95)"/>
<line x1="914.084" y1="449.574" x2="914.084" y2="0.00180054" stroke="url(#paint4_linear_2_95)"/>
<line x1="986.085" y1="455" x2="986.085" y2="5.42758" stroke="url(#paint5_linear_2_95)"/>
<line x1="607.791" y1="73.1382" x2="1016.6" y2="73.1382" stroke="url(#paint6_linear_2_95)"/>
<line x1="608.591" y1="132.048" x2="1017.4" y2="132.048" stroke="url(#paint7_linear_2_95)"/>
<line x1="609.391" y1="190.181" x2="1018.2" y2="190.181" stroke="url(#paint8_linear_2_95)"/>
<line x1="609.391" y1="249.091" x2="1018.2" y2="249.091" stroke="url(#paint9_linear_2_95)"/>
<line x1="610.19" y1="307.224" x2="1019" y2="307.224" stroke="url(#paint10_linear_2_95)"/>
<line x1="606.19" y1="366.134" x2="1015" y2="366.134" stroke="url(#paint11_linear_2_95)"/>
<line x1="19.8867" y1="449.571" x2="19.8867" y2="-0.000518799" stroke="url(#paint12_linear_2_95)"/>
<line x1="91.8887" y1="449.573" x2="91.8887" y2="0.00143433" stroke="url(#paint13_linear_2_95)"/>
<line x1="163.891" y1="449.573" x2="163.891" y2="0.00143433" stroke="url(#paint14_linear_2_95)"/>
<line x1="235.892" y1="449.573" x2="235.892" y2="0.00143433" stroke="url(#paint15_linear_2_95)"/>
<line x1="307.894" y1="449.573" x2="307.894" y2="0.00143433" stroke="url(#paint16_linear_2_95)"/>
<line x1="379.895" y1="454.999" x2="379.895" y2="5.42722" stroke="url(#paint17_linear_2_95)"/>
<line x1="1.60059" y1="73.1378" x2="410.41" y2="73.1378" stroke="url(#paint18_linear_2_95)"/>
<line x1="2.40039" y1="132.048" x2="411.21" y2="132.048" stroke="url(#paint19_linear_2_95)"/>
<line x1="3.2002" y1="190.181" x2="412.01" y2="190.181" stroke="url(#paint20_linear_2_95)"/>
<line x1="3.2002" y1="249.091" x2="412.01" y2="249.091" stroke="url(#paint21_linear_2_95)"/>
<line x1="4" y1="307.224" x2="412.81" y2="307.224" stroke="url(#paint22_linear_2_95)"/>
<line y1="366.134" x2="408.81" y2="366.134" stroke="url(#paint23_linear_2_95)"/>
<rect x="254.5" y="145.5" width="79" height="31" rx="15.5" fill="white"/>
<rect x="254.5" y="145.5" width="79" height="31" rx="15.5" stroke="#E7E7E7" stroke-width="3"/>
<path d="M275.864 167.112C275.117 167.112 274.445 166.984 273.848 166.728C273.251 166.461 272.781 166.088 272.44 165.608C272.099 165.128 271.928 164.568 271.928 163.928H273.88C273.923 164.408 274.109 164.803 274.44 165.112C274.781 165.421 275.256 165.576 275.864 165.576C276.493 165.576 276.984 165.427 277.336 165.128C277.688 164.819 277.864 164.424 277.864 163.944C277.864 163.571 277.752 163.267 277.528 163.032C277.315 162.797 277.043 162.616 276.712 162.488C276.392 162.36 275.944 162.221 275.368 162.072C274.643 161.88 274.051 161.688 273.592 161.496C273.144 161.293 272.76 160.984 272.44 160.568C272.12 160.152 271.96 159.597 271.96 158.904C271.96 158.264 272.12 157.704 272.44 157.224C272.76 156.744 273.208 156.376 273.784 156.12C274.36 155.864 275.027 155.736 275.784 155.736C276.861 155.736 277.741 156.008 278.424 156.552C279.117 157.085 279.501 157.821 279.576 158.76H277.56C277.528 158.355 277.336 158.008 276.984 157.72C276.632 157.432 276.168 157.288 275.592 157.288C275.069 157.288 274.643 157.421 274.312 157.688C273.981 157.955 273.816 158.339 273.816 158.84C273.816 159.181 273.917 159.464 274.12 159.688C274.333 159.901 274.6 160.072 274.92 160.2C275.24 160.328 275.677 160.467 276.232 160.616C276.968 160.819 277.565 161.021 278.024 161.224C278.493 161.427 278.888 161.741 279.208 162.168C279.539 162.584 279.704 163.144 279.704 163.848C279.704 164.413 279.549 164.947 279.24 165.448C278.941 165.949 278.499 166.355 277.912 166.664C277.336 166.963 276.653 167.112 275.864 167.112ZM289.936 162.376C289.936 162.707 289.915 163.005 289.872 163.272H283.136C283.19 163.976 283.451 164.541 283.92 164.968C284.39 165.395 284.966 165.608 285.648 165.608C286.63 165.608 287.323 165.197 287.728 164.376H289.696C289.43 165.187 288.944 165.853 288.24 166.376C287.547 166.888 286.683 167.144 285.648 167.144C284.806 167.144 284.048 166.957 283.376 166.584C282.715 166.2 282.192 165.667 281.808 164.984C281.435 164.291 281.248 163.491 281.248 162.584C281.248 161.677 281.43 160.883 281.792 160.2C282.166 159.507 282.683 158.973 283.344 158.6C284.016 158.227 284.784 158.04 285.648 158.04C286.48 158.04 287.222 158.221 287.872 158.584C288.523 158.947 289.03 159.459 289.392 160.12C289.755 160.771 289.936 161.523 289.936 162.376ZM288.032 161.8C288.022 161.128 287.782 160.589 287.312 160.184C286.843 159.779 286.262 159.576 285.568 159.576C284.939 159.576 284.4 159.779 283.952 160.184C283.504 160.579 283.238 161.117 283.152 161.8H288.032ZM293.555 155.16V167H291.731V155.16H293.555ZM297.774 155.16V167H295.95V155.16H297.774ZM308.249 162.376C308.249 162.707 308.227 163.005 308.185 163.272H301.449C301.502 163.976 301.763 164.541 302.233 164.968C302.702 165.395 303.278 165.608 303.961 165.608C304.942 165.608 305.635 165.197 306.041 164.376H308.009C307.742 165.187 307.257 165.853 306.553 166.376C305.859 166.888 304.995 167.144 303.961 167.144C303.118 167.144 302.361 166.957 301.689 166.584C301.027 166.2 300.505 165.667 300.121 164.984C299.747 164.291 299.561 163.491 299.561 162.584C299.561 161.677 299.742 160.883 300.105 160.2C300.478 159.507 300.995 158.973 301.657 158.6C302.329 158.227 303.097 158.04 303.961 158.04C304.793 158.04 305.534 158.221 306.185 158.584C306.835 158.947 307.342 159.459 307.705 160.12C308.067 160.771 308.249 161.523 308.249 162.376ZM306.345 161.8C306.334 161.128 306.094 160.589 305.625 160.184C305.155 159.779 304.574 159.576 303.881 159.576C303.251 159.576 302.713 159.779 302.265 160.184C301.817 160.579 301.55 161.117 301.465 161.8H306.345ZM311.868 159.464C312.134 159.016 312.486 158.669 312.924 158.424C313.372 158.168 313.9 158.04 314.508 158.04V159.928H314.044C313.329 159.928 312.785 160.109 312.412 160.472C312.049 160.835 311.868 161.464 311.868 162.36V167H310.044V158.184H311.868V159.464Z" fill="black"/>
<rect x="235.5" y="269.5" width="34" height="31" rx="15.5" fill="white"/>
<rect x="235.5" y="269.5" width="34" height="31" rx="15.5" stroke="#E7E7E7" stroke-width="3"/>
<path d="M252.692 279.72C253.78 279.72 254.649 280.019 255.3 280.616C255.961 281.213 256.292 282.029 256.292 283.064C256.292 284.141 255.951 284.952 255.268 285.496C254.585 286.04 253.679 286.312 252.548 286.312L252.484 287.576H250.9L250.82 285.064H251.348C252.383 285.064 253.172 284.925 253.716 284.648C254.271 284.371 254.548 283.843 254.548 283.064C254.548 282.499 254.383 282.056 254.052 281.736C253.732 281.416 253.284 281.256 252.708 281.256C252.132 281.256 251.679 281.411 251.348 281.72C251.017 282.029 250.852 282.461 250.852 283.016H249.14C249.14 282.376 249.284 281.805 249.572 281.304C249.86 280.803 250.271 280.413 250.804 280.136C251.348 279.859 251.977 279.72 252.692 279.72ZM251.668 291.112C251.337 291.112 251.06 291 250.836 290.776C250.612 290.552 250.5 290.275 250.5 289.944C250.5 289.613 250.612 289.336 250.836 289.112C251.06 288.888 251.337 288.776 251.668 288.776C251.988 288.776 252.26 288.888 252.484 289.112C252.708 289.336 252.82 289.613 252.82 289.944C252.82 290.275 252.708 290.552 252.484 290.776C252.26 291 251.988 291.112 251.668 291.112Z" fill="black"/>
<rect x="222.5" y="40.5" width="35" height="31" rx="15.5" fill="white"/>
<rect x="222.5" y="40.5" width="35" height="31" rx="15.5" stroke="#E7E7E7" stroke-width="3"/>
<path d="M240.192 50.72C241.28 50.72 242.149 51.0187 242.8 51.616C243.461 52.2133 243.792 53.0293 243.792 54.064C243.792 55.1413 243.451 55.952 242.768 56.496C242.085 57.04 241.179 57.312 240.048 57.312L239.984 58.576H238.4L238.32 56.064H238.848C239.883 56.064 240.672 55.9253 241.216 55.648C241.771 55.3707 242.048 54.8427 242.048 54.064C242.048 53.4987 241.883 53.056 241.552 52.736C241.232 52.416 240.784 52.256 240.208 52.256C239.632 52.256 239.179 52.4107 238.848 52.72C238.517 53.0293 238.352 53.4613 238.352 54.016H236.64C236.64 53.376 236.784 52.8053 237.072 52.304C237.36 51.8027 237.771 51.4133 238.304 51.136C238.848 50.8587 239.477 50.72 240.192 50.72ZM239.168 62.112C238.837 62.112 238.56 62 238.336 61.776C238.112 61.552 238 61.2747 238 60.944C238 60.6133 238.112 60.336 238.336 60.112C238.56 59.888 238.837 59.776 239.168 59.776C239.488 59.776 239.76 59.888 239.984 60.112C240.208 60.336 240.32 60.6133 240.32 60.944C240.32 61.2747 240.208 61.552 239.984 61.776C239.76 62 239.488 62.112 239.168 62.112Z" fill="black"/>
<rect x="166.5" y="162.5" width="34" height="30" rx="15" fill="white"/>
<rect x="166.5" y="162.5" width="34" height="30" rx="15" stroke="#E7E7E7" stroke-width="3"/>
<path d="M183.692 172.22C184.78 172.22 185.649 172.519 186.3 173.116C186.961 173.713 187.292 174.529 187.292 175.564C187.292 176.641 186.951 177.452 186.268 177.996C185.585 178.54 184.679 178.812 183.548 178.812L183.484 180.076H181.9L181.82 177.564H182.348C183.383 177.564 184.172 177.425 184.716 177.148C185.271 176.871 185.548 176.343 185.548 175.564C185.548 174.999 185.383 174.556 185.052 174.236C184.732 173.916 184.284 173.756 183.708 173.756C183.132 173.756 182.679 173.911 182.348 174.22C182.017 174.529 181.852 174.961 181.852 175.516H180.14C180.14 174.876 180.284 174.305 180.572 173.804C180.86 173.303 181.271 172.913 181.804 172.636C182.348 172.359 182.977 172.22 183.692 172.22ZM182.668 183.612C182.337 183.612 182.06 183.5 181.836 183.276C181.612 183.052 181.5 182.775 181.5 182.444C181.5 182.113 181.612 181.836 181.836 181.612C182.06 181.388 182.337 181.276 182.668 181.276C182.988 181.276 183.26 181.388 183.484 181.612C183.708 181.836 183.82 182.113 183.82 182.444C183.82 182.775 183.708 183.052 183.484 183.276C183.26 183.5 182.988 183.612 182.668 183.612Z" fill="black"/>
<rect x="851.5" y="195.5" width="34" height="31" rx="15.5" fill="white"/>
<rect x="851.5" y="195.5" width="34" height="31" rx="15.5" stroke="#E7E7E7" stroke-width="3"/>
<path d="M868.692 205.72C869.78 205.72 870.649 206.019 871.3 206.616C871.961 207.213 872.292 208.029 872.292 209.064C872.292 210.141 871.951 210.952 871.268 211.496C870.585 212.04 869.679 212.312 868.548 212.312L868.484 213.576H866.9L866.82 211.064H867.348C868.383 211.064 869.172 210.925 869.716 210.648C870.271 210.371 870.548 209.843 870.548 209.064C870.548 208.499 870.383 208.056 870.052 207.736C869.732 207.416 869.284 207.256 868.708 207.256C868.132 207.256 867.679 207.411 867.348 207.72C867.017 208.029 866.852 208.461 866.852 209.016H865.14C865.14 208.376 865.284 207.805 865.572 207.304C865.86 206.803 866.271 206.413 866.804 206.136C867.348 205.859 867.977 205.72 868.692 205.72ZM867.668 217.112C867.337 217.112 867.06 217 866.836 216.776C866.612 216.552 866.5 216.275 866.5 215.944C866.5 215.613 866.612 215.336 866.836 215.112C867.06 214.888 867.337 214.776 867.668 214.776C867.988 214.776 868.26 214.888 868.484 215.112C868.708 215.336 868.82 215.613 868.82 215.944C868.82 216.275 868.708 216.552 868.484 216.776C868.26 217 867.988 217.112 867.668 217.112Z" fill="black"/>
<rect x="767.5" y="71.5" width="34" height="31" rx="15.5" fill="white"/>
<rect x="767.5" y="71.5" width="34" height="31" rx="15.5" stroke="#E7E7E7" stroke-width="3"/>
<path d="M784.692 81.72C785.78 81.72 786.649 82.0187 787.3 82.616C787.961 83.2133 788.292 84.0293 788.292 85.064C788.292 86.1413 787.951 86.952 787.268 87.496C786.585 88.04 785.679 88.312 784.548 88.312L784.484 89.576H782.9L782.82 87.064H783.348C784.383 87.064 785.172 86.9253 785.716 86.648C786.271 86.3707 786.548 85.8427 786.548 85.064C786.548 84.4987 786.383 84.056 786.052 83.736C785.732 83.416 785.284 83.256 784.708 83.256C784.132 83.256 783.679 83.4107 783.348 83.72C783.017 84.0293 782.852 84.4613 782.852 85.016H781.14C781.14 84.376 781.284 83.8053 781.572 83.304C781.86 82.8027 782.271 82.4133 782.804 82.136C783.348 81.8587 783.977 81.72 784.692 81.72ZM783.668 93.112C783.337 93.112 783.06 93 782.836 92.776C782.612 92.552 782.5 92.2747 782.5 91.944C782.5 91.6133 782.612 91.336 782.836 91.112C783.06 90.888 783.337 90.776 783.668 90.776C783.988 90.776 784.26 90.888 784.484 91.112C784.708 91.336 784.82 91.6133 784.82 91.944C784.82 92.2747 784.708 92.552 784.484 92.776C784.26 93 783.988 93.112 783.668 93.112Z" fill="black"/>
<rect x="798.5" y="279.5" width="35" height="31" rx="15.5" fill="white"/>
<rect x="798.5" y="279.5" width="35" height="31" rx="15.5" stroke="#E7E7E7" stroke-width="3"/>
<path d="M816.192 289.72C817.28 289.72 818.149 290.019 818.8 290.616C819.461 291.213 819.792 292.029 819.792 293.064C819.792 294.141 819.451 294.952 818.768 295.496C818.085 296.04 817.179 296.312 816.048 296.312L815.984 297.576H814.4L814.32 295.064H814.848C815.883 295.064 816.672 294.925 817.216 294.648C817.771 294.371 818.048 293.843 818.048 293.064C818.048 292.499 817.883 292.056 817.552 291.736C817.232 291.416 816.784 291.256 816.208 291.256C815.632 291.256 815.179 291.411 814.848 291.72C814.517 292.029 814.352 292.461 814.352 293.016H812.64C812.64 292.376 812.784 291.805 813.072 291.304C813.36 290.803 813.771 290.413 814.304 290.136C814.848 289.859 815.477 289.72 816.192 289.72ZM815.168 301.112C814.837 301.112 814.56 301 814.336 300.776C814.112 300.552 814 300.275 814 299.944C814 299.613 814.112 299.336 814.336 299.112C814.56 298.888 814.837 298.776 815.168 298.776C815.488 298.776 815.76 298.888 815.984 299.112C816.208 299.336 816.32 299.613 816.32 299.944C816.32 300.275 816.208 300.552 815.984 300.776C815.76 301 815.488 301.112 815.168 301.112Z" fill="black"/>
<rect x="685.5" y="145.5" width="79" height="31" rx="15.5" fill="white"/>
<rect x="685.5" y="145.5" width="79" height="31" rx="15.5" stroke="#E7E7E7" stroke-width="3"/>
<path d="M709.152 161.288C709.749 161.395 710.256 161.709 710.672 162.232C711.088 162.755 711.296 163.347 711.296 164.008C711.296 164.573 711.147 165.085 710.848 165.544C710.56 165.992 710.139 166.349 709.584 166.616C709.029 166.872 708.384 167 707.648 167H703.2V155.88H707.44C708.197 155.88 708.848 156.008 709.392 156.264C709.936 156.52 710.347 156.867 710.624 157.304C710.901 157.731 711.04 158.211 711.04 158.744C711.04 159.384 710.869 159.917 710.528 160.344C710.187 160.771 709.728 161.085 709.152 161.288ZM705.024 160.552H707.28C707.877 160.552 708.341 160.419 708.672 160.152C709.013 159.875 709.184 159.48 709.184 158.968C709.184 158.467 709.013 158.077 708.672 157.8C708.341 157.512 707.877 157.368 707.28 157.368H705.024V160.552ZM707.488 165.512C708.107 165.512 708.592 165.363 708.944 165.064C709.296 164.765 709.472 164.349 709.472 163.816C709.472 163.272 709.285 162.84 708.912 162.52C708.539 162.2 708.043 162.04 707.424 162.04H705.024V165.512H707.488ZM721.262 158.184V167H719.438V165.96C719.15 166.323 718.771 166.611 718.302 166.824C717.843 167.027 717.353 167.128 716.83 167.128C716.137 167.128 715.513 166.984 714.958 166.696C714.414 166.408 713.982 165.981 713.662 165.416C713.353 164.851 713.198 164.168 713.198 163.368V158.184H715.006V163.096C715.006 163.885 715.203 164.493 715.598 164.92C715.993 165.336 716.531 165.544 717.214 165.544C717.897 165.544 718.435 165.336 718.83 164.92C719.235 164.493 719.438 163.885 719.438 163.096V158.184H721.262ZM731.605 158.184L726.197 171.144H724.309L726.101 166.856L722.629 158.184H724.661L727.141 164.904L729.717 158.184H731.605ZM741.061 162.376C741.061 162.707 741.04 163.005 740.997 163.272H734.261C734.315 163.976 734.576 164.541 735.045 164.968C735.515 165.395 736.091 165.608 736.773 165.608C737.755 165.608 738.448 165.197 738.853 164.376H740.821C740.555 165.187 740.069 165.853 739.365 166.376C738.672 166.888 737.808 167.144 736.773 167.144C735.931 167.144 735.173 166.957 734.501 166.584C733.84 166.2 733.317 165.667 732.933 164.984C732.56 164.291 732.373 163.491 732.373 162.584C732.373 161.677 732.555 160.883 732.917 160.2C733.291 159.507 733.808 158.973 734.469 158.6C735.141 158.227 735.909 158.04 736.773 158.04C737.605 158.04 738.347 158.221 738.997 158.584C739.648 158.947 740.155 159.459 740.517 160.12C740.88 160.771 741.061 161.523 741.061 162.376ZM739.157 161.8C739.147 161.128 738.907 160.589 738.437 160.184C737.968 159.779 737.387 159.576 736.693 159.576C736.064 159.576 735.525 159.779 735.077 160.184C734.629 160.579 734.363 161.117 734.277 161.8H739.157ZM744.68 159.464C744.947 159.016 745.299 158.669 745.736 158.424C746.184 158.168 746.712 158.04 747.32 158.04V159.928H746.856C746.142 159.928 745.598 160.109 745.224 160.472C744.862 160.835 744.68 161.464 744.68 162.36V167H742.856V158.184H744.68V159.464Z" fill="black"/>
<path d="M296.886 178C296.886 178 289.119 245.731 319.579 263.298C350.768 281.285 374.567 228.413 409.092 239.219C450.561 252.199 428.971 310.362 466.245 332.272C516.599 361.871 576.182 354.054 615.432 311.457C633.701 291.631 623.326 266.388 644.429 249.422C665.74 232.289 694.085 252.789 713.35 233.505C729.616 217.223 731 178 731 178" stroke="black" stroke-dasharray="11 11"/>
<rect x="478" y="125" width="96" height="95" rx="24" fill="white"/>
<rect x="478.5" y="125.5" width="95" height="94" rx="23.5" stroke="black" stroke-opacity="0.3"/>
<rect x="488" y="133" width="76.3567" height="80" fill="url(#pattern0_2_95)"/>
<defs>
<pattern id="pattern0_2_95" patternContentUnits="objectBoundingBox" width="1" height="1">
<use href="#image0_2_95" transform="scale(0.00198807 0.00189753)"/>
</pattern>
<linearGradient id="paint0_linear_2_95" x1="627.077" y1="-0.000152588" x2="627.077" y2="449.572" gradientUnits="userSpaceOnUse">
<stop stop-color="white"/>
<stop offset="0.495" stop-opacity="0.2"/>
<stop offset="1" stop-color="white"/>
</linearGradient>
<linearGradient id="paint1_linear_2_95" x1="699.079" y1="0.00180054" x2="699.079" y2="449.574" gradientUnits="userSpaceOnUse">
<stop stop-color="white"/>
<stop offset="0.495" stop-opacity="0.2"/>
<stop offset="1" stop-color="white"/>
</linearGradient>
<linearGradient id="paint2_linear_2_95" x1="771.081" y1="0.00180054" x2="771.081" y2="449.574" gradientUnits="userSpaceOnUse">
<stop stop-color="white"/>
<stop offset="0.495" stop-opacity="0.2"/>
<stop offset="1" stop-color="white"/>
</linearGradient>
<linearGradient id="paint3_linear_2_95" x1="843.082" y1="0.00180054" x2="843.082" y2="449.574" gradientUnits="userSpaceOnUse">
<stop stop-color="white"/>
<stop offset="0.495" stop-opacity="0.2"/>
<stop offset="1" stop-color="white"/>
</linearGradient>
<linearGradient id="paint4_linear_2_95" x1="915.084" y1="0.00180054" x2="915.084" y2="449.574" gradientUnits="userSpaceOnUse">
<stop stop-color="white"/>
<stop offset="0.495" stop-opacity="0.2"/>
<stop offset="1" stop-color="white"/>
</linearGradient>
<linearGradient id="paint5_linear_2_95" x1="987.085" y1="5.42758" x2="987.085" y2="455" gradientUnits="userSpaceOnUse">
<stop stop-color="white"/>
<stop offset="0.495" stop-opacity="0.2"/>
<stop offset="1" stop-color="white"/>
</linearGradient>
<linearGradient id="paint6_linear_2_95" x1="1016.6" y1="74.1382" x2="607.791" y2="74.1382" gradientUnits="userSpaceOnUse">
<stop stop-color="white"/>
<stop offset="0.495" stop-opacity="0.2"/>
<stop offset="1" stop-color="white"/>
</linearGradient>
<linearGradient id="paint7_linear_2_95" x1="1017.4" y1="133.048" x2="608.591" y2="133.048" gradientUnits="userSpaceOnUse">
<stop stop-color="white"/>
<stop offset="0.495" stop-opacity="0.2"/>
<stop offset="1" stop-color="white"/>
</linearGradient>
<linearGradient id="paint8_linear_2_95" x1="1018.2" y1="191.181" x2="609.391" y2="191.181" gradientUnits="userSpaceOnUse">
<stop stop-color="white"/>
<stop offset="0.495" stop-opacity="0.2"/>
<stop offset="1" stop-color="white"/>
</linearGradient>
<linearGradient id="paint9_linear_2_95" x1="1018.2" y1="250.091" x2="609.391" y2="250.091" gradientUnits="userSpaceOnUse">
<stop stop-color="white"/>
<stop offset="0.495" stop-opacity="0.2"/>
<stop offset="1" stop-color="white"/>
</linearGradient>
<linearGradient id="paint10_linear_2_95" x1="1019" y1="308.224" x2="610.19" y2="308.224" gradientUnits="userSpaceOnUse">
<stop stop-color="white"/>
<stop offset="0.495" stop-opacity="0.2"/>
<stop offset="1" stop-color="white"/>
</linearGradient>
<linearGradient id="paint11_linear_2_95" x1="1015" y1="367.134" x2="606.19" y2="367.134" gradientUnits="userSpaceOnUse">
<stop stop-color="white"/>
<stop offset="0.495" stop-opacity="0.2"/>
<stop offset="1" stop-color="white"/>
</linearGradient>
<linearGradient id="paint12_linear_2_95" x1="20.8867" y1="-0.000518799" x2="20.8867" y2="449.571" gradientUnits="userSpaceOnUse">
<stop stop-color="white"/>
<stop offset="0.495" stop-opacity="0.2"/>
<stop offset="1" stop-color="white"/>
</linearGradient>
<linearGradient id="paint13_linear_2_95" x1="92.8887" y1="0.00143433" x2="92.8887" y2="449.573" gradientUnits="userSpaceOnUse">
<stop stop-color="white"/>
<stop offset="0.495" stop-opacity="0.2"/>
<stop offset="1" stop-color="white"/>
</linearGradient>
<linearGradient id="paint14_linear_2_95" x1="164.891" y1="0.00143433" x2="164.891" y2="449.573" gradientUnits="userSpaceOnUse">
<stop stop-color="white"/>
<stop offset="0.495" stop-opacity="0.2"/>
<stop offset="1" stop-color="white"/>
</linearGradient>
<linearGradient id="paint15_linear_2_95" x1="236.892" y1="0.00143433" x2="236.892" y2="449.573" gradientUnits="userSpaceOnUse">
<stop stop-color="white"/>
<stop offset="0.495" stop-opacity="0.2"/>
<stop offset="1" stop-color="white"/>
</linearGradient>
<linearGradient id="paint16_linear_2_95" x1="308.894" y1="0.00143433" x2="308.894" y2="449.573" gradientUnits="userSpaceOnUse">
<stop stop-color="white"/>
<stop offset="0.495" stop-opacity="0.2"/>
<stop offset="1" stop-color="white"/>
</linearGradient>
<linearGradient id="paint17_linear_2_95" x1="380.895" y1="5.42722" x2="380.895" y2="454.999" gradientUnits="userSpaceOnUse">
<stop stop-color="white"/>
<stop offset="0.495" stop-opacity="0.2"/>
<stop offset="1" stop-color="white"/>
</linearGradient>
<linearGradient id="paint18_linear_2_95" x1="410.41" y1="74.1378" x2="1.60059" y2="74.1378" gradientUnits="userSpaceOnUse">
<stop stop-color="white"/>
<stop offset="0.495" stop-opacity="0.2"/>
<stop offset="1" stop-color="white"/>
</linearGradient>
<linearGradient id="paint19_linear_2_95" x1="411.21" y1="133.048" x2="2.40039" y2="133.048" gradientUnits="userSpaceOnUse">
<stop stop-color="white"/>
<stop offset="0.495" stop-opacity="0.2"/>
<stop offset="1" stop-color="white"/>
</linearGradient>
<linearGradient id="paint20_linear_2_95" x1="412.01" y1="191.181" x2="3.2002" y2="191.181" gradientUnits="userSpaceOnUse">
<stop stop-color="white"/>
<stop offset="0.495" stop-opacity="0.2"/>
<stop offset="1" stop-color="white"/>
</linearGradient>
<linearGradient id="paint21_linear_2_95" x1="412.01" y1="250.091" x2="3.2002" y2="250.091" gradientUnits="userSpaceOnUse">
<stop stop-color="white"/>
<stop offset="0.495" stop-opacity="0.2"/>
<stop offset="1" stop-color="white"/>
</linearGradient>
<linearGradient id="paint22_linear_2_95" x1="412.81" y1="308.224" x2="4" y2="308.224" gradientUnits="userSpaceOnUse">
<stop stop-color="white"/>
<stop offset="0.495" stop-opacity="0.2"/>
<stop offset="1" stop-color="white"/>
</linearGradient>
<linearGradient id="paint23_linear_2_95" x1="408.81" y1="367.134" x2="0" y2="367.134" gradientUnits="userSpaceOnUse">
<stop stop-color="white"/>
<stop offset="0.495" stop-opacity="0.2"/>
<stop offset="1" stop-color="white"/>
</linearGradient>
<image id="image0_2_95" width="503" height="527" preserveAspectRatio="none" href="data:image/png;base64,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"/>
</defs>
</svg>
)

const Section2Temp = () =>(
    <svg className="flex mx-auto my-3" width="702" height="456" viewBox="0 0 702 456" fill="none" xmlns="http://www.w3.org/2000/svg">
<g filter="url(#filter0_f_3_28)">
<ellipse cx="351" cy="243" rx="251" ry="78" fill="#867C5B" fill-opacity="0.5"/>
</g>
<line x1="126.439" y1="450.542" x2="126.439" y2="0.970551" stroke="url(#paint0_linear_3_28)"/>
<line x1="210.987" y1="450.544" x2="210.987" y2="0.972504" stroke="url(#paint1_linear_3_28)"/>
<line x1="295.535" y1="450.544" x2="295.535" y2="0.972504" stroke="url(#paint2_linear_3_28)"/>
<line x1="380.082" y1="450.544" x2="380.082" y2="0.972504" stroke="url(#paint3_linear_3_28)"/>
<line x1="464.63" y1="450.544" x2="464.63" y2="0.972504" stroke="url(#paint4_linear_3_28)"/>
<line x1="549.177" y1="455.97" x2="549.177" y2="6.39828" stroke="url(#paint5_linear_3_28)"/>
<line x1="104.88" y1="74.1089" x2="584.923" y2="74.1089" stroke="url(#paint6_linear_3_28)"/>
<line x1="105.818" y1="133.019" x2="585.862" y2="133.019" stroke="url(#paint7_linear_3_28)"/>
<line x1="106.758" y1="191.152" x2="586.801" y2="191.152" stroke="url(#paint8_linear_3_28)"/>
<line x1="106.758" y1="250.062" x2="586.801" y2="250.062" stroke="url(#paint9_linear_3_28)"/>
<line x1="107.697" y1="308.195" x2="587.74" y2="308.195" stroke="url(#paint10_linear_3_28)"/>
<line x1="103" y1="367.105" x2="583.043" y2="367.105" stroke="url(#paint11_linear_3_28)"/>
<rect x="73" y="152" width="555" height="171.645" rx="10" fill="black" fill-opacity="0.05"/>
<rect x="81.8799" y="157.697" width="537.98" height="158.112" rx="10" fill="white"/>
<rect x="82.3799" y="158.197" width="536.98" height="157.112" rx="9.5" stroke="black" stroke-opacity="0.3"/>
<path opacity="0.5" d="M107.88 182.848V184.032H103.032V187.792H106.968V188.976H103.032V194H101.576V182.848H107.88ZM110.39 183.808C110.113 183.808 109.878 183.712 109.686 183.52C109.494 183.328 109.398 183.093 109.398 182.816C109.398 182.539 109.494 182.304 109.686 182.112C109.878 181.92 110.113 181.824 110.39 181.824C110.657 181.824 110.881 181.92 111.062 182.112C111.254 182.304 111.35 182.539 111.35 182.816C111.35 183.093 111.254 183.328 111.062 183.52C110.881 183.712 110.657 183.808 110.39 183.808ZM111.094 185.232V194H109.638V185.232H111.094ZM117.848 185.072C118.914 185.072 119.778 185.397 120.44 186.048C121.101 186.688 121.432 187.616 121.432 188.832V194H119.992V189.04C119.992 188.165 119.773 187.499 119.336 187.04C118.898 186.571 118.301 186.336 117.544 186.336C116.776 186.336 116.162 186.576 115.704 187.056C115.256 187.536 115.032 188.235 115.032 189.152V194H113.576V185.232H115.032V186.48C115.32 186.032 115.709 185.685 116.2 185.44C116.701 185.195 117.25 185.072 117.848 185.072ZM123.266 189.584C123.266 188.688 123.447 187.904 123.81 187.232C124.173 186.549 124.669 186.021 125.298 185.648C125.938 185.275 126.653 185.088 127.442 185.088C128.125 185.088 128.759 185.248 129.346 185.568C129.933 185.877 130.381 186.288 130.69 186.8V182.16H132.162V194H130.69V192.352C130.402 192.875 129.975 193.307 129.41 193.648C128.845 193.979 128.183 194.144 127.426 194.144C126.647 194.144 125.938 193.952 125.298 193.568C124.669 193.184 124.173 192.645 123.81 191.952C123.447 191.259 123.266 190.469 123.266 189.584ZM130.69 189.6C130.69 188.939 130.557 188.363 130.29 187.872C130.023 187.381 129.661 187.008 129.202 186.752C128.754 186.485 128.258 186.352 127.714 186.352C127.17 186.352 126.674 186.48 126.226 186.736C125.778 186.992 125.421 187.365 125.154 187.856C124.887 188.347 124.754 188.923 124.754 189.584C124.754 190.256 124.887 190.843 125.154 191.344C125.421 191.835 125.778 192.213 126.226 192.48C126.674 192.736 127.17 192.864 127.714 192.864C128.258 192.864 128.754 192.736 129.202 192.48C129.661 192.213 130.023 191.835 130.29 191.344C130.557 190.843 130.69 190.261 130.69 189.6ZM140.664 186.432V191.6C140.664 192.027 140.755 192.331 140.936 192.512C141.118 192.683 141.432 192.768 141.88 192.768H142.952V194H141.64C140.83 194 140.222 193.813 139.816 193.44C139.411 193.067 139.208 192.453 139.208 191.6V186.432H138.072V185.232H139.208V183.024H140.664V185.232H142.952V186.432H140.664ZM146.172 186.656C146.428 186.155 146.791 185.765 147.26 185.488C147.74 185.211 148.322 185.072 149.004 185.072V186.576H148.62C146.988 186.576 146.172 187.461 146.172 189.232V194H144.716V185.232H146.172V186.656ZM150.141 189.584C150.141 188.688 150.322 187.904 150.685 187.232C151.048 186.549 151.544 186.021 152.173 185.648C152.813 185.275 153.522 185.088 154.301 185.088C155.069 185.088 155.736 185.253 156.301 185.584C156.866 185.915 157.288 186.331 157.565 186.832V185.232H159.037V194H157.565V192.368C157.277 192.88 156.845 193.307 156.269 193.648C155.704 193.979 155.042 194.144 154.285 194.144C153.506 194.144 152.802 193.952 152.173 193.568C151.544 193.184 151.048 192.645 150.685 191.952C150.322 191.259 150.141 190.469 150.141 189.584ZM157.565 189.6C157.565 188.939 157.432 188.363 157.165 187.872C156.898 187.381 156.536 187.008 156.077 186.752C155.629 186.485 155.133 186.352 154.589 186.352C154.045 186.352 153.549 186.48 153.101 186.736C152.653 186.992 152.296 187.365 152.029 187.856C151.762 188.347 151.629 188.923 151.629 189.584C151.629 190.256 151.762 190.843 152.029 191.344C152.296 191.835 152.653 192.213 153.101 192.48C153.549 192.736 154.045 192.864 154.589 192.864C155.133 192.864 155.629 192.736 156.077 192.48C156.536 192.213 156.898 191.835 157.165 191.344C157.432 190.843 157.565 190.261 157.565 189.6ZM160.954 189.584C160.954 188.688 161.135 187.904 161.498 187.232C161.86 186.549 162.356 186.021 162.986 185.648C163.626 185.275 164.34 185.088 165.13 185.088C165.812 185.088 166.447 185.248 167.034 185.568C167.62 185.877 168.068 186.288 168.378 186.8V182.16H169.85V194H168.378V192.352C168.09 192.875 167.663 193.307 167.098 193.648C166.532 193.979 165.871 194.144 165.114 194.144C164.335 194.144 163.626 193.952 162.986 193.568C162.356 193.184 161.86 192.645 161.498 191.952C161.135 191.259 160.954 190.469 160.954 189.584ZM168.378 189.6C168.378 188.939 168.244 188.363 167.978 187.872C167.711 187.381 167.348 187.008 166.89 186.752C166.442 186.485 165.946 186.352 165.402 186.352C164.858 186.352 164.362 186.48 163.914 186.736C163.466 186.992 163.108 187.365 162.842 187.856C162.575 188.347 162.442 188.923 162.442 189.584C162.442 190.256 162.575 190.843 162.842 191.344C163.108 191.835 163.466 192.213 163.914 192.48C164.362 192.736 164.858 192.864 165.402 192.864C165.946 192.864 166.442 192.736 166.89 192.48C167.348 192.213 167.711 191.835 167.978 191.344C168.244 190.843 168.378 190.261 168.378 189.6ZM180.31 189.28C180.31 189.557 180.294 189.851 180.262 190.16H173.254C173.307 191.024 173.601 191.701 174.134 192.192C174.678 192.672 175.334 192.912 176.102 192.912C176.731 192.912 177.254 192.768 177.67 192.48C178.097 192.181 178.395 191.787 178.566 191.296H180.134C179.899 192.139 179.43 192.827 178.726 193.36C178.022 193.883 177.147 194.144 176.102 194.144C175.27 194.144 174.523 193.957 173.862 193.584C173.211 193.211 172.699 192.683 172.326 192C171.953 191.307 171.766 190.507 171.766 189.6C171.766 188.693 171.947 187.899 172.31 187.216C172.673 186.533 173.179 186.011 173.83 185.648C174.491 185.275 175.249 185.088 176.102 185.088C176.934 185.088 177.67 185.269 178.31 185.632C178.95 185.995 179.441 186.496 179.782 187.136C180.134 187.765 180.31 188.48 180.31 189.28ZM178.806 188.976C178.806 188.421 178.683 187.947 178.438 187.552C178.193 187.147 177.857 186.843 177.43 186.64C177.014 186.427 176.55 186.32 176.038 186.32C175.302 186.32 174.673 186.555 174.15 187.024C173.638 187.493 173.345 188.144 173.27 188.976H178.806ZM183.688 186.656C183.944 186.155 184.307 185.765 184.776 185.488C185.256 185.211 185.837 185.072 186.52 185.072V186.576H186.136C184.504 186.576 183.688 187.461 183.688 189.232V194H182.232V185.232H183.688V186.656ZM191.305 194.144C190.633 194.144 190.03 194.032 189.497 193.808C188.963 193.573 188.542 193.253 188.233 192.848C187.923 192.432 187.753 191.957 187.721 191.424H189.225C189.267 191.861 189.47 192.219 189.833 192.496C190.206 192.773 190.691 192.912 191.289 192.912C191.843 192.912 192.281 192.789 192.601 192.544C192.921 192.299 193.081 191.989 193.081 191.616C193.081 191.232 192.91 190.949 192.569 190.768C192.227 190.576 191.699 190.389 190.985 190.208C190.334 190.037 189.801 189.867 189.385 189.696C188.979 189.515 188.627 189.253 188.329 188.912C188.041 188.56 187.897 188.101 187.897 187.536C187.897 187.088 188.03 186.677 188.297 186.304C188.563 185.931 188.942 185.637 189.433 185.424C189.923 185.2 190.483 185.088 191.113 185.088C192.083 185.088 192.867 185.333 193.465 185.824C194.062 186.315 194.382 186.987 194.425 187.84H192.969C192.937 187.381 192.75 187.013 192.409 186.736C192.078 186.459 191.63 186.32 191.065 186.32C190.542 186.32 190.126 186.432 189.817 186.656C189.507 186.88 189.353 187.173 189.353 187.536C189.353 187.824 189.443 188.064 189.625 188.256C189.817 188.437 190.051 188.587 190.329 188.704C190.617 188.811 191.011 188.933 191.513 189.072C192.142 189.243 192.654 189.413 193.049 189.584C193.443 189.744 193.779 189.989 194.057 190.32C194.345 190.651 194.494 191.083 194.505 191.616C194.505 192.096 194.371 192.528 194.105 192.912C193.838 193.296 193.459 193.6 192.969 193.824C192.489 194.037 191.934 194.144 191.305 194.144ZM202.602 186.432V191.6C202.602 192.027 202.692 192.331 202.874 192.512C203.055 192.683 203.37 192.768 203.818 192.768H204.89V194H203.578C202.767 194 202.159 193.813 201.754 193.44C201.348 193.067 201.146 192.453 201.146 191.6V186.432H200.01V185.232H201.146V183.024H202.602V185.232H204.89V186.432H202.602ZM210.478 194.144C209.657 194.144 208.91 193.957 208.238 193.584C207.577 193.211 207.054 192.683 206.67 192C206.297 191.307 206.11 190.507 206.11 189.6C206.11 188.704 206.302 187.915 206.686 187.232C207.081 186.539 207.614 186.011 208.286 185.648C208.958 185.275 209.71 185.088 210.542 185.088C211.374 185.088 212.126 185.275 212.798 185.648C213.47 186.011 213.998 186.533 214.382 187.216C214.777 187.899 214.974 188.693 214.974 189.6C214.974 190.507 214.771 191.307 214.366 192C213.971 192.683 213.433 193.211 212.75 193.584C212.067 193.957 211.31 194.144 210.478 194.144ZM210.478 192.864C211.001 192.864 211.491 192.741 211.95 192.496C212.409 192.251 212.777 191.883 213.054 191.392C213.342 190.901 213.486 190.304 213.486 189.6C213.486 188.896 213.347 188.299 213.07 187.808C212.793 187.317 212.43 186.955 211.982 186.72C211.534 186.475 211.049 186.352 210.526 186.352C209.993 186.352 209.502 186.475 209.054 186.72C208.617 186.955 208.265 187.317 207.998 187.808C207.731 188.299 207.598 188.896 207.598 189.6C207.598 190.315 207.726 190.917 207.982 191.408C208.249 191.899 208.601 192.267 209.038 192.512C209.475 192.747 209.955 192.864 210.478 192.864ZM222.93 186.432V191.6C222.93 192.027 223.021 192.331 223.202 192.512C223.383 192.683 223.698 192.768 224.146 192.768H225.218V194H223.906C223.095 194 222.487 193.813 222.082 193.44C221.677 193.067 221.474 192.453 221.474 191.6V186.432H220.338V185.232H221.474V183.024H222.93V185.232H225.218V186.432H222.93ZM228.438 186.656C228.694 186.155 229.057 185.765 229.526 185.488C230.006 185.211 230.587 185.072 231.27 185.072V186.576H230.886C229.254 186.576 228.438 187.461 228.438 189.232V194H226.982V185.232H228.438V186.656ZM232.407 189.584C232.407 188.688 232.588 187.904 232.951 187.232C233.313 186.549 233.809 186.021 234.439 185.648C235.079 185.275 235.788 185.088 236.567 185.088C237.335 185.088 238.001 185.253 238.567 185.584C239.132 185.915 239.553 186.331 239.831 186.832V185.232H241.303V194H239.831V192.368C239.543 192.88 239.111 193.307 238.535 193.648C237.969 193.979 237.308 194.144 236.551 194.144C235.772 194.144 235.068 193.952 234.439 193.568C233.809 193.184 233.313 192.645 232.951 191.952C232.588 191.259 232.407 190.469 232.407 189.584ZM239.831 189.6C239.831 188.939 239.697 188.363 239.431 187.872C239.164 187.381 238.801 187.008 238.343 186.752C237.895 186.485 237.399 186.352 236.855 186.352C236.311 186.352 235.815 186.48 235.367 186.736C234.919 186.992 234.561 187.365 234.295 187.856C234.028 188.347 233.895 188.923 233.895 189.584C233.895 190.256 234.028 190.843 234.295 191.344C234.561 191.835 234.919 192.213 235.367 192.48C235.815 192.736 236.311 192.864 236.855 192.864C237.399 192.864 237.895 192.736 238.343 192.48C238.801 192.213 239.164 191.835 239.431 191.344C239.697 190.843 239.831 190.261 239.831 189.6ZM243.219 189.584C243.219 188.688 243.401 187.904 243.763 187.232C244.126 186.549 244.622 186.021 245.251 185.648C245.891 185.275 246.606 185.088 247.395 185.088C248.078 185.088 248.713 185.248 249.299 185.568C249.886 185.877 250.334 186.288 250.643 186.8V182.16H252.115V194H250.643V192.352C250.355 192.875 249.929 193.307 249.363 193.648C248.798 193.979 248.137 194.144 247.379 194.144C246.601 194.144 245.891 193.952 245.251 193.568C244.622 193.184 244.126 192.645 243.763 191.952C243.401 191.259 243.219 190.469 243.219 189.584ZM250.643 189.6C250.643 188.939 250.51 188.363 250.243 187.872C249.977 187.381 249.614 187.008 249.155 186.752C248.707 186.485 248.211 186.352 247.667 186.352C247.123 186.352 246.627 186.48 246.179 186.736C245.731 186.992 245.374 187.365 245.107 187.856C244.841 188.347 244.707 188.923 244.707 189.584C244.707 190.256 244.841 190.843 245.107 191.344C245.374 191.835 245.731 192.213 246.179 192.48C246.627 192.736 247.123 192.864 247.667 192.864C248.211 192.864 248.707 192.736 249.155 192.48C249.614 192.213 249.977 191.835 250.243 191.344C250.51 190.843 250.643 190.261 250.643 189.6ZM262.576 189.28C262.576 189.557 262.56 189.851 262.528 190.16H255.52C255.573 191.024 255.866 191.701 256.4 192.192C256.944 192.672 257.6 192.912 258.368 192.912C258.997 192.912 259.52 192.768 259.936 192.48C260.362 192.181 260.661 191.787 260.832 191.296H262.4C262.165 192.139 261.696 192.827 260.992 193.36C260.288 193.883 259.413 194.144 258.368 194.144C257.536 194.144 256.789 193.957 256.128 193.584C255.477 193.211 254.965 192.683 254.592 192C254.218 191.307 254.032 190.507 254.032 189.6C254.032 188.693 254.213 187.899 254.576 187.216C254.938 186.533 255.445 186.011 256.096 185.648C256.757 185.275 257.514 185.088 258.368 185.088C259.2 185.088 259.936 185.269 260.576 185.632C261.216 185.995 261.706 186.496 262.048 187.136C262.4 187.765 262.576 188.48 262.576 189.28ZM261.072 188.976C261.072 188.421 260.949 187.947 260.704 187.552C260.458 187.147 260.122 186.843 259.696 186.64C259.28 186.427 258.816 186.32 258.304 186.32C257.568 186.32 256.938 186.555 256.416 187.024C255.904 187.493 255.61 188.144 255.536 188.976H261.072ZM280.443 185.232L277.707 194H276.203L274.091 187.04L271.979 194H270.475L267.723 185.232H269.211L271.227 192.592L273.403 185.232H274.891L277.019 192.608L279.003 185.232H280.443ZM282.64 183.808C282.363 183.808 282.128 183.712 281.936 183.52C281.744 183.328 281.648 183.093 281.648 182.816C281.648 182.539 281.744 182.304 281.936 182.112C282.128 181.92 282.363 181.824 282.64 181.824C282.907 181.824 283.131 181.92 283.312 182.112C283.504 182.304 283.6 182.539 283.6 182.816C283.6 183.093 283.504 183.328 283.312 183.52C283.131 183.712 282.907 183.808 282.64 183.808ZM283.344 185.232V194H281.888V185.232H283.344ZM287.602 186.432V191.6C287.602 192.027 287.692 192.331 287.874 192.512C288.055 192.683 288.37 192.768 288.818 192.768H289.89V194H288.578C287.767 194 287.159 193.813 286.754 193.44C286.348 193.067 286.146 192.453 286.146 191.6V186.432H285.01V185.232H286.146V183.024H287.602V185.232H289.89V186.432H287.602ZM296.006 185.072C296.667 185.072 297.265 185.216 297.798 185.504C298.331 185.781 298.747 186.203 299.046 186.768C299.355 187.333 299.51 188.021 299.51 188.832V194H298.07V189.04C298.07 188.165 297.851 187.499 297.414 187.04C296.977 186.571 296.379 186.336 295.622 186.336C294.854 186.336 294.241 186.576 293.782 187.056C293.334 187.536 293.11 188.235 293.11 189.152V194H291.654V182.16H293.11V186.48C293.398 186.032 293.793 185.685 294.294 185.44C294.806 185.195 295.377 185.072 296.006 185.072Z" fill="black"/>
<rect x="526.23" y="283.6" width="74.7325" height="19.6528" rx="4.5" fill="url(#paint12_linear_3_28)"/>
<rect x="526.23" y="283.6" width="74.7325" height="19.6528" rx="4.5" stroke="url(#paint13_linear_3_28)"/>
<path d="M551.481 296.482C551.113 296.482 550.782 296.418 550.489 296.29C550.201 296.157 549.974 295.975 549.809 295.746C549.643 295.511 549.558 295.242 549.553 294.938H550.329C550.355 295.199 550.462 295.421 550.649 295.602C550.841 295.778 551.118 295.866 551.481 295.866C551.827 295.866 552.099 295.781 552.297 295.61C552.499 295.434 552.601 295.21 552.601 294.938C552.601 294.725 552.542 294.551 552.425 294.418C552.307 294.285 552.161 294.183 551.985 294.114C551.809 294.045 551.571 293.97 551.273 293.89C550.905 293.794 550.609 293.698 550.385 293.602C550.166 293.506 549.977 293.357 549.817 293.154C549.662 292.946 549.585 292.669 549.585 292.322C549.585 292.018 549.662 291.749 549.817 291.514C549.971 291.279 550.187 291.098 550.465 290.97C550.747 290.842 551.07 290.778 551.433 290.778C551.955 290.778 552.382 290.909 552.713 291.17C553.049 291.431 553.238 291.778 553.281 292.21H552.481C552.454 291.997 552.342 291.81 552.145 291.65C551.947 291.485 551.686 291.402 551.361 291.402C551.057 291.402 550.809 291.482 550.617 291.642C550.425 291.797 550.329 292.015 550.329 292.298C550.329 292.501 550.385 292.666 550.497 292.794C550.614 292.922 550.755 293.021 550.921 293.09C551.091 293.154 551.329 293.229 551.633 293.314C552.001 293.415 552.297 293.517 552.521 293.618C552.745 293.714 552.937 293.866 553.097 294.074C553.257 294.277 553.337 294.554 553.337 294.906C553.337 295.178 553.265 295.434 553.121 295.674C552.977 295.914 552.763 296.109 552.481 296.258C552.198 296.407 551.865 296.482 551.481 296.482ZM558.408 294.066C558.408 294.205 558.4 294.351 558.384 294.506H554.88C554.907 294.938 555.053 295.277 555.32 295.522C555.592 295.762 555.92 295.882 556.304 295.882C556.619 295.882 556.88 295.81 557.088 295.666C557.301 295.517 557.451 295.319 557.536 295.074H558.32C558.203 295.495 557.968 295.839 557.616 296.106C557.264 296.367 556.827 296.498 556.304 296.498C555.888 296.498 555.515 296.405 555.184 296.218C554.859 296.031 554.603 295.767 554.416 295.426C554.229 295.079 554.136 294.679 554.136 294.226C554.136 293.773 554.227 293.375 554.408 293.034C554.589 292.693 554.843 292.431 555.168 292.25C555.499 292.063 555.877 291.97 556.304 291.97C556.72 291.97 557.088 292.061 557.408 292.242C557.728 292.423 557.973 292.674 558.144 292.994C558.32 293.309 558.408 293.666 558.408 294.066ZM557.656 293.914C557.656 293.637 557.595 293.399 557.472 293.202C557.349 292.999 557.181 292.847 556.968 292.746C556.76 292.639 556.528 292.586 556.272 292.586C555.904 292.586 555.589 292.703 555.328 292.938C555.072 293.173 554.925 293.498 554.888 293.914H557.656ZM559.097 294.218C559.097 293.77 559.188 293.378 559.369 293.042C559.55 292.701 559.798 292.437 560.113 292.25C560.433 292.063 560.788 291.97 561.177 291.97C561.561 291.97 561.894 292.053 562.177 292.218C562.46 292.383 562.67 292.591 562.809 292.842V292.042H563.545V296.426H562.809V295.61C562.665 295.866 562.449 296.079 562.161 296.25C561.878 296.415 561.548 296.498 561.169 296.498C560.78 296.498 560.428 296.402 560.113 296.21C559.798 296.018 559.55 295.749 559.369 295.402C559.188 295.055 559.097 294.661 559.097 294.218ZM562.809 294.226C562.809 293.895 562.742 293.607 562.609 293.362C562.476 293.117 562.294 292.93 562.065 292.802C561.841 292.669 561.593 292.602 561.321 292.602C561.049 292.602 560.801 292.666 560.577 292.794C560.353 292.922 560.174 293.109 560.041 293.354C559.908 293.599 559.841 293.887 559.841 294.218C559.841 294.554 559.908 294.847 560.041 295.098C560.174 295.343 560.353 295.533 560.577 295.666C560.801 295.794 561.049 295.858 561.321 295.858C561.593 295.858 561.841 295.794 562.065 295.666C562.294 295.533 562.476 295.343 562.609 295.098C562.742 294.847 562.809 294.557 562.809 294.226ZM565.503 292.754C565.631 292.503 565.813 292.309 566.047 292.17C566.287 292.031 566.578 291.962 566.919 291.962V292.714H566.727C565.911 292.714 565.503 293.157 565.503 294.042V296.426H564.775V292.042H565.503V292.754ZM567.488 294.226C567.488 293.773 567.578 293.378 567.76 293.042C567.941 292.701 568.192 292.437 568.512 292.25C568.837 292.063 569.208 291.97 569.624 291.97C570.162 291.97 570.605 292.101 570.952 292.362C571.304 292.623 571.536 292.986 571.648 293.45H570.864C570.789 293.183 570.642 292.973 570.424 292.818C570.21 292.663 569.944 292.586 569.624 292.586C569.208 292.586 568.872 292.73 568.616 293.018C568.36 293.301 568.232 293.703 568.232 294.226C568.232 294.754 568.36 295.162 568.616 295.45C568.872 295.738 569.208 295.882 569.624 295.882C569.944 295.882 570.21 295.807 570.424 295.658C570.637 295.509 570.784 295.295 570.864 295.018H571.648C571.53 295.466 571.296 295.826 570.944 296.098C570.592 296.365 570.152 296.498 569.624 296.498C569.208 296.498 568.837 296.405 568.512 296.218C568.192 296.031 567.941 295.767 567.76 295.426C567.578 295.085 567.488 294.685 567.488 294.226ZM574.795 291.962C575.126 291.962 575.424 292.034 575.691 292.178C575.958 292.317 576.166 292.527 576.315 292.81C576.47 293.093 576.547 293.437 576.547 293.842V296.426H575.827V293.946C575.827 293.509 575.718 293.175 575.499 292.946C575.28 292.711 574.982 292.594 574.603 292.594C574.219 292.594 573.912 292.714 573.683 292.954C573.459 293.194 573.347 293.543 573.347 294.002V296.426H572.619V290.506H573.347V292.666C573.491 292.442 573.688 292.269 573.939 292.146C574.195 292.023 574.48 291.962 574.795 291.962Z" fill="white"/>
<defs>
<filter id="filter0_f_3_28" x="0" y="65" width="702" height="356" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
<feFlood flood-opacity="0" result="BackgroundImageFix"/>
<feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
<feGaussianBlur stdDeviation="50" result="effect1_foregroundBlur_3_28"/>
</filter>
<linearGradient id="paint0_linear_3_28" x1="127.439" y1="0.970551" x2="127.439" y2="450.542" gradientUnits="userSpaceOnUse">
<stop stop-color="white"/>
<stop offset="0.495" stop-opacity="0.2"/>
<stop offset="1" stop-color="white"/>
</linearGradient>
<linearGradient id="paint1_linear_3_28" x1="211.987" y1="0.972504" x2="211.987" y2="450.544" gradientUnits="userSpaceOnUse">
<stop stop-color="white"/>
<stop offset="0.495" stop-opacity="0.2"/>
<stop offset="1" stop-color="white"/>
</linearGradient>
<linearGradient id="paint2_linear_3_28" x1="296.535" y1="0.972504" x2="296.535" y2="450.544" gradientUnits="userSpaceOnUse">
<stop stop-color="white"/>
<stop offset="0.495" stop-opacity="0.2"/>
<stop offset="1" stop-color="white"/>
</linearGradient>
<linearGradient id="paint3_linear_3_28" x1="381.082" y1="0.972504" x2="381.082" y2="450.544" gradientUnits="userSpaceOnUse">
<stop stop-color="white"/>
<stop offset="0.495" stop-opacity="0.2"/>
<stop offset="1" stop-color="white"/>
</linearGradient>
<linearGradient id="paint4_linear_3_28" x1="465.63" y1="0.972504" x2="465.63" y2="450.544" gradientUnits="userSpaceOnUse">
<stop stop-color="white"/>
<stop offset="0.495" stop-opacity="0.2"/>
<stop offset="1" stop-color="white"/>
</linearGradient>
<linearGradient id="paint5_linear_3_28" x1="550.177" y1="6.39828" x2="550.177" y2="455.97" gradientUnits="userSpaceOnUse">
<stop stop-color="white"/>
<stop offset="0.495" stop-opacity="0.2"/>
<stop offset="1" stop-color="white"/>
</linearGradient>
<linearGradient id="paint6_linear_3_28" x1="584.923" y1="75.1089" x2="104.88" y2="75.1089" gradientUnits="userSpaceOnUse">
<stop stop-color="white"/>
<stop offset="0.495" stop-opacity="0.2"/>
<stop offset="1" stop-color="white"/>
</linearGradient>
<linearGradient id="paint7_linear_3_28" x1="585.862" y1="134.019" x2="105.818" y2="134.019" gradientUnits="userSpaceOnUse">
<stop stop-color="white"/>
<stop offset="0.495" stop-opacity="0.2"/>
<stop offset="1" stop-color="white"/>
</linearGradient>
<linearGradient id="paint8_linear_3_28" x1="586.801" y1="192.152" x2="106.758" y2="192.152" gradientUnits="userSpaceOnUse">
<stop stop-color="white"/>
<stop offset="0.495" stop-opacity="0.2"/>
<stop offset="1" stop-color="white"/>
</linearGradient>
<linearGradient id="paint9_linear_3_28" x1="586.801" y1="251.062" x2="106.758" y2="251.062" gradientUnits="userSpaceOnUse">
<stop stop-color="white"/>
<stop offset="0.495" stop-opacity="0.2"/>
<stop offset="1" stop-color="white"/>
</linearGradient>
<linearGradient id="paint10_linear_3_28" x1="587.741" y1="309.195" x2="107.697" y2="309.195" gradientUnits="userSpaceOnUse">
<stop stop-color="white"/>
<stop offset="0.495" stop-opacity="0.2"/>
<stop offset="1" stop-color="white"/>
</linearGradient>
<linearGradient id="paint11_linear_3_28" x1="583.043" y1="368.105" x2="103" y2="368.105" gradientUnits="userSpaceOnUse">
<stop stop-color="white"/>
<stop offset="0.495" stop-opacity="0.2"/>
<stop offset="1" stop-color="white"/>
</linearGradient>
<linearGradient id="paint12_linear_3_28" x1="563.597" y1="283.1" x2="563.597" y2="303.752" gradientUnits="userSpaceOnUse">
<stop stop-color="#353535" stop-opacity="0.85"/>
<stop offset="0.5" stop-color="#1B1B1B"/>
<stop offset="1"/>
</linearGradient>
<linearGradient id="paint13_linear_3_28" x1="564.13" y1="303.752" x2="564.13" y2="283.1" gradientUnits="userSpaceOnUse">
<stop stop-color="#353535" stop-opacity="0.1"/>
<stop offset="1" stop-color="#C1C1C1" stop-opacity="0.4"/>
</linearGradient>
</defs>
</svg>
);
