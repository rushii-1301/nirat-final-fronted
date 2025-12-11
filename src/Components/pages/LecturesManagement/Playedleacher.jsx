import React, { useState, useEffect } from "react";
import Sidebar from "../../Tools/Sidebar.jsx";
import Header from "../../Tools/Header.jsx";
import { BACKEND_API_URL } from "../../../utils/assets.js";
import { useNavigate } from "react-router-dom";
import { Play } from "lucide-react";
import axios from "axios";

// Lecture Card Component
const LectureCard = ({ lecture, isDark }) => {
    const navigate = useNavigate();

    return (
        <div
            onClick={() => navigate("/lecture/LectureVideo", { state: { lecturejson: lecture.lecture_url } })}
            className={`rounded-lg overflow-hidden ${isDark ? 'bg-zinc-900' : 'bg-white'} border border-transparent cursor-pointer h-full transition-all duration-200`}
        >
            {/* Video Thumbnail/Player Area (placeholder block, no real image) */}
            <div className={`relative ${isDark ? 'bg-zinc-800' : 'bg-zinc-200'} h-[150px] mx-auto overflow-hidden`}>
                <div className="absolute inset-0 flex items-center justify-center bg-black/10 hover:bg-black/20 transition-all duration-200">
                    <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center transform hover:scale-110 transition duration-300">
                        <Play fill="black" className="w-6 h-6 ml-1" />
                    </div>
                </div>

                {/* Duration Badge - Only show if duration exists */}
                {lecture.duration && (
                    <span className="absolute bottom-2 right-2 text-xs font-semibold px-2 py-0.5 rounded bg-black/60 text-white">
                        {lecture.duration}
                    </span>
                )}
            </div>

            {/* Lecture Info */}
            <div className="p-3 text-sm space-y-1">
                <p className={`${isDark ? 'text-gray-300' : 'text-zinc-800'} font-medium line-clamp-2`}>
                    <span className="font-semibold">Chapter:- </span> {lecture.title}
                </p>
                <p className={`${isDark ? 'text-gray-400' : 'text-zinc-600'} text-xs`}>
                    <span className="font-medium">Subject:- </span> {lecture.subject || 'General'}
                </p>
            </div>
        </div>
    );
};

function Playedleacher({ theme, isDark, toggleTheme, sidebardata }) {
    const resolvedDark = typeof isDark === 'boolean' ? isDark : theme === 'dark';
    const [lectureData, setLectureData] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [totalCount, setTotalCount] = useState(0);

    // Search state for header search bar
    const [searchValue, setSearchValue] = useState("");

    // Fetch played lectures from API
    const fetchPlayedLectures = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem("access_token");
            const response = await axios.get(`${BACKEND_API_URL}/lectures/public_lecture/played`, {
                headers: {
                    'Accept': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
            });

            if (response.data?.status && response.data?.data) {
                const { lectures, count } = response.data.data;
                setLectureData(lectures || []);
                setTotalCount(count || 0);
            } else {
                setLectureData([]);
                setTotalCount(0);
            }
        } catch (error) {
            console.error("Error fetching played lectures:", error);
            setLectureData([]);
            setTotalCount(0);
        } finally {
            setIsLoading(false);
        }
    };

    // Fetch lectures on component mount
    useEffect(() => {
        fetchPlayedLectures();
    }, []);

    // Filter lectures based on search (title + subject)
    const filteredLectures = React.useMemo(() => {
        const query = searchValue.trim().toLowerCase();
        if (!query) return lectureData;

        return lectureData.filter((lecture) => {
            const title = (lecture.title || "").toLowerCase();
            const subject = (lecture.subject || "").toLowerCase();

            return title.includes(query) || subject.includes(query);
        });
    }, [searchValue, lectureData]);

    return (
        <div className={`flex ${resolvedDark ? "bg-zinc-950 text-gray-100" : "bg-[#F5F5F9] text-zinc-900"} h-screen transition-colors duration-300`}>
            {/* Sidebar */}
            <Sidebar isDark={resolvedDark} sidebardata={sidebardata} />

            {/* Main Content (offset for fixed sidebar) */}
            <div className={`flex flex-col min-h-0 h-screen w-full md:ml-15 lg:ml-72 p-2 md:p-7 pb-0 transition-all duration-300`}>
                {/* ===== Sticky Header ===== */}
                <div className="sticky top-0 z-20">
                    <Header
                        title="Lecture Management"
                        isDark={resolvedDark}
                        toggleTheme={toggleTheme}
                        isSearchbar={true}
                        searchValue={searchValue}
                        setSearchValue={setSearchValue}
                    />
                </div>

                {/* ===== Main Section (only grid scrolls) ===== */}
                <main className="mt-6 flex-1 flex flex-col min-h-0">
                    {/* Played Lecture Heading (non-scrolling) */}
                    <div className={`shrink-0 text-base md:text-lg w-full font-semibold px-4 py-3 inline-flex items-center justify-between border border-transparent rounded ${resolvedDark ? 'bg-zinc-900 text-white' : 'bg-white text-zinc-700'} mb-5`}>
                        <span>Played Lectures</span>
                        {totalCount > 0 && (
                            <span className={`text-sm font-normal ${resolvedDark ? 'text-gray-400' : 'text-zinc-600'}`}>
                                Total: {totalCount}
                            </span>
                        )}
                    </div>

                    {/* Lecture Grid (scrollable) */}
                    <section className="flex-1 overflow-y-auto no-scrollbar">
                        {isLoading ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-[1fr] items-stretch">
                                {[...Array(6)].map((_, index) => (
                                    <div key={index} className={`rounded-lg overflow-hidden ${resolvedDark ? 'bg-zinc-900' : 'bg-white'} border border-transparent h-full animate-pulse`}>
                                        <div className={`${resolvedDark ? 'bg-zinc-800' : 'bg-zinc-200'} h-[150px]`}></div>
                                        <div className="p-3 space-y-2">
                                            <div className={`h-4 w-3/4 rounded ${resolvedDark ? 'bg-zinc-800' : 'bg-zinc-200'}`}></div>
                                            <div className={`h-3 w-1/2 rounded ${resolvedDark ? 'bg-zinc-800' : 'bg-zinc-200'}`}></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : filteredLectures.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-64">
                                <div className={`w-20 h-20 rounded-full mb-4 flex items-center justify-center ${resolvedDark ? 'bg-zinc-800' : 'bg-zinc-200'}`}>
                                    <Play className={`w-10 h-10 ${resolvedDark ? 'text-zinc-600' : 'text-zinc-400'}`} />
                                </div>
                                <p className={`text-lg font-semibold ${resolvedDark ? 'text-gray-300' : 'text-zinc-700'}`}>No Played Lectures</p>
                                <p className={`text-sm ${resolvedDark ? 'text-gray-500' : 'text-zinc-500'}`}>Start watching lectures to see them here</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-[1fr] items-stretch">
                                {filteredLectures.map((lecture) => (
                                    <LectureCard key={lecture.lecture_id} lecture={lecture} isDark={resolvedDark} />
                                ))}
                            </div>
                        )}
                    </section>
                </main>
            </div>
        </div>
    );
}

export default Playedleacher;