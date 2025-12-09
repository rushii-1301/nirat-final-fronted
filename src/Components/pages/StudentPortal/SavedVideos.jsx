import React, { useState } from "react";
import { Play, Trash2, Calendar, CreditCard } from "lucide-react";
import Sidebar from "../../Tools/Sidebar.jsx";
import Portalheader from "../../Tools/Portalheader.jsx";

function SavedVideos({ isDark, toggleTheme, sidebardata }) {
    const shellBg = isDark ? "bg-black text-[#E5E7EB]" : "bg-[#F5F7FB] text-[#0F172A]";
    const [videos, setVideos] = useState([
        { id: 1, title: "Mathematics", chapters: 20, date: "12/11/25", price: "₹2999" },
        { id: 2, title: "Mathematics", chapters: 10, date: "12/11/25", price: "₹2999" },
        { id: 3, title: "Mathematics", chapters: 50, date: "12/11/25", price: "₹3000" },
        { id: 4, title: "English", chapters: 20, date: "12/11/24", price: "₹2999" },
    ]);
    const [videoToDelete, setVideoToDelete] = useState(null);
    const [searchValue, setSearchValue] = useState("");

    // Filter videos based on search value
    const filteredVideos = videos.filter(video =>
        video.title.toLowerCase().includes(searchValue.toLowerCase()) ||
        video.price.includes(searchValue) ||
        video.chapters.toString().includes(searchValue) ||
        video.date.includes(searchValue)
    );

    const handleConfirmDelete = () => {
        if (!videoToDelete) return;
        setVideos((prev) => prev.filter((v) => v.id !== videoToDelete.id));
        setVideoToDelete(null);
    };

    return (
        <div className={`flex ${shellBg} h-screen transition-colors duration-300`}>
            {/* Sidebar */}
            <Sidebar isDark={isDark} sidebardata={sidebardata} />

            {/* Main Content (offset for fixed sidebar) */}
            <div className={`flex flex-col min-h-0 h-screen w-full md:ml-15 lg:ml-72 px-0 pb-0 transition-all duration-300`}>
                {/* Sticky Header */}
                <div className="sticky top-0 z-20">
                    <Portalheader title="Saved Videos" isDark={isDark} toggleTheme={toggleTheme} isSearchbar={true} searchValue={searchValue} setSearchValue={setSearchValue} />
                </div>

                {/* Main Section */}
                <main className="mt-6 flex-1 flex flex-col min-h-0 px-4 md:px-8">
                    <div className="relative flex-1 min-h-0">
                        <div className="w-full h-full flex flex-col">
                            <div className="mb-5">
                                <h2 className="text-base md:text-lg font-semibold">Saved Videos</h2>
                                <p
                                    className={`text-xs md:text-sm mt-1 ${
                                        isDark ? "text-zinc-400" : "text-zinc-600"
                                    }`}
                                >
                                    Your collection of saved videos, ready to play.
                                </p>
                            </div>

                            {/* List of saved video cards (scrollable area) */}
                            <div className="flex-1 overflow-y-auto no-scrollbar flex flex-col gap-4 md:gap-5">
                                {filteredVideos.length > 0 ? (
                                    filteredVideos.map((video) => (
                                    <div
                                        key={video.id}
                                        className={`${
                                            isDark
                                                ? "bg-zinc-900 border-zinc-800"
                                                : "bg-white border-zinc-200"
                                        } border rounded-2xl px-4 md:px-6 py-4 md:py-5 flex items-center justify-between gap-4`}
                                    >
                                        {/* Left: play button + text + meta */}
                                        <div className="flex items-center gap-4 md:gap-5 flex-1">
                                            <button
                                                type="button"
                                                className={`${
                                                    isDark
                                                        ? "bg-white text-black"
                                                        : "bg-[#3333331A] text-black"
                                                } w-15 h-15 md:w-11 md:h-11 cursor-pointer
                                                 rounded-lg flex items-center justify-center`}
                                            >
                                                <Play className="w-5 h-5" />
                                            </button>

                                            <div className="flex flex-col gap-1">
                                                <h3 className="text-sm md:text-base font-semibold">
                                                    {video.title}
                                                </h3>
                                                <p
                                                    className={`text-xs md:text-sm ${
                                                        isDark ? "text-zinc-300" : "text-zinc-700"
                                                    }`}
                                                >
                                                    {video.chapters} Chapters
                                                </p>

                                                <div
                                                    className={`mt-1 flex items-center gap-4 text-xs md:text-sm ${
                                                        isDark ? "text-zinc-400" : "text-zinc-600"
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-1.5 whitespace-nowrap">
                                                        <Calendar className="w-3.5 h-3.5 opacity-80" />
                                                        <span>{video.date}</span>
                                                    </div>

                                                    <div className="flex items-center gap-1.5 whitespace-nowrap">
                                                        <CreditCard className="w-3.5 h-3.5 opacity-80" />
                                                        <span>{video.price}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right: delete icon only */}
                                        <button
                                            type="button"
                                            className={`${
                                                isDark
                                                    ? "text-zinc-400 hover:text-red-400"
                                                    : "text-zinc-500 hover:text-red-500"
                                            } transition-colors ml-2 cursor-pointer`}
                                            onClick={() => setVideoToDelete(video)}
                                        >
                                            <Trash2 className="w-5 h-5" color={isDark ? "white" : "black"}  />
                                        </button>
                                    </div>
                                    ))
                                    ) : (
                                        <div className={`${
                                            isDark
                                                ? "bg-zinc-900 border-zinc-800"
                                                : "bg-white border-zinc-200"
                                        } border rounded-2xl px-6 py-8 text-center`}>
                                            <p className={`text-xs md:text-sm ${isDark ? "text-zinc-400" : "text-zinc-600"}`}>
                                                No saved videos found matching "{searchValue}"
                                            </p>
                                        </div>
                                    )}
                            </div>
                        </div>
                    </div>
                </main>
            </div>

            {videoToDelete && (
                <div
                    className={`fixed inset-0 z-50 flex items-center justify-center px-4 ${
                        isDark ? "bg-black/60" : "bg-black/40"
                    } backdrop-blur-[3px]`}
                    onClick={() => setVideoToDelete(null)}
                >
                    <div
                        className={`w-full max-w-sm rounded-2xl border shadow-[0_18px_45px_rgba(0,0,0,0.55)] ${
                            isDark
                                ? "bg-zinc-900 border-zinc-800 text-zinc-50"
                                : "bg-white border-zinc-200 text-zinc-900"
                        } p-6`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="text-base md:text-lg font-semibold mb-2">Confirm Delete</h3>
                        <p className={`text-xs md:text-sm ${isDark ? "text-zinc-400" : "text-zinc-600"}`}>
                            Are you sure you want to delete this?
                        </p>

                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setVideoToDelete(null)}
                                className={`inline-flex items-center justify-center rounded-lg px-4 py-1.5 text-xs md:text-sm font-medium border cursor-pointer transition-colors ${
                                    isDark
                                        ? "border-zinc-600 text-zinc-200 hover:bg-zinc-800"
                                        : "border-zinc-300 text-zinc-700 hover:bg-zinc-100"
                                }`}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmDelete}
                                className="inline-flex items-center justify-center rounded-lg px-4 py-1.5 text-xs md:text-sm font-medium cursor-pointer bg-red-600 text-white hover:bg-red-500"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default SavedVideos;
