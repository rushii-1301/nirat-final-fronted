import React, { useEffect, useRef, useState } from "react";
import Sidebar from "../../Tools/Sidebar.jsx";
import Header from "../../Tools/Header.jsx";
import { getAsset, BACKEND_API_URL, handlesuccess, handleerror } from "../../../utils/assets.js";
import { Play, PlusIcon, Share2, SlidersHorizontal, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

// Chapter Card Component
const ChapterCard = ({ data, isDark, onDelete, onShare }) => {
    const navigate = useNavigate();
    return (
        <div className={`rounded-lg ${isDark ? 'bg-zinc-900 border border-zinc-800' : 'bg-white border border-zinc-200'} p-4 shadow-md flex flex-col h-full`}>
            <div className="flex items-start gap-3 mb-3">
                <img src={isDark ? getAsset("lectureicon_dark") : getAsset("lectureicon_light")} alt="Chapter" className="w-15 h-15 opacity-90" />
                <div className="flex-1">
                    <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-zinc-800'}`}>{data.title}</p>
                    <p className={`text-[13px] ${isDark ? 'text-gray-400' : 'text-zinc-500'}`}>
                        {data.std && data.std !== 'general' ? `Class ${data.std}` : 'General Lecture'} • {data.language || 'English'}
                    </p>
                </div>
            </div>
            <ul className={`text-[12px] ${isDark ? 'text-gray-300' : 'text-zinc-700'} space-y-1 pl-5 list-disc mb-3`}>
                <li>AI History</li>
                <li>Present Application</li>
                <li>Future trends</li>
            </ul>
            <div className="flex items-center justify-around mt-auto pt-2">
                {/* Left Buttons */}
                <div className="flex items-center gap-2 justify-around w-full">
                    {/* Play Button */}
                    <button
                        onClick={() => navigate("/lecture/LectureVideo", { state: { lectureId: data.lecture_id } })}
                        className={`cursor-pointer w-[30%] lg:w-full justify-center px-2 inline-flex items-center gap-2 h-8 text-[13px] md:h-10 md:text-[14px] lg:h-8 lg:text-[13px] rounded-md font-semibold transition-colors duration-150 ${isDark ? 'bg-white text-black hover:bg-zinc-200' : 'bg-[#696CFF] text-white hover:bg-[#575BFF]'}`}>
                        <span>Play</span>
                        <Play fill={isDark ? 'black' : 'white'} className="w-4 h-4" />
                    </button>
                    {/* Share Button */}
                    <button
                        onClick={() => onShare && onShare(data)}
                        className={`cursor-pointer w-[35%] lg:w-full justify-center px-2 inline-flex items-center gap-2 h-8 text-[13px] md:h-10 md:text-[14px] lg:h-8 lg:text-[13px] rounded-md font-medium transition-colors duration-150 ${isDark ? 'bg-zinc-700 text-white hover:bg-zinc-600' : 'bg-zinc-300 text-zinc-800 hover:bg-zinc-200'}`}>
                        <span>Share</span>
                        <Share2 fill={isDark ? 'white' : 'black'} className="w-4 h-4" />
                    </button>
                    {/* Remove Button */}
                    <button
                        onClick={() => onDelete(data)}
                        className={`cursor-pointer w-[45%] lg:w-full justify-center px-2 inline-flex items-center gap-2 h-8 text-[13px] md:h-10 md:text-[14px] lg:h-8 lg:text-[13px] rounded-md font-medium transition-colors duration-150 ${isDark ? 'bg-zinc-700 text-white hover:bg-zinc-600' : 'bg-zinc-300 text-zinc-800 hover:bg-zinc-200'}`}
                    >
                        <span>Remove</span>
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};

function LectureHome({ theme, isDark, toggleTheme, sidebardata }) {
    const resolvedDark = typeof isDark === 'boolean' ? isDark : theme === 'dark';
    const [showFilter, setShowFilter] = useState(false);
    const [openFilter, setOpenFilter] = useState(null);

    const [selectedClass, setSelectedClass] = useState("");
    const [selectedSubject, setSelectedSubject] = useState("");
    const [lectureData, setLectureData] = useState([]);

    const [isLoading, setIsLoading] = useState(false);
    const [classOptions, setClassOptions] = useState([]);
    const [subjectOptions, setSubjectOptions] = useState([]);
    const [allFilterData, setAllFilterData] = useState([]); // Store complete filter data

    // Search state (drives Header search bar)
    const [searchValue, setSearchValue] = useState("");

    // Share Modal State
    const [showShareModal, setShowShareModal] = useState(false);
    const [lectureToShare, setLectureToShare] = useState(null);
    const [shareStd, setShareStd] = useState("");
    const [isSharing, setIsSharing] = useState(false);

    // Delete Modal State
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [lectureToDelete, setLectureToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const navigate = useNavigate();
    const filterRef = useRef(null);

    // Fetch filter options from API
    const fetchFilters = async () => {
        try {
            const token = localStorage.getItem("access_token");

            const response = await axios.get(`${BACKEND_API_URL}/lectures/public_lecture/filters`, {
                headers: {
                    'Accept': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
            });

            if (response.data?.status && response.data?.data) {
                const filterData = response.data.data;

                // Store complete filter data for dynamic filtering
                setAllFilterData(filterData);

                // Extract unique classes (std values)
                const uniqueClasses = [...new Set(filterData.map(item => item.std))].sort((a, b) => {
                    // Sort numerically if both are numbers, otherwise alphabetically
                    const numA = parseInt(a);
                    const numB = parseInt(b);
                    if (!isNaN(numA) && !isNaN(numB)) {
                        return numA - numB;
                    }
                    return a.localeCompare(b);
                });

                // Extract unique subjects from all items (initial load - all subjects)
                const allSubjects = filterData.flatMap(item => item.subject || []);
                const uniqueSubjects = [...new Set(allSubjects)]
                    .map(subject => subject.charAt(0).toUpperCase() + subject.slice(1).toLowerCase())
                    .sort();

                setClassOptions(uniqueClasses);
                setSubjectOptions(uniqueSubjects);
            }
        } catch (error) {
            console.error("Error fetching filters:", error);
            // Fallback to empty arrays if API fails
            setClassOptions([]);
            setSubjectOptions([]);
            setAllFilterData([]);
        }
    };

    // Get filtered subjects based on selected class
    const getFilteredSubjects = () => {
        if (!selectedClass) {
            // No class selected - show all subjects
            const allSubjects = allFilterData.flatMap(item => item.subject || []);
            return [...new Set(allSubjects)]
                .map(subject => subject.charAt(0).toUpperCase() + subject.slice(1).toLowerCase())
                .sort();
        } else {
            // Class selected - show only subjects for that class
            const classData = allFilterData.filter(item => item.std === selectedClass);
            const classSubjects = classData.flatMap(item => item.subject || []);
            return [...new Set(classSubjects)]
                .map(subject => subject.charAt(0).toUpperCase() + subject.slice(1).toLowerCase())
                .sort();
        }
    };

    // Update subjects when class selection changes
    useEffect(() => {
        if (allFilterData.length > 0) {
            const filteredSubjects = getFilteredSubjects();
            setSubjectOptions(filteredSubjects);

            // Clear subject selection if it's not available for the selected class
            if (selectedClass && selectedSubject && !filteredSubjects.includes(selectedSubject)) {
                setSelectedSubject("");
            }
        }
    }, [selectedClass, allFilterData]);

    // Fetch lectures from API
    const fetchLectures = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem("access_token");
            let url = `${BACKEND_API_URL}/lectures`;

            // Build query params based on filters
            const params = new URLSearchParams();
            if (selectedClass) params.append('std', selectedClass);
            if (selectedSubject) params.append('subject', selectedSubject.toLowerCase());

            const queryString = params.toString();
            if (queryString) {
                url += `?${queryString}`;
            }

            const response = await axios.get(url, {
                headers: {
                    'Accept': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
            });

            // Handle the response - it's a direct array of lecture objects
            if (response.data && Array.isArray(response.data)) {
                setLectureData(response.data);
            } else {
                console.warn('Unexpected response format:', response.data);
                setLectureData([]);
            }
        } catch (error) {
            console.error("Error fetching lectures:", error);
            setLectureData([]);
        } finally {
            setIsLoading(false);
        }
    };

    // Fetch filters and lectures on component mount
    useEffect(() => {
        fetchFilters();
        fetchLectures();
    }, []);

    const resetFilters = () => {
        setSelectedClass("");
        setSelectedSubject("");
    };

    const applyFilters = () => {
        setShowFilter(false);
        fetchLectures();
    };

    // Delete Handlers
    const handleDeleteClick = (lecture) => {
        setLectureToDelete(lecture);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (!lectureToDelete) return;

        setIsDeleting(true);
        try {
            const token = localStorage.getItem("access_token");

            // API requires: std, subject, lecture_id as query params
            const response = await axios.delete(`${BACKEND_API_URL}/lectures`, {
                headers: {
                    "Accept": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                params: {
                    std: lectureToDelete.std,
                    subject: lectureToDelete.subject || "science",
                    lecture_id: lectureToDelete.lecture_id,
                },
            });

            if (response.data) {
                handlesuccess("Lecture deleted successfully");
                fetchLectures();
            }
        } catch (error) {
            console.error("Error deleting lecture:", error);
            handleerror("Failed to delete lecture. Please try again.");
        } finally {
            setLectureToDelete(null);
            setShowDeleteModal(false);
            setIsDeleting(false);
        }
    };

    // Share Handlers
    const handleShareClick = (lecture) => {
        setLectureToShare(lecture);
        setShareStd(lecture?.std && lecture.std !== "general" ? String(lecture.std) : "");
        setShowShareModal(true);
    };

    const confirmShare = async () => {
        if (!lectureToShare || !shareStd) {
            handleerror("Please enter class (std) before sharing.");
            return;
        }

        setIsSharing(true);
        try {
            const token = localStorage.getItem("access_token");

            const response = await axios.post(
                `${BACKEND_API_URL}/lectures/${lectureToShare.lecture_id}/share`,
                { std: String(shareStd) },
                {
                    headers: {
                        "Accept": "application/json",
                        "Content-Type": "application/json",
                        ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    },
                }
            );

            if (response.data) {
                handlesuccess("Share successfully");
                setShowShareModal(false);
                setLectureToShare(null);
                setShareStd("");
            }
        } catch (error) {
            console.error("Error sharing lecture:", error);
            handleerror("Failed to share lecture. Please try again.");
        } finally {
            setIsSharing(false);
        }
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (!filterRef.current) return;
            if (openFilter && !filterRef.current.contains(event.target)) {
                setOpenFilter(null);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [openFilter]);

    // Search-based filtering across title, chapter, language, std, subject
    const filteredLectures = React.useMemo(() => {
        const query = searchValue.trim().toLowerCase();
        if (!query) return lectureData;

        return lectureData.filter((item) => {
            const title = (item.title || "").toLowerCase();
            const chapter = (item.chapter || "").toLowerCase();
            const language = (item.language || "").toLowerCase();
            const std = (item.std != null ? String(item.std) : "").toLowerCase();
            const subject = (item.subject || "").toLowerCase();

            return (
                title.includes(query) ||
                chapter.includes(query) ||
                language.includes(query) ||
                std.includes(query) ||
                subject.includes(query)
            );
        });
    }, [searchValue, lectureData]);

    return (
        <div className={`flex ${resolvedDark ? "bg-zinc-950 text-gray-100" : "bg-zinc-50 text-zinc-900"} h-screen transition-colors duration-300`}>
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

                {/* ===== Main Section ===== */}
                <main className="mt-6 flex-1 flex flex-col min-h-0">
                    <div className={`w-full rounded px-4 py-3 text-base md:text-lg flex items-center justify-between mb-2 shrink-0 ${resolvedDark ? 'bg-zinc-900 border border-zinc-800' : 'bg-zinc-100 border border-zinc-200'}`}>
                        <div className="flex items-center gap-6 select-none">
                            <span className={`${resolvedDark ? 'text-gray-300' : 'text-zinc-700'}`}><span className="font-bold">Total Lectures:</span> <span className="font-semibold">{filteredLectures.length}</span></span>

                            {selectedClass && (
                                <>
                                    <span className={`${resolvedDark ? 'bg-zinc-700' : 'bg-zinc-300'} h-5 w-px`} aria-hidden="true"></span>
                                    <span className={`${resolvedDark ? 'text-gray-300' : 'text-zinc-700'}`}><span className="font-bold">Class:</span> <span className="font-semibold">{selectedClass}</span></span>
                                </>
                            )}

                            {selectedSubject && (
                                <>
                                    <span className={`${resolvedDark ? 'bg-zinc-700' : 'bg-zinc-300'} h-5 w-px`} aria-hidden="true"></span>
                                    <span className={`${resolvedDark ? 'text-gray-300' : 'text-zinc-700'}`}><span className="font-bold">Subject:</span> <span className="font-semibold">{selectedSubject}</span></span>
                                </>
                            )}
                        </div>
                        {/* <button
                            type="button"
                            onClick={() => navigate("/lecture/addlecture")}
                            aria-label="Add new lecture"
                            className={`cursor-pointer inline-flex items-center justify-center rounded-sm px-2 py-2 transition-colors duration-150 ${resolvedDark ? 'bg-zinc-700 text-gray-100 hover:bg-zinc-700/60' : 'bg-[#696CFF] text-white hover:bg-[#696CFF]/70'}`}>
                            <PlusIcon className="w-4 h-4" />
                        </button> */}
                    </div>

                    <button
                        type="button"
                        onClick={() => {
                            setShowFilter((prev) => !prev);
                            setOpenFilter(null);
                        }}
                        className={`cursor-pointer w-fit inline-flex items-center gap-2 justify-center px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-colors duration-200 mb-3 ${resolvedDark ? "bg-zinc-900 text-gray-100 hover:bg-zinc-800 border border-zinc-700" : "bg-zinc-100 text-zinc-800 hover:bg-zinc-200 border border-zinc-300"}`}>
                        <SlidersHorizontal className="w-4 h-4" />
                        {showFilter ? "Hide Filter" : "Show Filter"}
                    </button>

                    {showFilter && (
                        <div
                            ref={filterRef}
                            className={`mb-5 space-y-3 rounded-2xl border px-3 sm:px-4 py-3 shadow-md transition-all duration-200 ${resolvedDark ? "bg-black/40 border-zinc-800" : "bg-zinc-50 border-zinc-200"}`}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className={`relative ${openFilter === "class" ? "z-30" : "z-10"}`}>
                                    <button
                                        type="button"
                                        onClick={() => setOpenFilter((prev) => (prev === "class" ? null : "class"))}
                                        className={`w-full flex items-center justify-between rounded-md border px-4 py-2 text-xs sm:text-sm cursor-pointer shadow-sm hover:shadow transition-all duration-150 ${resolvedDark ? "bg-zinc-900 border-zinc-700 text-gray-100" : "bg-white border-zinc-300 text-zinc-800"}`}>
                                        <span>{selectedClass || "Class"}</span>
                                        <span className="text-[10px]">▾</span>
                                    </button>
                                    {openFilter === "class" && (
                                        <div
                                            className={`absolute z-40 mt-2 w-full rounded-2xl border px-3 py-3 shadow-xl transition-all duration-150 ${resolvedDark ? "bg-zinc-900 text-gray-100 border-zinc-700" : "bg-white text-zinc-800 border-zinc-300"}`}>
                                            <div className="flex flex-wrap gap-2">
                                                {classOptions.length > 0 ? (
                                                    classOptions.map((item) => (
                                                        <button
                                                            key={item}
                                                            type="button"
                                                            onClick={() => {
                                                                setSelectedClass(item);
                                                                setOpenFilter(null);
                                                            }}
                                                            className={`cursor-pointer px-3 py-1 rounded-full text-xs transition-all duration-150 hover:scale-[1.03] ${selectedClass === item ? "bg-white text-black" : resolvedDark ? "bg-zinc-800 text-gray-100" : "bg-zinc-100 text-zinc-800"}`}>
                                                            {item}
                                                        </button>
                                                    ))
                                                ) : (
                                                    <p className={`text-xs ${resolvedDark ? 'text-gray-400' : 'text-zinc-500'}`}>No classes available</p>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className={`relative ${openFilter === "subject" ? "z-30" : "z-10"}`}>
                                    <button
                                        type="button"
                                        onClick={() => setOpenFilter((prev) => (prev === "subject" ? null : "subject"))}
                                        className={`w-full flex items-center justify-between rounded-md border px-4 py-2 text-xs sm:text-sm cursor-pointer ${resolvedDark ? "bg-zinc-900 border-zinc-700 text-gray-100" : "bg-white border-zinc-300 text-zinc-800"}`}>
                                        <span>{selectedSubject || "Subject Name"}</span>
                                        <span className="text-[10px]">▾</span>
                                    </button>
                                    {openFilter === "subject" && (
                                        <div
                                            className={`absolute z-40 mt-2 w-full rounded-xl border px-3 py-3 shadow-lg ${resolvedDark ? "bg-zinc-900 text-gray-100 border-zinc-700" : "bg-white text-zinc-800 border-zinc-300"}`}>
                                            <div className="flex flex-wrap gap-2">
                                                {subjectOptions.length > 0 ? (
                                                    subjectOptions.map((item) => (
                                                        <button
                                                            key={item}
                                                            type="button"
                                                            onClick={() => {
                                                                setSelectedSubject(item);
                                                                setOpenFilter(null);
                                                            }}
                                                            className={`cursor-pointer px-3 py-1 rounded-full text-xs transition-all duration-150 hover:scale-[1.03] ${selectedSubject === item ? "bg-white text-black" : resolvedDark ? "bg-zinc-800 text-gray-100" : "bg-zinc-100 text-zinc-800"}`}>
                                                            {item}
                                                        </button>
                                                    ))
                                                ) : (
                                                    <p className={`text-xs ${resolvedDark ? 'text-gray-400' : 'text-zinc-500'}`}>No subjects available</p>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={resetFilters}
                                    className={`cursor-pointer rounded-full px-5 py-1.5 text-xs sm:text-sm ${resolvedDark ? "bg-transparent text-gray-200 border border-zinc-600 hover:bg-zinc-900" : "bg-transparent text-zinc-700 border border-zinc-300 hover:bg-zinc-100"}`}>
                                    Reset Filter
                                </button>
                                <button
                                    type="button"
                                    onClick={applyFilters}
                                    className={`cursor-pointer rounded-full px-5 py-1.5 text-xs sm:text-sm shadow-sm ${resolvedDark ? "bg-white text-black hover:bg-zinc-100" : "bg-white text-zinc-900 hover:bg-zinc-100"}`}>
                                    Apply Filter
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Lecture Grid - Scrollable section */}
                    <section className="flex-1 overflow-y-auto no-scrollbar">
                        {isLoading ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 items-stretch gap-4 auto-rows-[1fr]">
                                {[...Array(8)].map((_, index) => (
                                    <div key={index} className={`rounded-lg ${resolvedDark ? 'bg-zinc-900 border border-zinc-800' : 'bg-white border border-zinc-200'} p-4 shadow-md flex flex-col h-full animate-pulse`}>
                                        <div className="flex items-start gap-3 mb-3">
                                            <div className={`w-15 h-15 rounded-md ${resolvedDark ? 'bg-zinc-800' : 'bg-zinc-200'}`}></div>
                                            <div className="flex-1 space-y-2">
                                                <div className={`h-4 w-3/4 rounded ${resolvedDark ? 'bg-zinc-800' : 'bg-zinc-200'}`}></div>
                                                <div className={`h-3 w-1/2 rounded ${resolvedDark ? 'bg-zinc-800' : 'bg-zinc-200'}`}></div>
                                            </div>
                                        </div>
                                        <div className="space-y-2 pl-5 mb-3">
                                            <div className={`h-2 w-full rounded ${resolvedDark ? 'bg-zinc-800' : 'bg-zinc-200'}`}></div>
                                            <div className={`h-2 w-5/6 rounded ${resolvedDark ? 'bg-zinc-800' : 'bg-zinc-200'}`}></div>
                                            <div className={`h-2 w-4/6 rounded ${resolvedDark ? 'bg-zinc-800' : 'bg-zinc-200'}`}></div>
                                        </div>
                                        <div className="flex items-center justify-around mt-auto pt-2 gap-2">
                                            <div className={`h-8 w-full rounded ${resolvedDark ? 'bg-zinc-800' : 'bg-zinc-200'}`}></div>
                                            <div className={`h-8 w-full rounded ${resolvedDark ? 'bg-zinc-800' : 'bg-zinc-200'}`}></div>
                                            <div className={`h-8 w-full rounded ${resolvedDark ? 'bg-zinc-800' : 'bg-zinc-200'}`}></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : filteredLectures.length === 0 ? (
                            <div className="flex items-center justify-center h-64">
                                <p className={`${resolvedDark ? 'text-gray-400' : 'text-zinc-600'}`}>No lectures found.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 items-stretch gap-4 auto-rows-[1fr]">
                                {filteredLectures.map((item) => (
                                    <ChapterCard
                                        key={item.lecture_id}
                                        data={item}
                                        isDark={resolvedDark}
                                        onDelete={handleDeleteClick}
                                        onShare={handleShareClick}
                                    />
                                ))}
                            </div>
                        )}
                    </section>
                </main>

                {/* Delete Confirmation Modal */}
                {showDeleteModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <div className={`w-full max-w-md rounded-2xl p-6 shadow-xl transform transition-all scale-100 ${resolvedDark ? 'bg-zinc-900 border border-zinc-800' : 'bg-white'}`}>
                            <div className="flex flex-col items-center text-center">
                                <div className={`p-3 rounded-full mb-4 ${resolvedDark ? 'bg-red-500/10 text-red-500' : 'bg-red-100 text-red-600'}`}>
                                    <Trash2 className="w-8 h-8" />
                                </div>
                                <h3 className={`text-xl font-semibold mb-2 ${resolvedDark ? 'text-white' : 'text-gray-900'}`}>
                                    Delete Lecture?
                                </h3>
                                <p className={`text-sm mb-6 ${resolvedDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                    Are you sure you want to delete this lecture? This action cannot be undone.
                                </p>
                                <div className="flex gap-3 w-full">
                                    <button
                                        onClick={() => setShowDeleteModal(false)}
                                        className={`flex-1 px-4 py-2.5 cursor-pointer rounded-xl font-medium transition-colors ${resolvedDark ? 'bg-zinc-800 text-white hover:bg-zinc-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={confirmDelete}
                                        disabled={isDeleting}
                                        className="flex-1 px-4 py-2.5 cursor-pointer rounded-xl font-medium bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isDeleting ? 'Deleting...' : 'Delete'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Share Lecture Modal */}
                {showShareModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <div className={`w-full max-w-md rounded-2xl p-6 shadow-xl transform transition-all scale-100 ${resolvedDark ? "bg-zinc-900 border border-zinc-800" : "bg-white"}`}>
                            <div className="flex flex-col gap-4">
                                <div className="flex items-center justify-between">
                                    <h3 className={`text-lg font-semibold ${resolvedDark ? "text-white" : "text-gray-900"}`}>
                                        Share Lecture
                                    </h3>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowShareModal(false);
                                            setLectureToShare(null);
                                            setShareStd("");
                                        }}
                                        className={`cursor-pointer text-sm px-2 py-1 rounded-md ${resolvedDark ? "text-gray-300 hover:bg-zinc-800" : "text-gray-600 hover:bg-gray-100"}`}
                                    >
                                        ✕
                                    </button>
                                </div>
                                <div className="space-y-2">
                                    <label className={`text-sm font-medium ${resolvedDark ? "text-gray-200" : "text-gray-700"}`}>
                                        Class Number (Std)
                                    </label>
                                    <input
                                        type="text"
                                        value={shareStd}
                                        onChange={(e) => setShareStd(e.target.value)}
                                        placeholder="Enter class (e.g., 10)"
                                        className={`w-full rounded-md border px-3 py-2 text-sm outline-none ${resolvedDark ? "bg-zinc-900 border-zinc-700 text-gray-100 placeholder:text-gray-500" : "bg-white border-zinc-300 text-zinc-900 placeholder:text-zinc-400"}`}
                                    />
                                </div>
                                <div className="flex gap-3 justify-end mt-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowShareModal(false);
                                            setLectureToShare(null);
                                            setShareStd("");
                                        }}
                                        className={`px-4 py-2 cursor-pointer rounded-xl text-sm font-medium ${resolvedDark ? "bg-zinc-800 text-white hover:bg-zinc-700" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        onClick={confirmShare}
                                        disabled={isSharing}
                                        className="px-4 py-2 cursor-pointer rounded-xl text-sm font-medium bg-[#696CFF] text-white hover:bg-[#575BFF] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isSharing ? "Sharing..." : "Share"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default LectureHome;