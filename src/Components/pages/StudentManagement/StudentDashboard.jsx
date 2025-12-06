// ================== Api Colling ==============
import React, { useEffect, useState } from "react";

import Sidebar from "../../Tools/Sidebar.jsx";
import Header from "../../Tools/Header.jsx";
import { getAsset, BACKEND_API_URL, handleerror } from "../../../utils/assets.js";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { UserPlus, Loader2 } from "lucide-react";
import axios from "axios";

function StudentDashboard({ theme, isDark, toggleTheme, sidebardata }) {
    const location = useLocation();
    const pathname = location.pathname || "";
    const isAdminPath = /^\/admin\//i.test(pathname);

    const navigate = useNavigate();

    // Circle math (match AdminDashboard)
    const outerRadius = 100;
    const innerRadius = 70;
    const outerCirc = 2 * Math.PI * outerRadius;
    const innerCirc = 2 * Math.PI * innerRadius;

    // Example percentages (replace with real data when available)
    const [playedPercent, setPlayedPercent] = useState(65); // outer
    const [sharedPercent, setSharedPercent] = useState(35); // inner

    const [totalStudent, setTotalStudent] = useState(0);
    const [totalWatchedLecture, setTotalWatchedLecture] = useState(0);
    const [totalPaid, setTotalPaid] = useState(0);

    const [progressFactor, setProgressFactor] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem("access_token");
        if (!token) {
            console.warn("Student access_token not found in localStorage");
            return;
        }

        const fetchDashboard = async () => {
            setLoading(true);
            try {
                const res = await axios.get(
                    `${BACKEND_API_URL}/dashboard/student`,
                    {
                        headers: {
                            accept: "application/json",
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                const root = res.data || {};
                const data = root.data || root;
                const metrics = data.student_metrics || {};
                const progress = metrics.progress || {};

                const total_students = metrics.total_students ?? 0;
                const totalLectures = metrics.total_lectures ?? 0;
                const completedLectures = progress.completed_lectures ?? 0;
                const totalAvailableLectures =
                    progress.total_available_lectures ?? totalLectures ?? 0;

                const progressPercent = progress.progress_percentage ?? 0;
                const completionPercent =
                    totalAvailableLectures > 0
                        ? (Number(completedLectures) / Number(totalAvailableLectures)) * 100
                        : 0;

                setTotalStudent(Number(total_students) || 0);
                setTotalWatchedLecture(Number(totalLectures) || 0);
                setTotalPaid(Number(completedLectures) || 0);
                setPlayedPercent(Number(progressPercent) || 0);
                setSharedPercent(Number(completionPercent) || 0);
            } catch (error) {
                console.error("Failed to fetch student dashboard", error);
                handleerror("Failed to load student dashboard");
            } finally {
                setLoading(false);
            }
        };

        fetchDashboard();
    }, []);

    useEffect(() => {
        setProgressFactor(0);
        const raf = requestAnimationFrame(() => {
            const raf2 = requestAnimationFrame(() => setProgressFactor(1));
            return () => cancelAnimationFrame(raf2);
        });
        return () => cancelAnimationFrame(raf);
    }, [playedPercent, sharedPercent]);

    const outerOffset = outerCirc - (outerCirc * playedPercent * progressFactor) / 100;
    const innerOffset = innerCirc - (innerCirc * sharedPercent * progressFactor) / 100;
    const innerRotation = (playedPercent / 100) * 360; // start inner after outer arc

    const lectureCardClass = isDark
        ? "bg-[#0F1014] border-[#1e1f25] text-white"
        : "bg-white border-[#EAECF5] text-[#141522]";
    const legendCardClass = isDark
        ? "bg-[#1B1C22] border border-[#2A2B32] text-white"
        : "bg-[#F6F7FC] border border-[#E4E7F2] text-[#141522]";
    const legendDotColors = {
        pending: 'bg-[#9BDCF2]',
        all: 'bg-[#F6D96F]',
    };

    return (
        <div className={`flex ${isDark ? "bg-zinc-950 text-gray-100" : "bg-zinc-50 text-zinc-900"} h-screen transition-colors duration-300`}>
            {/* Sidebar */}
            <Sidebar isDark={isDark} sidebardata={sidebardata} />

            {/* Main Content (offset for fixed sidebar) */}
            <div className={`flex flex-col min-h-0 h-screen w-full md:ml-15 lg:ml-72 p-2 md:p-7 pb-0 transition-all duration-300`}>
                {/* ===== Sticky Header ===== */}
                <div className="sticky top-0 z-20">
                    <Header title="Student Management" isDark={isDark} toggleTheme={toggleTheme} />
                </div>

                {/* ===== Main Section (scrollable) ===== */}
                <main className="mt-6 flex-1 overflow-y-auto no-scrollbar">
                    <div className="w-full mx-auto space-y-8">
                        {/* ---- Stat Cards (Top Row) ---- */}
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 auto-rows-[minmax(140px,auto)] w-full mt-1 mx-auto px-1">
                            {loading ? (
                                // Loading skeleton cards
                                [...Array(4)].map((_, i) => (
                                    <div key={`skeleton-${i}`} className={`${isDark ? 'bg-[#0D0D11] border-[#1c1c24]' : 'bg-white border-[#E4E7F2]'} border rounded-3xl shadow px-5 py-6 flex flex-col justify-between`}>
                                        <div className="flex items-center gap-2">
                                            <div className={`w-4 h-4 rounded ${isDark ? 'bg-gray-700' : 'bg-gray-200'} animate-pulse`}></div>
                                            <div className={`h-4 w-24 rounded ${isDark ? 'bg-gray-700' : 'bg-gray-200'} animate-pulse`}></div>
                                        </div>
                                        <div className={`mt-3 h-8 w-16 rounded ${isDark ? 'bg-gray-700' : 'bg-gray-200'} animate-pulse`}></div>
                                    </div>
                                ))
                            ) : (
                                [
                                    { title: 'Total Student', value: totalStudent, to: '/student/list' },
                                    { title: 'Total Lectures List', value: totalWatchedLecture, to: '/student/lectures' },
                                    { title: 'Total Paid', value: totalPaid, to: '/student/paid' },
                                    { title: 'Add Student', value: 'none', to: '/student/Add' },
                                ].map((card, i) => {
                                    const cardClass = `${isDark ? 'bg-[#0D0D11] border-[#1c1c24]' : 'bg-white border-[#E4E7F2]'} border rounded-[24px] shadow px-5 py-6 flex flex-col justify-between transition ${isAdminPath ? 'cursor-default' : 'cursor-pointer hover:-translate-y-0.5'}`;
                                    const content = (
                                        <>
                                            <div className="flex items-center gap-2">
                                                <img src={isDark ? getAsset('Eyes_dark') : getAsset('Eyes_light')} alt="icon" className="w-4 h-4" />
                                                <div className={`text-[12px] md:text-sm font-medium ${isDark ? 'text-white' : 'text-[#696CFF]'}`}>{card.title}</div>
                                            </div>
                                            {card.value !== 'none'
                                                ? <div className={`mt-3 text-2xl md:text-3xl font-bold ${isDark ? 'text-white' : 'text-zinc-900'}`}>{card.value}</div>
                                                :
                                                <UserPlus className={`w-6 h-6 ${isDark ? 'text-white' : 'text-zinc-900'}`} />
                                            }
                                        </>
                                    );

                                    if (isAdminPath) {
                                        return (
                                            <div key={i} className={cardClass}>
                                                {content}
                                            </div>
                                        );
                                    }

                                    return (
                                        <div onClick={() => navigate(card.to)} key={i} className={cardClass}>
                                            {content}
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* ---- Total Lecture Chart (Second Row) ---- */}
                        {/* ---- History ---- */}
                        <div className="space-y-4 mx-auto px-1">
                            <h2 className={`text-base md:text-lg font-semibold ${isDark ? 'text-white' : 'text-zinc-900'}`}>History</h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[1.1fr_0.6fr_0.5fr] gap-6">
                                <div className={`${lectureCardClass} border p-5 pb-4 sm:p-8 sm:pb-3 mb-2 rounded-4xl shadow-xl flex flex-col gap-6 md:col-span-2 lg:col-span-2 xl:col-span-1`}>
                                    <h3 className="text-lg font-medium">Student Progress</h3>

                                    {/* SVG Rounded Rings */}
                                    <div className="grid place-items-center">
                                        {loading ? (
                                            <div className="relative w-[200px] h-[200px] md:w-[260px] md:h-[260px] flex items-center justify-center">
                                                <Loader2 className={`w-12 h-12 animate-spin ${isDark ? 'text-white' : 'text-zinc-900'}`} />
                                            </div>
                                        ) : (
                                            <div className="relative w-[200px] h-[200px] md:w-[260px] md:h-[260px]">
                                                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 220 220" xmlns="http://www.w3.org/2000/svg">
                                                    <circle cx="110" cy="110" r={outerRadius} stroke={isDark ? '#27272a' : '#eef0f5'} strokeWidth="10" fill="none" />
                                                    <circle cx="110" cy="110" r={innerRadius} stroke={isDark ? '#27272a' : '#f1f5f9'} strokeWidth="10" fill="none" />

                                                    <circle
                                                        cx="110"
                                                        cy="110"
                                                        r={outerRadius}
                                                        stroke={isDark ? '#9BDCF2' : '#C3EBFA'}
                                                        strokeWidth="10"
                                                        strokeLinecap="round"
                                                        fill="none"
                                                        strokeDasharray={outerCirc}
                                                        strokeDashoffset={outerOffset}
                                                        style={{ transition: 'stroke-dashoffset 1s ease' }}
                                                    />

                                                    <circle
                                                        cx="110"
                                                        cy="110"
                                                        r={innerRadius}
                                                        stroke={isDark ? '#F7D64A' : '#FEE55A'}
                                                        strokeWidth="10"
                                                        strokeLinecap="round"
                                                        fill="none"
                                                        strokeDasharray={innerCirc}
                                                        strokeDashoffset={innerOffset}
                                                        style={{ transition: 'stroke-dashoffset 1s ease' }}
                                                        transform={`rotate(${innerRotation} 110 110)`}
                                                    />
                                                </svg>
                                            </div>
                                        )}
                                    </div>

                                    {/* Bottom Labels */}
                                    <div className="w-full mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2">
                                        {[{
                                            key: 'pending',
                                            label: 'Student Progress',
                                            icon: isDark ? getAsset('student_progress_dark') : getAsset('student_progress_light'),
                                        }, {
                                            key: 'all',
                                            label: 'Student Active',
                                            icon: isDark ? getAsset('student_active_dark') : getAsset('student_active_light'),
                                        }].map((chip) => (
                                            <div
                                                key={chip.key}
                                                className={`${legendCardClass} flex flex-wrap md:flex-nowrap items-center justify-between gap-3 sm:gap-5 rounded-2xl px-4 py-4 transition-colors w-full`}
                                            >
                                                <div className="flex items-center gap-3 text-sm font-medium">
                                                    <span className={`w-9 h-9 rounded-full grid place-items-center ${isDark ? 'bg-[#262732]' : 'bg-white'}`}>
                                                        <img src={chip.icon} alt={chip.label} className="w-4 h-4" />
                                                    </span>
                                                    <span>{chip.label}</span>
                                                </div>
                                                <div className="flex items-center gap-5 sm:gap-3">
                                                    <span className={`h-9 w-0.5 rounded-full ${isDark ? 'bg-white/25' : 'bg-zinc-900/30'}`}></span>
                                                    <span className={`w-3.5 h-3.5 rounded-full ${legendDotColors[chip.key]}`}></span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* placeholders only on large screens to balance grid */}
                                <div className="hidden lg:block"></div>
                                <div className="hidden lg:block"></div>
                            </div>
                        </div>

                    </div>
                </main>
            </div>
        </div>
    );
}

export default StudentDashboard;