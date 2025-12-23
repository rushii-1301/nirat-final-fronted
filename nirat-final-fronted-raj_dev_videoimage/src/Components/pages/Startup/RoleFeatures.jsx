import React from "react";
import { useNavigate } from "react-router-dom";
import { getAsset } from "../../../utils/assets.js";

function RoleFeatures({ theme, isDark, toggleTheme, sidebardata }) {
    const navigate = useNavigate();

    return (
        <div className={`w-screen h-screen relative overflow-hidden flex items-center justify-center ${isDark ? 'bg-black' : 'bg-[#F5F5F5]'
            }`}>
            {/* Main Container - Scales proportionally */}
            <div className="relative w-full h-full flex items-center justify-center">
                {/* Content Wrapper - Max width for large screens */}
                <div className="w-full h-full max-w-[1920px] max-h-[1080px] mx-auto flex items-center justify-between px-[5vw] lg:px-[8vw]">

                    {/* Left Side - 3D Avatar */}
                    <div className="hidden lg:flex lg:w-[35%] xl:w-[32%] items-center justify-center">
                        <div className="relative w-full aspect-[3/4] max-w-[450px]">
                            <img
                                src={getAsset('Model')}
                                alt="3D Avatar"
                                className="w-full h-full object-contain"
                                style={{
                                    filter: isDark ? 'drop-shadow(0 20px 40px rgba(0, 0, 0, 0.6))' : 'drop-shadow(0 20px 40px rgba(0, 0, 0, 0.1))'
                                }}
                            />
                        </div>
                    </div>

                    {/* Right Side - Content */}
                    <div className="w-full lg:w-[65%] xl:w-[68%] flex flex-col items-center lg:items-start justify-center px-4 lg:px-0">
                        {/* Title Section */}
                        <div className="text-center lg:text-left mb-[6vh] lg:mb-[8vh]">
                            <h1 className={`text-[7vw] sm:text-[6vw] md:text-[5vw] lg:text-[3.5vw] xl:text-[3.2vw] 2xl:text-[60px] font-bold leading-tight mb-[1.5vh] ${isDark ? 'text-white' : 'text-black'
                                }`} style={{ letterSpacing: '-0.02em' }}>
                                What's Features
                            </h1>
                            <p className={`text-[4.5vw] sm:text-[3.5vw] md:text-[3vw] lg:text-[2vw] xl:text-[1.8vw] 2xl:text-[34px] ${isDark ? 'text-gray-300' : 'text-gray-700'
                                }`} style={{ letterSpacing: '-0.01em' }}>
                                That Feel Like They're Made For You ?
                            </p>
                        </div>

                        {/* Feature Cards Container */}
                        <div className="w-full max-w-[1000px] flex flex-col md:flex-row gap-[3vh] md:gap-[2.5vw] lg:gap-[3vw]">
                            {/* Principal Card */}
                            <div
                                onClick={() => navigate('/login')}
                                className={`group relative flex-1 rounded-[20px] md:rounded-[24px] lg:rounded-[28px] overflow-hidden transition-all duration-300 cursor-pointer ${isDark
                                    ? 'bg-gray-900/40 border-[3px] border-yellow-500 hover:border-yellow-400 shadow-2xl hover:shadow-yellow-500/60'
                                    : 'bg-white border-[3px] border-yellow-400 hover:border-yellow-500 shadow-xl hover:shadow-yellow-400/50'
                                    } hover:scale-[1.02] backdrop-blur-md`}
                            >
                                <div className="relative p-[4vh] md:p-[3.5vh] lg:p-[4.5vh] flex flex-col items-center text-center h-full min-h-[280px] md:min-h-[32vh] lg:min-h-[36vh]">
                                    {/* Icon Container */}
                                    <div className={`w-[18vw] h-[18vw] md:w-[12vw] md:h-[12vw] lg:w-[8vw] lg:h-[8vw] xl:w-[7vw] xl:h-[7vw] 2xl:w-[130px] 2xl:h-[130px] max-w-[130px] max-h-[130px] rounded-[16px] md:rounded-[20px] flex items-center justify-center mb-[2vh] md:mb-[2.5vh] transition-all duration-300 ${isDark ? 'bg-yellow-500/25' : 'bg-yellow-100'
                                        } group-hover:scale-110`}>
                                        <img
                                            src={getAsset('Principle')}
                                            alt="Principal"
                                            className="w-[85%] h-[85%] object-contain"
                                        />
                                    </div>

                                    {/* Text Content */}
                                    <div className="flex-1 flex flex-col justify-center">
                                        <h3 className={`text-[5.5vw] md:text-[3.5vw] lg:text-[2.2vw] xl:text-[2vw] 2xl:text-[38px] font-bold mb-[1.5vh] md:mb-[2vh] ${isDark ? 'text-yellow-400' : 'text-yellow-700'
                                            }`}>
                                            Principle
                                        </h3>
                                        <p className={`text-[3.2vw] md:text-[2vw] lg:text-[1.2vw] xl:text-[1.1vw] 2xl:text-[20px] leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-600'
                                            }`} style={{ lineHeight: '1.6' }}>
                                            Shaping Young Minds, Building Bright Future, With Dedication And Vision, The Principal Leads Both Teachers And Students
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Student Card */}
                            <div
                                onClick={() => navigate('/StudentPortal/login')}
                                className={`group relative flex-1 rounded-[20px] md:rounded-[24px] lg:rounded-[28px] overflow-hidden transition-all duration-300 cursor-pointer ${isDark
                                    ? 'bg-gray-900/40 border-[3px] border-blue-500 hover:border-blue-400 shadow-2xl hover:shadow-blue-500/60'
                                    : 'bg-white border-[3px] border-blue-400 hover:border-blue-500 shadow-xl hover:shadow-blue-400/50'
                                    } hover:scale-[1.02] backdrop-blur-md`}
                            >
                                <div className="relative p-[4vh] md:p-[3.5vh] lg:p-[4.5vh] flex flex-col items-center text-center h-full min-h-[280px] md:min-h-[32vh] lg:min-h-[36vh]">
                                    {/* Icon Container */}
                                    <div className={`w-[18vw] h-[18vw] md:w-[12vw] md:h-[12vw] lg:w-[8vw] lg:h-[8vw] xl:w-[7vw] xl:h-[7vw] 2xl:w-[130px] 2xl:h-[130px] max-w-[130px] max-h-[130px] rounded-[16px] md:rounded-[20px] flex items-center justify-center mb-[2vh] md:mb-[2.5vh] transition-all duration-300 ${isDark ? 'bg-blue-500/25' : 'bg-blue-100'
                                        } group-hover:scale-110`}>
                                        <img
                                            src={getAsset('student_login')}
                                            alt="Student"
                                            className="w-[85%] h-[85%] object-contain"
                                        />
                                    </div>

                                    {/* Text Content */}
                                    <div className="flex-1 flex flex-col justify-center">
                                        <h3 className={`text-[5.5vw] md:text-[3.5vw] lg:text-[2.2vw] xl:text-[2vw] 2xl:text-[38px] font-bold mb-[1.5vh] md:mb-[2vh] ${isDark ? 'text-blue-400' : 'text-blue-700'
                                            }`}>
                                            Student
                                        </h3>
                                        <p className={`text-[3.2vw] md:text-[2vw] lg:text-[1.2vw] xl:text-[1.1vw] 2xl:text-[20px] leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-600'
                                            }`} style={{ lineHeight: '1.6' }}>
                                            With A Student Account, You Can Discover New Ideas, Track Progress, And Unlock Your Potential Every Day
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Mobile Avatar - Shows only on mobile */}
                        <div className="lg:hidden w-full flex items-center justify-center mt-[6vh]">
                            <div className="relative w-[60vw] max-w-[300px] aspect-[3/4]">
                                <img
                                    src={getAsset('Model')}
                                    alt="3D Avatar"
                                    className="w-full h-full object-contain"
                                    style={{
                                        filter: isDark ? 'drop-shadow(0 20px 40px rgba(0, 0, 0, 0.6))' : 'drop-shadow(0 20px 40px rgba(0, 0, 0, 0.1))'
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default RoleFeatures;
