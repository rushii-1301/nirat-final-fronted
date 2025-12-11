import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Sidebar from "../../Tools/Sidebar.jsx";
import { BACKEND_API_URL, getAsset } from "../../../utils/assets";
import Portalheader from "../../Tools/Portalheader.jsx";

function Chapter({ isDark, toggleTheme, sidebardata }) {
    const navigate = useNavigate();
    const [subjects, setSubjects] = useState([
        { key: "all", label: "All subject" },
    ]);

    const [active, setActive] = useState("all");
    const [activeIndex, setActiveIndex] = useState(0);
    const [books, setBooks] = useState([]);
    const [searchValue, setSearchValue] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchBooks = async () => {
            try {
                setLoading(true);
                setError(null);
                const token = localStorage.getItem('token');
                if (!token) {
                    setError('No authentication token found');
                    setLoading(false);
                    return;
                }

                const res = await axios.get(`${BACKEND_API_URL}/school-portal/books`, {
                    headers: {
                        accept: 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                });

                const data = res.data || {};
                let booksList = [];

                if (Array.isArray(data)) {
                    booksList = data;
                } else if (data.data && Array.isArray(data.data.books)) {
                    booksList = data.data.books;
                } else if (Array.isArray(data.data)) {
                    booksList = data.data;
                } else if (Array.isArray(data.books)) {
                    booksList = data.books;
                }

                setBooks(booksList || []);

                if (active === "all") {
                    const uniqueSubjects = new Map();
                    (booksList || []).forEach((b) => {
                        if (!b.subject) return;
                        const raw = String(b.subject);
                        const key = raw.toLowerCase();
                        if (!uniqueSubjects.has(key)) {
                            uniqueSubjects.set(key, { key: raw, label: raw });
                        }
                    });

                    setSubjects([
                        { key: "all", label: "All subject" },
                        ...Array.from(uniqueSubjects.values()),
                    ]);
                }
            } catch (error) {
                console.error('Failed to fetch books', error);
                setError(error.response?.data?.message || 'Failed to fetch books');
            } finally {
                setLoading(false);
            }
        };

        fetchBooks();
    }, []);

    const filtered = useMemo(() => {
        let result = books;

        // Filter by subject
        if (active !== "all") {
            const act = String(active).toLowerCase();
            result = result.filter((b) => (b.subject || "").toLowerCase() === act);
        }

        // Filter by search value
        if (searchValue.trim()) {
            const search = searchValue.toLowerCase().trim();
            result = result.filter((b) =>
                (b.title || "").toLowerCase().includes(search) ||
                (b.subject || "").toLowerCase().includes(search) ||
                (b.std || "").toLowerCase().includes(search) ||
                (b.board || "").toLowerCase().includes(search)
            );
        }

        return result;
    }, [books, active, searchValue]);

    return (
        <div className={`flex ${isDark ? "bg-zinc-950 text-gray-100" : "bg-white text-zinc-900"} h-screen transition-colors duration-300`}>
            {/* Sidebar */}
            <Sidebar isDark={isDark} sidebardata={sidebardata} />

            {/* Main Content (offset for fixed sidebar) */}
            <div className={`flex flex-col min-h-0 min-w-0 h-screen w-full md:ml-15 lg:ml-72 px-0 pb-0 transition-all duration-300`}>
                {/* ===== Sticky Header ===== */}
                <div className="sticky top-0 z-20">
                    <Portalheader title="Chapter" isDark={isDark} toggleTheme={toggleTheme} isSearchbar={true} searchValue={searchValue} setSearchValue={setSearchValue} />
                </div>

                {/* ===== Main Section ===== */}
                <main className="mt-6 flex-1 flex flex-col min-h-0 px-4 md:px-8">
                    <div className="flex flex-col min-h-0 h-full">
                        <h2 className="font-bold text-[26px] leading-none tracking-normal">Select Subject</h2>

                        <div className="mt-4 w-full">
                            <div
                                className={`${isDark ? "bg-zinc-900" : "bg-white ring-1 ring-zinc-200"
                                    } relative flex w-full rounded-full px-2 py-2 gap-12 overflow-x-auto no-scrollbar scroll-smooth`}
                            >
                                {subjects.map((s, i) => (
                                    <button
                                        key={`${s.key}-${i}`}
                                        onClick={() => { setActive(s.key); setActiveIndex(i); }}
                                        className={`relative z-10 rounded-full flex-none w-1/3 sm:w-1/4 lg:w-1/6 px-4 py-2 
text-[18px] font-inter font-semibold leading-none tracking-normal 
whitespace-nowrap select-none cursor-pointer flex items-center justify-center 
text-center snap-center transition-colors duration-150 ${isDark
                                                ? activeIndex === i
                                                    ? "bg-zinc-800 text-white"
                                                    : "text-white/80"
                                                : activeIndex === i
                                                    ? "bg-[#696cff] text-white"
                                                    : "text-zinc-800"
                                            }`}
                                    >
                                        {s.label.charAt(0).toUpperCase() + s.label.slice(1).toLowerCase()}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <h3 className="mt-6 mb-3 font-inter font-bold text-[20px] leading-none tracking-normal">My Chapters</h3>

                        <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar pr-1">
                            {loading ? (
                                <div className="flex items-center justify-center h-32">
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="w-10 h-10 border-3 border-gray-300 border-t-indigo-500 rounded-full animate-spin"></div>
                                        <div className="text-sm opacity-60">Loading chapters...</div>
                                    </div>
                                </div>
                            ) : error ? (
                                <div className="flex items-center justify-center h-32">
                                    <div className="text-sm text-red-500">{error}</div>
                                </div>
                            ) : filtered.length === 0 ? (
                                <div className="flex items-center justify-center h-32">
                                    <div className="text-sm opacity-60">No chapters found for this subject</div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
                                    {filtered.map((item) => (
                                        <div
                                            key={item.id}
                                            onClick={() => {
                                                // Get PDF URL from API data
                                                let pdfUrl = item.file_url;
                                                let title = item.title;
                                                let bookId = item.id;

                                                if (!pdfUrl.startsWith('http')) {
                                                    // Try to use backend URL, but if it fails, we'll handle it in pdfview
                                                    pdfUrl = `${BACKEND_API_URL}${pdfUrl}`;
                                                }

                                                console.log('Book clicked:', title);
                                                console.log('Book ID:', bookId);
                                                console.log('API PDF URL:', pdfUrl);

                                                navigate('/StudentPortal/desplaypdf', {
                                                    state: {
                                                        bookId: bookId,
                                                        pdfData: {
                                                            pdfUrl: pdfUrl, // This will be handled in pdfview
                                                            title: title,
                                                            totalPages: 150
                                                        }
                                                    }
                                                });
                                            }}
                                            className={`${isDark ? "bg-zinc-900" : "bg-zinc-50"
                                                } group relative rounded-xl overflow-hidden border ${isDark ? "border-zinc-800" : "border-zinc-200"
                                                } transition-colors duration-200 cursor-pointer`}
                                        >
                                            {/* Hover blue border exactly on card edge */}
                                            <div className="pointer-events-none absolute inset-0 rounded-xl border border-transparent group-hover:border-blue-500" />

                                            <div className="relative h-64 sm:h-72 xl:h-80 overflow-hidden">
                                                <img
                                                    src={getAsset(isDark ? 'books_dark' : 'books_light')}
                                                    alt={item.title}
                                                    className="h-full w-full object-cover"
                                                />
                                                <div className="absolute inset-0 bg-black/30" />
                                                <div
                                                    className={`${isDark ? 'bg-zinc-800 text-zinc-100' : 'bg-black/60 text-zinc-200'} text-white font-inter font-inter text-[10px] sm:text-[8px] md:text-[10px] leading-none tracking-normal absolute top-2 right-2 px-2 py-1 sm:px-3 sm:py-1.5 rounded-md`}
                                                >
                                                    {item.subject ? item.subject.charAt(0).toUpperCase() + item.subject.slice(1).toLowerCase() : ""}
                                                </div>
                                                <div className="absolute bottom-2 right-2 text-[11px] px-2 py-1 rounded-md bg-black/60 text-white">
                                                    {item.uploaded_at
                                                        ? new Date(item.uploaded_at).toLocaleDateString(undefined, { day: '2-digit', month: 'short' })
                                                        : ""}
                                                </div>
                                            </div>
                                            <div className="p-4">
                                                <div className="font-semibold text-[17px]">{item.title}</div>
                                                <div className="mt-1 flex items-center justify-between text-xs opacity-80 font-inter font-normal text-[15px] leading-none tracking-normal capitalize">
                                                    <span>Class: {item.std}</span>

                                                </div>
                                                <div className="text-xs 
                                                mt-2 opacity-80 flex justify-between font-inter font-normal text-[14px] leading-none tracking-normal capitalize">
                                                    <span>{item.board || "-"}</span>
                                                    <span>{item.chapters} Chapter</span>
                                                </div>

                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </main>
            </div >
        </div >
    );
}

export default Chapter;