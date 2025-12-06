import React from "react";
import { useNavigate } from "react-router-dom";
import { getAsset } from "../../../utils/assets.js";

function RoleFeatures({ theme, isDark, toggleTheme, sidebardata }) {
    const navigate = useNavigate();

    return (
        <div className={`w-full min-h-screen relative overflow-hidden transition-all duration-300 ${isDark
            ? 'bg-linear-to-br from-slate-950 via-slate-900 to-slate-950'
            : 'bg-linear-to-br from-gray-50 via-white to-gray-100'
            }`}>
            {/* Subtle Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40">
                <div className={`absolute top-20 -left-20 w-96 h-96 rounded-full blur-3xl ${isDark ? 'bg-blue-900/20' : 'bg-blue-200/30'
                    }`} />
                <div className={`absolute bottom-20 -right-20 w-96 h-96 rounded-full blur-3xl ${isDark ? 'bg-purple-900/20' : 'bg-purple-200/30'
                    }`} />
            </div>

            {/* ===== Mobile/Tablet Layout ===== */}
            <div className="lg:hidden static w-full min-h-screen flex flex-col">
                {/* Full Screen Background with Model */}
                <div className="absolute inset-0 w-full h-full flex items-center justify-center">
                    {/* Model Image - Centered and Contained */}
                    <img
                        src={getAsset('Model')}
                        alt="3D Avatar"
                        className="w-full h-full object-contain object-center scale-110"
                    />

                    {/* Gradient Overlay - Stronger at bottom */}
                    <div className={`absolute inset-0 ${isDark
                        ? 'bg-linear-to-b from-slate-950/40 via-slate-900/60 to-slate-950'
                        : 'bg-linear-to-b from-white/30 via-gray-50/50 to-white'
                        }`} />
                </div>

                {/* Content Section - Positioned at Bottom */}
                <div className="relative z-20 mt-auto px-4 sm:px-6 pb-6 sm:pb-8">
                    {/* Title */}
                    <div className="text-center mb-6 sm:mb-8">
                        <h1 className={`text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-gray-900'
                            }`}>
                            Choose Your Role
                        </h1>
                        <p className={`text-sm sm:text-base md:text-lg mt-2 ${isDark ? 'text-gray-300' : 'text-gray-700'
                            }`}>
                            Select the option that best describes you
                        </p>
                    </div>

                    {/* Feature Cards - Stacked at Bottom */}
                    <div className="w-full max-w-lg mx-auto space-y-3 sm:space-y-4">
                        {/* Principal Card */}
                        <div
                            onClick={() => navigate('/login')}
                            className={`group relative rounded-2xl overflow-hidden transition-all duration-300 cursor-pointer backdrop-blur-lg ${isDark
                                ? 'bg-slate-900/95 border-2 border-yellow-500/60 hover:border-yellow-400/90 shadow-xl hover:shadow-yellow-500/40'
                                : 'bg-white/98 border-2 border-yellow-400/70 hover:border-yellow-500 shadow-xl hover:shadow-yellow-500/40'
                                } hover:scale-[1.02] hover:shadow-2xl`}
                        >
                            <div className="relative p-4 sm:p-5 flex items-center gap-3 sm:gap-4">
                                {/* Icon Container */}
                                <div className={`shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-xl flex items-center justify-center transition-all duration-300 ${isDark
                                    ? 'bg-yellow-500/30'
                                    : 'bg-yellow-100'
                                    } group-hover:scale-105`}>
                                    <img
                                        src={getAsset('Principle')}
                                        alt="Principal"
                                        className="w-12 h-12 sm:w-16 sm:h-16 object-contain"
                                    />
                                </div>

                                {/* Text Content */}
                                <div className="flex-1 min-w-0">
                                    <h3 className={`text-lg sm:text-xl font-bold mb-1 ${isDark ? 'text-yellow-400' : 'text-yellow-700'
                                        }`}>
                                        Principal
                                    </h3>
                                    <p className={`text-xs sm:text-sm leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-600'
                                        }`}>
                                        Manage school operations and lead your team
                                    </p>
                                </div>

                                {/* Arrow Icon */}
                                <div className="shrink-0">
                                    <svg className={`w-5 h-5 sm:w-6 sm:h-6 transition-transform duration-300 group-hover:translate-x-1 ${isDark ? 'text-yellow-400' : 'text-yellow-700'
                                        }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        {/* Student Card */}
                        <div
                            onClick={() => navigate('/StudentPortel/login')}
                            className={`group relative rounded-2xl overflow-hidden transition-all duration-300 cursor-pointer backdrop-blur-lg ${isDark
                                ? 'bg-slate-900/95 border-2 border-blue-500/60 hover:border-blue-400/90 shadow-xl hover:shadow-blue-500/40'
                                : 'bg-white/98 border-2 border-blue-400/70 hover:border-blue-500 shadow-xl hover:shadow-blue-500/40'
                                } hover:scale-[1.02] hover:shadow-2xl`}
                        >
                            <div className="relative p-4 sm:p-5 flex items-center gap-3 sm:gap-4">
                                {/* Icon Container */}
                                <div className={`shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-xl flex items-center justify-center transition-all duration-300 ${isDark
                                    ? 'bg-blue-500/30'
                                    : 'bg-blue-100'
                                    } group-hover:scale-105`}>
                                    <img
                                        src={getAsset('student_login')}
                                        alt="Student"
                                        className="w-12 h-12 sm:w-16 sm:h-16 object-contain"
                                    />
                                </div>

                                {/* Text Content */}
                                <div className="flex-1 min-w-0">
                                    <h3 className={`text-lg sm:text-xl font-bold mb-1 ${isDark ? 'text-blue-400' : 'text-blue-700'
                                        }`}>
                                        Student
                                    </h3>
                                    <p className={`text-xs sm:text-sm leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-600'
                                        }`}>
                                        Access your courses and track your progress
                                    </p>
                                </div>

                                {/* Arrow Icon */}
                                <div className="shrink-0">
                                    <svg className={`w-5 h-5 sm:w-6 sm:h-6 transition-transform duration-300 group-hover:translate-x-1 ${isDark ? 'text-blue-400' : 'text-blue-700'
                                        }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ===== Desktop Layout ===== */}
            <div className="hidden lg:flex lg:flex-row w-full min-h-screen items-center relative">
                {/* Left Side - 3D Avatar */}
                <div className="w-[40%] h-full flex items-center justify-center relative py-12">
                    {/* Subtle Decorative Circle */}
                    <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] rounded-full ${isDark ? 'bg-blue-900/10' : 'bg-blue-200/20'
                        } blur-3xl`} />

                    {/* Model Container */}
                    <div className="relative z-10">
                        <img
                            src={getAsset('Model')}
                            alt="3D Avatar"
                            className="h-[60vh] max-h-[550px] w-auto max-w-[450px] object-contain drop-shadow-2xl"
                            onError={(e) => {
                                e.target.style.display = 'none';
                            }}
                        />
                    </div>
                </div>

                {/* Right Side - Content */}
                <div className="w-[60%] flex flex-col items-start justify-center px-12 xl:px-20 py-12">
                    {/* Title Section */}
                    <div className="mb-12 max-w-3xl">
                        <h1 className={`text-5xl xl:text-6xl font-bold leading-tight mb-4 ${isDark ? 'text-white' : 'text-gray-900'
                            }`}>
                            Choose Your Role
                        </h1>
                        <p className={`text-xl xl:text-2xl ${isDark ? 'text-gray-400' : 'text-gray-600'
                            }`}>
                            Select the option that best describes you
                        </p>
                    </div>

                    {/* Feature Cards Container - Side by Side */}
                    <div className="grid grid-cols-2 gap-6 w-full max-w-4xl">
                        {/* Principal Card */}
                        <div
                            onClick={() => navigate('/login')}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => { if (e.key === 'Enter') navigate('/login') }}
                            className={`group relative rounded-2xl overflow-hidden transition-all duration-300 cursor-pointer ${isDark
                                ? 'bg-slate-900/80 border-2 border-yellow-500/40 hover:border-yellow-400/70 shadow-xl hover:shadow-yellow-500/20'
                                : 'bg-white border-2 border-yellow-400/50 hover:border-yellow-500/80 shadow-xl hover:shadow-yellow-500/20'
                                } hover:scale-[1.03] hover:shadow-2xl focus:outline-none focus:ring-4 ${isDark ? 'focus:ring-yellow-400/30' : 'focus:ring-yellow-500/40'
                                }`}
                        >
                            <div className="relative p-8 pb-16 min-h-[280px]">
                                {/* Icon Container */}
                                <div className={`w-24 h-24 rounded-2xl flex items-center justify-center mb-6 transition-all duration-300 ${isDark
                                    ? 'bg-yellow-500/20'
                                    : 'bg-yellow-100'
                                    } group-hover:scale-110`}>
                                    <img
                                        src={getAsset('Principle')}
                                        alt="Principal"
                                        className="w-20 h-20 object-contain"
                                    />
                                </div>

                                {/* Text Content */}
                                <div className="pr-12">
                                    <h3 className={`text-2xl font-bold mb-3 ${isDark ? 'text-yellow-400' : 'text-yellow-700'
                                        }`}>
                                        Principal
                                    </h3>
                                    <p className={`text-base leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-600'
                                        }`}>
                                        Manage school operations, oversee staff, and lead your educational institution
                                    </p>
                                </div>

                                {/* Arrow Icon - Fixed Position */}
                                <div className="absolute bottom-6 right-6">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${isDark ? 'bg-yellow-500/20' : 'bg-yellow-400/30'
                                        } group-hover:translate-x-1`}>
                                        <svg className={`w-5 h-5 ${isDark ? 'text-yellow-400' : 'text-yellow-700'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Student Card */}
                        <div
                            onClick={() => navigate('/StudentPortel/login')}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => { if (e.key === 'Enter') navigate('/StudentPortel/login') }}
                            className={`group relative rounded-2xl overflow-hidden transition-all duration-300 cursor-pointer ${isDark
                                ? 'bg-slate-900/80 border-2 border-blue-500/40 hover:border-blue-400/70 shadow-xl hover:shadow-blue-500/20'
                                : 'bg-white border-2 border-blue-400/50 hover:border-blue-500/80 shadow-xl hover:shadow-blue-500/20'
                                } hover:scale-[1.03] hover:shadow-2xl focus:outline-none focus:ring-4 ${isDark ? 'focus:ring-blue-400/30' : 'focus:ring-blue-500/40'
                                }`}
                        >
                            <div className="relative p-8 pb-16 min-h-[280px]">
                                {/* Icon Container */}
                                <div className={`w-24 h-24 rounded-2xl flex items-center justify-center mb-6 transition-all duration-300 ${isDark
                                    ? 'bg-blue-500/20'
                                    : 'bg-blue-100'
                                    } group-hover:scale-110`}>
                                    <img
                                        src={getAsset('student_login')}
                                        alt="Student"
                                        className="w-20 h-20 object-contain"
                                    />
                                </div>

                                {/* Text Content */}
                                <div className="pr-12">
                                    <h3 className={`text-2xl font-bold mb-3 ${isDark ? 'text-blue-400' : 'text-blue-700'
                                        }`}>
                                        Student
                                    </h3>
                                    <p className={`text-base leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-600'
                                        }`}>
                                        Access your courses, track progress, and unlock your full potential
                                    </p>
                                </div>

                                {/* Arrow Icon - Fixed Position */}
                                <div className="absolute bottom-6 right-6">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${isDark ? 'bg-blue-500/20' : 'bg-blue-400/30'
                                        } group-hover:translate-x-1`}>
                                        <svg className={`w-5 h-5 ${isDark ? 'text-blue-400' : 'text-blue-700'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default RoleFeatures;
