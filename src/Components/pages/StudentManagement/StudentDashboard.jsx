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
    const outerRadius = 115;
    const innerRadius = 85;
    const outerCirc = 2 * Math.PI * outerRadius;
    const innerCirc = 2 * Math.PI * innerRadius;

    // Example percentages (replace with real data when available)
    const [playedPercent, setPlayedPercent] = useState(65); // outer
    const [sharedPercent, setSharedPercent] = useState(35); // inner

    const [totalStudent, setTotalStudent] = useState(0);
    const [totalWatchedLecture, setTotalWatchedLecture] = useState(0);
    const [totalPaid, setTotalPaid] = useState(0);

    const [progressFactor, setProgressFactor] = useState();
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
                const url = isAdminPath
                    ? `${BACKEND_API_URL}/admin-portal/student-management/dashboard`
                    : `${BACKEND_API_URL}/dashboard/student`;

                const res = await axios.get(
                    url,
                    {
                        headers: {
                            accept: "application/json",
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                // Handle the new API response structure
                const root = res.data || {};
                const data = root.data || {};

                // API response has student_metrics at root.data level based on new JSON structure
                const metrics = data.student_metrics || {};
                const progress = metrics.progress || {};

                // Extract values directly from metrics object based on the new JSON structure
                const total_students_val = metrics.total_students ?? 0;
                const total_lectures_val = metrics.total_lectures ?? 0;
                const total_paid_val = metrics.total_paid ?? 0;

                const completedLectures = progress.completed_lectures ?? 0;
                const totalAvailableLectures = progress.total_available_lectures ?? 0;

                const progressPercent = progress.progress_percentage ?? 0;

                // Calculate completion percent for second ring
                const completionPercent = totalAvailableLectures > 0
                    ? (Number(completedLectures) / Number(totalAvailableLectures)) * 100
                    : 0;

                setTotalStudent(Number(total_students_val));
                setTotalWatchedLecture(Number(total_lectures_val));
                setTotalPaid(Number(total_paid_val));
                setPlayedPercent(Number(progressPercent));
                setSharedPercent(Number(completionPercent));
            } catch (error) {
                console.error("Failed to fetch student dashboard", error);
                handleerror("Failed to load student dashboard");
            } finally {
                setLoading(false);
            }
        };

        fetchDashboard();
    }, [isAdminPath]);

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
        <div className={`flex ${isDark ? "bg-zinc-950 text-gray-100" : "bg-[#F5F5F9] text-zinc-900"} h-screen transition-colors duration-300`}>
            {/* Sidebar */}
            <Sidebar isDark={isDark} sidebardata={sidebardata} />

            {/* Main Content (offset for fixed sidebar) */}
            <div className={`flex flex-col min-h-0 h-screen w-full md:ml-15 lg:ml-72 p-2 md:p-7 pb-0 transition-all duration-300`}>
                {/* ===== Sticky Header ===== */}
                <div className="sticky top-0 z-20">
                    <Header title="Student Management" isDark={isDark} toggleTheme={toggleTheme}
                        isBack={isAdminPath ? true : false}
                        backValue={isAdminPath ? -1 : 0}
                    />
                </div>

                {/* ===== Main Section (scrollable) ===== */}
                <main className="mt-6 flex-1 overflow-y-auto no-scrollbar space-y-6">
                    {/* ---- Stat Cards (Top Row) ---- */}
                    <div className={`grid grid-cols-2 md:grid-cols-2 gap-6 auto-rows-[minmax(90px,auto)] ${isAdminPath ? 'xl:grid-cols-3' : 'xl:grid-cols-4'}`}>
                        {loading ? (
                            // Loading skeleton cards
                            [...Array(isAdminPath ? 3 : 4)].map((_, i) => (
                                <div key={`skeleton-${i}`} className={`${isDark ? 'bg-zinc-900' : 'bg-white'} border border-transparent rounded-2xl p-5 flex flex-col justify-between min-h-[120px] animate-pulse`}>
                                    <div className="flex items-center gap-2">
                                        <div className={`w-4 h-4 rounded-full ${isDark ? 'bg-zinc-800' : 'bg-zinc-200'}`}></div>
                                        <div className={`h-3 w-24 rounded-full ${isDark ? 'bg-zinc-800' : 'bg-zinc-200'}`}></div>
                                    </div>
                                    <div className={`mt-4 h-6 w-16 rounded-full ${isDark ? 'bg-zinc-800' : 'bg-zinc-200'}`}></div>
                                </div>
                            ))
                        ) : (
                            [
                                { title: 'Total Student', value: totalStudent, to: '/student/list' },
                                { title: 'Total Lectures List', value: totalWatchedLecture, to: '/student/lectures' },
                                { title: 'Total Paid', value: totalPaid, to: '/student/paid' },
                                ...(isAdminPath ? [] : [{ title: 'Add Student', value: 'none', to: '/student/Add' }]),
                            ].map((card, i) => {
                                const cardClass = `${isDark ? 'bg-zinc-900' : 'bg-white'} border border-transparent rounded-2xl p-5 flex flex-col justify-between min-h-[120px] transition ${isAdminPath ? 'cursor-default' : 'cursor-pointer'}`;
                                const content = (
                                    <>
                                        <div className="flex items-center gap-2">
                                            <img src={isDark ? getAsset('Eyes_dark') : getAsset('Eyes_light')} alt="icon" className="w-4 h-4" />
                                            <div className={`text-[12px] md:text-sm font-medium ${isDark ? 'text-white' : 'text-[#696CFF]'}`}>{card.title}</div>
                                        </div>
                                        {card.value !== 'none'
                                            ? <div className={`mt-3 text-2xl md:text-3xl font-bold ${isDark ? 'text-white' : 'text-zinc-900'}`}>{card.value}</div>
                                            :
                                            <div className="mt-3">
                                                <UserPlus className={`w-6 h-6 ${isDark ? 'text-white' : 'text-zinc-900'}`} />
                                            </div>
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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[1.1fr_0.6fr_0.5fr] gap-2 mb-2">
                        <div className={`${isDark ? "bg-zinc-900" : "bg-white"} border border-transparent p-6 pb-0 rounded-2xl flex flex-col gap-0 md:col-span-2 xl:col-span-1`}>
                            <h3 className={`text-2xl font-semibold ${isDark ? "text-white" : "text-[#141522]"}`}>History</h3>

                            {/* Chart Container */}
                            <div className="grid place-items-center mt-4">
                                {loading ? (
                                    <div className="flex flex-col items-center w-full animate-pulse">
                                        <div className={`rounded-full w-40 h-40 ${isDark ? 'bg-zinc-800' : 'bg-zinc-200'}`} />
                                        <div className="w-full mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
                                            {Array.from({ length: 2 }).map((_, i) => (
                                                <div
                                                    key={i}
                                                    className={`flex items-center w-fit justify-between gap-4 rounded-2xl px-4 py-3 border border-transparent ${isDark ? "bg-zinc-800" : "bg-[#F5F5F9]"}`}
                                                >
                                                    <div className="flex items-center gap-2 text-sm font-medium">
                                                        <span className={`w-8 h-8 rounded-full grid place-items-center ${isDark ? 'bg-zinc-800' : 'bg-white'}`}>
                                                            <div className={`${isDark ? 'bg-zinc-800' : 'bg-zinc-200'} w-4 h-4 rounded-full`} />
                                                        </span>
                                                        <div className={`${isDark ? 'bg-zinc-800' : 'bg-zinc-200'} h-3 w-20 rounded-full`} />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="w-full">
                                        <div className="relative w-full max-w-[300px] aspect-square mx-auto">
                                            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg">
                                                <circle cx="150" cy="150" r={outerRadius} stroke={isDark ? '#3f3f46' : '#e4e4e7'} strokeWidth="14" fill="none" />
                                                <circle cx="150" cy="150" r={innerRadius} stroke={isDark ? '#3f3f46' : '#e4e4e7'} strokeWidth="14" fill="none" />

                                                <circle
                                                    cx="150"
                                                    cy="150"
                                                    r={outerRadius}
                                                    stroke={isDark ? '#9BDCF2' : '#C3EBFA'}
                                                    strokeWidth="14"
                                                    strokeLinecap="round"
                                                    fill="none"
                                                    strokeDasharray={outerCirc}
                                                    strokeDashoffset={outerOffset}
                                                    style={{ transition: 'stroke-dashoffset 1s ease' }}
                                                />

                                                <circle
                                                    cx="150"
                                                    cy="150"
                                                    r={innerRadius}
                                                    stroke={isDark ? '#F7D64A' : '#FEE55A'}
                                                    strokeWidth="14"
                                                    strokeLinecap="round"
                                                    fill="none"
                                                    strokeDasharray={innerCirc}
                                                    strokeDashoffset={innerOffset}
                                                    style={{ transition: 'stroke-dashoffset 1s ease' }}
                                                    transform={`rotate(${innerRotation} 150 150)`}
                                                />
                                            </svg>
                                        </div>

                                        {/* Bottom Labels */}
                                        <div className="w-full my-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
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
                                                    className={`flex items-center justify-between rounded-2xl px-4 py-3 border border-transparent ${isDark ? "bg-zinc-800" : "bg-[#F5F5F9]"}`}
                                                >
                                                    <div className="flex items-center gap-2 text-sm font-medium">
                                                        <span className={`w-8 h-8 rounded-full grid place-items-center ${isDark ? 'bg-[#262732]' : 'bg-white'}`}>
                                                            <img src={chip.icon} alt={chip.label} className="w-4 h-4" />
                                                        </span>
                                                        <span>{chip.label}</span>
                                                    </div>
                                                    <div className={`${isDark ? 'text-white/50' : 'text-zinc-900'}`}>|</div>
                                                    <div className="flex items-center gap-2">
                                                        <div className={`w-3.5 h-3.5 rounded-full ${legendDotColors[chip.key]}`}></div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* placeholders only on large screens to balance grid */}
                        <div className="hidden lg:block"></div>
                        <div className="hidden lg:block"></div>
                    </div>
                </main>
            </div>
        </div>
    );
}

export default StudentDashboard;
