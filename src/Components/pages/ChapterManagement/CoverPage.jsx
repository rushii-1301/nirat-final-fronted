import React, { useState } from "react";
import Sidebar from "../../Tools/Sidebar";
import Header from "../../Tools/Header";
import { useNavigate } from "react-router-dom";
import { CloudUpload } from "lucide-react";

function CoverPage({ theme = "dark", isDark: isDarkProp, toggleTheme, sidebardata, backto = "/chapter/AllChapters" }) {
    const isDark = typeof isDarkProp === "boolean" ? isDarkProp : theme === "dark";

    const [videoUrl, setVideoUrl] = useState(null);
    const [coverPreview, setCoverPreview] = useState(null);
    const navigate = useNavigate();

    const DEFAULT_THUMBNAIL = "https://images.pexels.com/photos/5907921/pexels-photo-5907921.jpeg?auto=compress&cs=tinysrgb&w=600";

    const handleVideoFile = (file) => {
        if (!file) return;
        if (file.type !== "video/mp4") {
            alert("Only MP4 files are allowed!");
            return;
        }
        const url = URL.createObjectURL(file);
        setVideoUrl(url);
    };

    const handleCoverFile = (file) => {
        if (!file) return;
        if (!(file.type === "image/png" || file.type === "image/jpeg")) {
            alert("Only PNG or JPG images are allowed!");
            return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
            setCoverPreview(reader.result);
        };
        reader.readAsDataURL(file);
    };

    const cardCls = `${isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200"} border rounded-2xl p-4 sm:p-6 shadow-sm transition-colors duration-200`;

    return (
        <div className={`flex ${isDark ? "bg-zinc-950 text-gray-100" : "bg-zinc-50 text-zinc-900"} h-screen overflow-hidden transition-colors duration-300`}>
            {/* Sidebar */}
            <Sidebar isDark={isDark} sidebardata={sidebardata} />

            {/* Main Section */}
            <div className="flex flex-col min-h-0 h-screen w-full md:ml-15 lg:ml-72 p-2 md:p-6 pb-0 transition-all duration-300">
                {/* Header */}
                <div className="sticky top-0 z-20">
                    <Header title="Add Chapter Management" isDark={isDark} toggleTheme={toggleTheme} />
                </div>

                {/* Scrollable content */}
                <main className="mt-4 sm:mt-6 flex-1 overflow-y-auto no-scrollbar">
                    <div className="w-full mx-auto space-y-4">
                        {/* Toolbar row */}
                        <div
                            className={`${isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200"} sticky top-0 z-30 border rounded-xl px-3 sm:px-4 py-3 flex items-center justify-between backdrop-blur bg-opacity-90 shadow-sm`}
                        >
                            <div className={`${isDark ? "text-white" : "text-zinc-900"} text-base sm:text-lg font-medium`}>
                                Add Chapter Management
                            </div>
                            <div className="flex gap-2 w-[200px] justify-center items-center">
                                <button
                                    onClick={() => navigate(backto)}
                                    className={`${isDark ? "bg-zinc-800 text-gray-300 hover:bg-zinc-700 border border-zinc-700" : "bg-white text-zinc-700 hover:bg-zinc-100 border border-zinc-300"} w-full cursor-pointer px-4 py-1.5 flex items-center justify-center rounded-md text-sm`}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => navigate("/chapter/Home")}
                                    className={`${isDark ? "bg-white text-black hover:bg-zinc-100" : "bg-[#696CFF] text-white hover:bg-[#696CFF]/90"} w-full cursor-pointer px-4 py-1.5 flex items-center justify-center rounded-md text-sm`}
                                >
                                    Save
                                </button>
                            </div>
                        </div>

                        {/* Main Card */}
                        <div className={cardCls}>
                            <div className="space-y-6">
                                {/* Uploaded Video */}
                                <div className="space-y-2">
                                    <label className={`text-sm block ${isDark ? "text-gray-300" : "text-zinc-700"}`}>
                                        Uploaded Video
                                    </label>
                                    <div
                                        className={`border-2 border-dashed rounded-xl p-3 sm:p-4 md:p-6 lg:p-8 transition-colors duration-200 ${isDark
                                            ? "border-blue-500/60 bg-zinc-900"
                                            : "border-[#696CFF33] bg-[#696CFF0D]"
                                            }`}
                                    >
                                        {videoUrl ? (
                                            <div className="w-full">
                                                <video
                                                    src={videoUrl}
                                                    controls
                                                    className="w-full max-h-80 rounded-lg object-contain bg-black"
                                                />
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center">
                                                <img
                                                    src={DEFAULT_THUMBNAIL}
                                                    alt="Default thumbnail"
                                                    className="w-full max-w-3xl aspect-video object-cover rounded-lg border border-blue-500/40"
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Cover Photo */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between gap-3">
                                        <label className={`text-sm block ${isDark ? "text-gray-300" : "text-zinc-700"}`}>
                                            Cover Photo
                                        </label>
                                        <button
                                            type="button"
                                            className={`${isDark
                                                ? "bg-white text-black hover:bg-zinc-100"
                                                : "bg-[#696CFF] text-white hover:bg-[#696CFF]/90"
                                                } px-3 py-1.5 rounded-md text-xs cursor-pointer`}
                                        >
                                            Generate By AI
                                        </button>
                                    </div>
                                    <div
                                        onClick={() => document.getElementById("cover-image-upload").click()}
                                        onDragOver={(e) => e.preventDefault()}
                                        onDrop={(e) => {
                                            e.preventDefault();
                                            const file = e.dataTransfer.files[0];
                                            handleCoverFile(file);
                                        }}
                                        className={`border-2 border-dashed rounded-xl p-3 sm:p-4 md:p-6 lg:p-8 cursor-pointer transition-colors duration-200 ${isDark
                                            ? "border-blue-500/60 bg-zinc-900 hover:bg-zinc-900/70"
                                            : "border-[#696CFF33] bg-[#696CFF0D] hover:bg-[#696CFF1A]"
                                            }`}
                                    >
                                        {coverPreview ? (
                                            <div className="w-full flex justify-center">
                                                <img
                                                    src={coverPreview}
                                                    alt="Cover preview"
                                                    className="w-full max-w-3xl aspect-video object-cover rounded-lg border border-blue-500/40"
                                                />
                                            </div>
                                        ) : (
                                            <div className="text-center">
                                                <CloudUpload className="mx-auto h-6 w-6 text-blue-500" />
                                                <p className={`mt-1 text-sm ${isDark ? "text-gray-400" : "text-[#696CFF]"}`}>
                                                    <span className="text-blue-500/60">Click to upload </span>
                                                    or drag and drop
                                                </p>
                                                <p className={`text-xs ${isDark ? "text-gray-500" : "text-zinc-500"}`}>
                                                    PNG, JPG only
                                                </p>
                                            </div>
                                        )}

                                        {/* hidden input */}
                                        <input
                                            id="cover-image-upload"
                                            type="file"
                                            accept="image/png, image/jpeg"
                                            className="hidden"
                                            onChange={(e) => {
                                                const file = e.target.files[0];
                                                handleCoverFile(file);
                                            }}
                                        />
                                    </div>
                                </div>

                                {/* Save Button bottom center */}
                                <div className="pt-2 flex justify-center">
                                    <button
                                        type="button"
                                        className={`${isDark
                                            ? "bg-white text-black hover:bg-zinc-100"
                                            : "bg-white text-zinc-900 hover:bg-zinc-100 border border-zinc-300"
                                            } min-w-[120px] px-6 py-2 rounded-md text-sm font-medium shadow-sm cursor-pointer`}
                                    >
                                        Save
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}

export default CoverPage;
