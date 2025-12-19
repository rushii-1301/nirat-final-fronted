import React, { useState, useEffect } from "react";
import Sidebar from "../../Tools/Sidebar.jsx";
import Header from "../../Tools/Header.jsx";
import { Handbag, ArrowLeft } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { BACKEND_API_URL, handleerror } from "../../../utils/assets.js";
import axios from "axios";

// --- LectureSummaryModal Component (Updated to use API data) ---
const LectureSummaryModal = ({ lecture, isDark, onClose }) => {
    if (!lecture) return null;

    return (
        <div
            className="fixed inset-0 bg-black/50 backdrop-blur-md z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <div
                className={`w-full max-w-lg p-6 md:p-6 rounded-2xl shadow-2xl ${isDark ? 'bg-zinc-900 text-gray-100' : 'bg-white text-zinc-900'
                    } border ${isDark ? 'border-zinc-800' : 'border-zinc-200'}`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-start justify-between mb-5">
                    <h2 className="text-[20px] md:text-[22px] font-bold leading-tight tracking-[-0.01em]">
                        {lecture.title}
                    </h2>
                    <button onClick={onClose} className={`p-1 rounded-md transition-colors cursor-pointer ${isDark ? 'text-gray-400 hover:text-white' : 'text-zinc-500 hover:text-zinc-800'}`}>
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Meta grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-10">
                    <div>
                        <div className={`${isDark ? 'text-gray-400' : 'text-zinc-500'} text-[12px] md:text-[13px] font-medium`}>Subject:</div>
                        <div className={`mt-1 text-[13px] md:text-[14px] ${isDark ? 'text-white' : 'text-zinc-900'}`}>{lecture.subject}</div>
                    </div>
                    <div>
                        <div className={`${isDark ? 'text-gray-400' : 'text-zinc-500'} text-[12px] md:text-[13px] font-medium`}>Chapter</div>
                        <div className={`mt-1 text-[13px] md:text-[14px] ${isDark ? 'text-white' : 'text-zinc-900'}`}>{lecture.chapter}</div>
                    </div>
                    <div>
                        <div className={`${isDark ? 'text-gray-400' : 'text-zinc-500'} text-[12px] md:text-[13px] font-medium`}>Progress</div>
                        <div className={`mt-1 text-[13px] md:text-[14px] ${isDark ? 'text-white' : 'text-zinc-900'}`}>{lecture.progress}</div>
                    </div>
                    <div>
                        <div className={`${isDark ? 'text-gray-400' : 'text-zinc-500'} text-[12px] md:text-[13px] font-medium`}>Watched</div>
                        <div className={`mt-1 text-[13px] md:text-[14px] ${isDark ? 'text-white' : 'text-zinc-900'}`}>{lecture.date}</div>
                    </div>
                </div>

                <hr className={`${isDark ? 'border-zinc-800' : 'border-zinc-200'} my-5`} />

                <div className="space-y-2">
                    <div className={`${isDark ? 'text-gray-400' : 'text-zinc-600'} text-[14px] md:text-[15px] font-semibold`}>Summary</div>
                    <p className={`${isDark ? 'text-gray-300' : 'text-zinc-700'} text-[12px] md:text-[13px] leading-6 text-justify`}>
                        {lecture.summary}
                    </p>
                </div>
            </div>
        </div>
    );
};
// --- End LectureSummaryModal Component ---

// --- TransactionDetailsModal Component (No changes needed here) ---
const TransactionDetailsModal = ({ transaction, isDark, onClose }) => {
    if (!transaction) return null;

    return (
        <div
            // Updated overlay with dark color and backdrop blur
            className="fixed inset-0 bg-black/50 backdrop-blur-md z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <div
                className={`w-full max-w-lg p-6 rounded-2xl shadow-2xl ${isDark ? "bg-zinc-900 text-gray-100" : "bg-white text-zinc-900"
                    } border ${isDark ? 'border-zinc-800' : 'border-zinc-200'}`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-start mb-5">
                    <h2 className="text-[20px] md:text-[22px] font-semibold leading-tight tracking-[-0.01em]">Transaction Details</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors cursor-pointer">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="text-[13px] md:text-sm">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-5">
                        <div>
                            <div className={`${isDark ? 'text-gray-400' : 'text-zinc-500'} text-[12px] md:text-[13px] font-medium`}>Transaction ID</div>
                            <div className={`mt-1 text-[13px] md:text-[14px] ${isDark ? 'text-white/90' : 'text-zinc-900/90'}`}>{transaction.transactionID}</div>
                        </div>
                        <div>
                            <div className={`${isDark ? 'text-gray-400' : 'text-zinc-500'} text-[12px] md:text-[13px] font-medium`}>Status</div>
                            <div className={`mt-1 text-[13px] md:text-[14px] font-semibold ${transaction.status === 'Completed' ? 'text-[#0CFF00]' : 'text-red-500'}`}>{transaction.status}</div>
                        </div>

                        <div>
                            <div className={`${isDark ? 'text-gray-400' : 'text-zinc-500'} text-[12px] md:text-[13px] font-medium`}>Date & Time</div>
                            <div className={`mt-1 text-[13px] md:text-[14px] ${isDark ? 'text-white/90' : 'text-zinc-900/90'}`}>{transaction.date} at {transaction.time}</div>
                        </div>
                        <div>
                            <div className={`${isDark ? 'text-gray-400' : 'text-zinc-500'} text-[12px] md:text-[13px] font-medium`}>Payment Method</div>
                            <div className={`mt-1 text-[13px] md:text-[14px] ${isDark ? 'text-white/90' : 'text-zinc-900/90'}`}>{transaction.status === 'Completed' ? 'Credit Card' : 'N/A'}</div>
                        </div>

                        <div className="sm:col-span-2">
                            <div className={`${isDark ? 'text-gray-400' : 'text-zinc-500'} text-[12px] md:text-[13px] font-medium`}>Transaction Type</div>
                            <div className={`mt-1 text-[13px] md:text-[14px] ${isDark ? 'text-white/90' : 'text-zinc-900/90'}`}>{transaction.transactionType}</div>
                        </div>

                        <div className="sm:col-span-2">
                            <div className={`${isDark ? 'text-gray-400' : 'text-zinc-500'} font-medium`}>Description</div>
                            <div className={`mt-1 ${isDark ? 'text-white/90' : 'text-zinc-900/90'}`}>{transaction.description}</div>
                        </div>
                    </div>

                    <hr className={`${isDark ? 'border-zinc-800' : 'border-zinc-200'} my-5`} />

                    <div className="flex items-center justify-between">
                        <div className={`${isDark ? 'text-gray-400' : 'text-zinc-500'} text-[14px] md:text-[15px] font-semibold`}>Total Amount Paid</div>
                        <div className="text-lg md:text-xl font-bold text-[#0CFF00]">{transaction.amount}</div>
                    </div>
                </div>
            </div>
        </div>
    );
};
// --- End TransactionDetailsModal Component ---


function StudentDetails({ theme, isDark, toggleTheme, sidebardata }) {
    const location = useLocation();
    const navigate = useNavigate();
    const stateFirstName = location.state?.firstName;
    const stateMiddleName = location.state?.middleName;
    const stateLastName = location.state?.lastName;
    const [activeTab, setActiveTab] = useState("history");
    const [selectedTransaction, setSelectedTransaction] = useState(null); // State for Transaction Details modal
    const [selectedLecture, setSelectedLecture] = useState(null); // **NEW State for Lecture Summary modal**
    const [student, setStudent] = useState(null);
    const [loading, setLoading] = useState(true);

    // Lecture stats / ratio data (now driven by API summary)
    const [progressData, setProgressData] = useState({
        overallProgress: 0,
        totalLectures: 0,
        watchedMinutes: 0,
        totalMinutes: 0,
        completion: 0,
    });

    // Lecture list data (will be fetched from API)
    const [lectures, setLectures] = useState([]);
    const [lecturesLoading, setLecturesLoading] = useState(true);
    const [lecturesError, setLecturesError] = useState(null);

    // Purchase history data (unchanged)
    const [purchaseHistory] = useState([
        {
            date: "25-10-2025",
            time: "14:30",
            transactionID: "TXN20251025143001",
            transactionType: "Course Purchase",
            description: "Complete 10th Grade Science Course Package",
            amount: "2,999",
            status: "Completed",
        },
        {
            date: "25-10-2025",
            time: "14:30",
            transactionID: "TXN20251025143002",
            transactionType: "Study Material",
            description: "Advanced Physics eBook and Notes",
            amount: "2,999",
            status: "Completed",
        },
        {
            date: "25-10-2025",
            time: "14:30",
            transactionID: "TXN20251025143003",
            transactionType: "Test Series",
            description: "Monthly Mock Test Subscription",
            amount: "3,999",
            status: "Not Completed",
        },
        {
            date: "25-10-2025",
            time: "14:30",
            transactionID: "TXN20251025143004",
            transactionType: "Course Purchase",
            description: "Advanced Mathematics Module",
            amount: "2,999",
            status: "Completed",
        },
        {
            date: "25-10-2025",
            time: "14:30",
            transactionID: "TXN20251025143005",
            transactionType: "Test Series",
            description: "Premium Test Series Subscription",
            amount: "3,999",
            status: "Not Completed",
        },
        {
            date: "25-10-2025",
            time: "14:30",
            transactionID: "TXN20251025143006",
            transactionType: "Course Purchase",
            description: "English Grammar & Writing Course",
            amount: "2,999",
            status: "Completed",
        },
        {
            date: "25-10-2025",
            time: "14:30",
            transactionID: "TXN20251025143007",
            transactionType: "Live Class",
            description: "Weekly Doubt Clearing Session Pass",
            amount: "2,999",
            status: "Not Completed",
        },
    ]);

    const totalAmount = purchaseHistory
        .filter(p => p.status === "Completed")
        .reduce((sum, p) => sum + parseInt(p.amount.replace(/[₹,]/g, "")), 0);

    const fetchWatchedLectures = async (enrollmentNumber) => {
        setLecturesLoading(true);
        setLecturesError(null);

        try {
            const token = localStorage.getItem('access_token');
            if (!token) {
                setLecturesError('No authentication token found');
                setLecturesLoading(false);
                return;
            }

            const response = await axios.get(
                `${BACKEND_API_URL}/school-portal/watched-lectures/cards?enrollment_number=${encodeURIComponent(enrollmentNumber)}`,
                {
                    headers: {
                        'Accept': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                }
            );

            if (response.data?.status && Array.isArray(response.data?.data?.cards)) {
                const cards = response.data.data.cards;
                const totalLectures = cards.length;

                // Calculate progress based on watched lectures
                const completedVideos = cards.filter(card => {
                    const [watched, total] = card.progress.split('/').map(Number);
                    return watched > 0;
                }).length;

                const overallProgress = totalLectures > 0
                    ? Math.round((completedVideos / totalLectures) * 100)
                    : 0;

                // Calculate total watched minutes
                const totalWatchedMinutes = cards.reduce((sum, card) => {
                    const [watched] = card.progress.split('/').map(Number);
                    return sum + (watched || 0);
                }, 0);

                setProgressData({
                    overallProgress,
                    totalLectures,
                    watchedMinutes: totalWatchedMinutes,
                    totalMinutes: 0,
                    completion: overallProgress,
                });

                // Format the lectures data to match the expected structure
                const formattedLectures = cards.map(card => ({
                    title: card.title,
                    subject: card.subject,
                    chapter: card.chapter,
                    progress: card.progress,
                    date: card.watched_date || new Date().toLocaleDateString('en-GB'),
                    summary: card.summary || 'No summary available',
                }));

                setLectures(formattedLectures);
            } else {
                setLecturesError('No watched lectures data found');
                setLectures([]);
            }
        } catch (error) {
            console.error('Failed to fetch watched lectures:', error);
            setLecturesError(error.response?.data?.message || 'Failed to fetch watched lectures');
        } finally {
            setLecturesLoading(false);
        }
    };

    const fetchStudentDetails = async (enrollmentNumber) => {
        if (!enrollmentNumber) {
            handleerror('No enrollment number provided');
            navigate('/Student/StudentsList');
            return;
        }

        setLoading(true);
        try {
            const token = localStorage.getItem('access_token');
            const config = {
                headers: {
                    'Accept': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                }
            };

            const response = await axios.get(
                `${BACKEND_API_URL}/student-management/students`,
                config
            );

            if (response.data?.status === true && Array.isArray(response.data?.data?.students)) {
                const students = response.data.data.students;
                const foundStudent = students.find(s => s.enrollment_number === enrollmentNumber);

                if (foundStudent) {
                    setStudent({
                        name: `${stateFirstName || foundStudent.roster_first_name || ''} ${stateLastName || foundStudent.roster_last_name || ''}`.replace(/\s+/g, ' ').trim() || foundStudent.enrollment_number || 'Unknown',
                        enrollment: foundStudent.enrollment_number,
                        class: `${foundStudent.std || ''} - Division ${foundStudent.roster_division || ''}`
                    });
                } else {
                    handleerror('Student not found');
                    navigate('/Student/StudentsList');
                }
            } else {
                handleerror('Failed to fetch student data');
                navigate('/Student/StudentsList');
            }
        } catch (error) {
            console.error('Error fetching student details:', error);
            handleerror(error.response?.data?.message || error.message || 'Failed to fetch student details');
            navigate('/Student/StudentsList');
        } finally {
            setLoading(false);
        }
    };

    // Fetch student details on component mount
    useEffect(() => {
        const enrollmentNumber = location.state?.enrollmentNumber;
        if (enrollmentNumber) {
            fetchStudentDetails(enrollmentNumber);
            fetchWatchedLectures(enrollmentNumber); // Fetch watched lectures for specific student
        } else {
            handleerror('No enrollment number provided');
            navigate('/Student/StudentsList');
        }
    }, [location.state?.enrollmentNumber, navigate]);

    const handleViewDetails = (transaction) => {
        setSelectedTransaction(transaction);
        document.body.style.overflow = 'hidden';
    };

    const handleCloseModal = () => {
        setSelectedTransaction(null);
        setSelectedLecture(null);
        document.body.style.overflow = 'auto';
    };

    const handleViewSummary = (lecture) => {
        setSelectedLecture(lecture);
        document.body.style.overflow = 'hidden';
    };

    const isModalOpen = selectedTransaction || selectedLecture;


    return (
        <div
            className={`flex overflow-x-hidden ${isDark
                ? "bg-zinc-950 text-gray-100"
                : "bg-zinc-50 text-zinc-900"
                } h-screen transition-colors duration-300`}
        >
            <Sidebar isDark={isDark} sidebardata={sidebardata} />

            {/* Content Area - Apply blur when modal is active */}
            <div
                className={`flex flex-col min-h-0 h-screen w-full md:ml-15 lg:ml-72 p-2 md:p-7 pb-0 overflow-x-hidden transition-all duration-300 ${isModalOpen ? 'backdrop-blur-sm pointer-events-none' : '' // Use isModalOpen
                    }`}
            >
                <div className="pointer-events-auto"> {/* Header remains clickable */}
                    <Header
                        title="Student Management"
                        isDark={isDark}
                        toggleTheme={toggleTheme}
                    />
                </div>

                {/* Main Content */}
                <main className="mt-6 flex-1 overflow-y-auto overflow-x-hidden no-scrollbar space-y-6">
                    {/* Student Details */}
                    {loading ? (
                        <div className={`${isDark ? 'bg-zinc-900 border-zinc-800 text-gray-100' : 'bg-white border-zinc-200 text-zinc-900 shadow-sm'} border rounded-xl p-6`}>
                            <div className="flex items-center justify-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                                <span className="ml-3 text-sm">Loading student details...</span>
                            </div>
                        </div>
                    ) : student ? (
                        <div className={`${isDark ? 'bg-zinc-900 border-zinc-800 text-gray-100' : 'bg-white border-zinc-200 text-zinc-900 shadow-sm'} border rounded-xl p-6`}>
                            <div className="flex items-center -mt-3.5 -ml-3 mb-3">
                                <button
                                    onClick={() => navigate(-1)}
                                    className={`p-2 rounded-lg transition-colors cursor-pointer ${isDark ? 'hover:bg-zinc-800 text-gray-300' : 'hover:bg-zinc-100 text-zinc-700'}`}
                                >
                                    <ArrowLeft className="w-5 h-5" />
                                </button>
                                <h2 className="ml-2 font-inter text-[22px] font-medium leading-none tracking-normal capitalize">
                                    Student Details
                                </h2>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-[13px] md:text-sm">
                                <div>
                                    <span className={`${isDark ? 'text-gray-400' : 'text-zinc-500'}`}>Name:</span>{" "}
                                    {student.name}
                                </div>
                                <div>
                                    <span className={`${isDark ? 'text-gray-400' : 'text-zinc-500'}`}>
                                        Enrollment Number:
                                    </span>{" "}
                                    {student.enrollment}
                                </div>
                                <div>
                                    <span className={`${isDark ? 'text-gray-400' : 'text-zinc-500'}`}>Class:</span>{" "}
                                    {student.class}
                                </div>
                            </div>
                        </div>
                    ) : null}

                    {/* Tabs */}
                    <div className={`flex items-center justify-between ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-zinc-100 border-zinc-200'} p-2 border-b rounded-4xl`}>
                        <div className="relative flex w-full text-[13px] md:text-sm font-medium">
                            <div
                                className={`absolute cursor-pointer inset-y-0 w-1/2 ${isDark ? 'bg-zinc-800' : 'bg-[#696CFF]'} rounded-full transition-transform duration-300 ease-in-out`}
                                style={{
                                    transform:
                                        activeTab === "history"
                                            ? "translateX(0%)"
                                            : "translateX(100%)",
                                }}
                            />

                            <button
                                onClick={() => setActiveTab("history")}
                                className={`relative flex-1 px-4 py-2 rounded-full transition-colors z-10 cursor-pointer ${activeTab === 'history'
                                    ? `${isDark ? 'text-white' : 'text-white'}`
                                    : `${isDark ? 'text-gray-400' : 'text-black'}`
                                    }`}
                            >
                                History
                            </button>
                            <button
                                onClick={() => setActiveTab("old")}
                                className={`relative flex-1 px-4 py-2 rounded-full transition-colors z-10 cursor-pointer ${activeTab === 'old'
                                    ? `${isDark ? 'text-white' : 'text-white'}`
                                    : `${isDark ? 'text-gray-400' : 'text-black'}`
                                    }`}
                            >
                                Old Purchase
                            </button>
                        </div>
                    </div>

                    {/* History Tab Content */}
                    {activeTab === "history" && (
                        <>
                            {/* Lecture Watching Ratio */}
                            <div className={`${isDark ? 'bg-zinc-900 border-zinc-800 text-gray-100' : 'bg-white border-zinc-200 text-zinc-900 shadow-sm'} rounded-xl p-6 border`}>
                                <h2 className="text-base md:text-lg font-semibold mb-4">
                                    Lecture Watching Ratio
                                </h2>

                                <div className="flex justify-between items-center text-[13px] md:text-sm mb-4">
                                    <span className={`${isDark ? 'text-[#AAAAAA]' : 'text-zinc-500'}`}>
                                        Overall Progress
                                    </span>
                                    <span className={`text-lg md:text-xl font-bold ${isDark ? 'text-white' : 'text-[#3498db]'}`}>
                                        {progressData.overallProgress.toFixed(2)}%
                                    </span>
                                </div>

                                <div className={`h-2 ${isDark ? 'bg-zinc-800' : 'bg-zinc-200'} rounded-full mb-6`}>
                                    <div
                                        className={`h-2 ${isDark ? 'bg-blue-500' : 'bg-[#696CFF]'} rounded-full`}
                                        style={{
                                            width: `${progressData.overallProgress}%`,
                                        }}
                                    ></div>
                                </div>

                                <div className={`grid grid-cols-3 text-[13px] md:text-sm ${isDark ? 'text-gray-400' : 'text-zinc-500'}`}>
                                    <div>
                                        <div className={`font-semibold ${isDark ? 'text-white/70' : 'text-zinc-900'}`}>
                                            Total Lecture
                                        </div>
                                        {progressData.totalLectures}
                                    </div>
                                    <div>
                                        <div className={`font-semibold ${isDark ? 'text-white/70' : 'text-zinc-900'}`}>
                                            Watched Minutes
                                        </div>
                                        {progressData.watchedMinutes}/
                                        {progressData.totalMinutes || '-'} min
                                    </div>
                                    <div>
                                        <div className={`font-semibold ${isDark ? 'text-white/70' : 'text-zinc-900'}`}>
                                            Completion
                                        </div>
                                        {progressData.completion}%
                                    </div>
                                </div>
                            </div>

                            {/* Lecture List Table */}
                            <div className={`border ${isDark ? 'border-zinc-800' : 'border-zinc-200'} rounded-xl overflow-hidden mb-6 ${isDark ? '' : 'bg-white shadow-sm'}`}>
                                <div className={`${isDark ? 'bg-zinc-900' : 'bg-zinc-100'} p-4 mb-3 border-b ${isDark ? 'border-zinc-800' : 'border-zinc-200'}`}>
                                    <h2 className={`text-base md:text-[17px] font-semibold ${isDark ? 'text-white' : 'text-zinc-900'}`}>
                                        List Of Watched Lecture
                                    </h2>
                                </div>

                                <div className="overflow-x-auto no-scrollbar">
                                    <table className="w-full text-[13px] md:text-sm text-left border-collapse" style={{ minWidth: 960 }}>
                                        <thead className={`${isDark ? 'text-white border-zinc-800' : 'text-zinc-800 border-zinc-200'} border-b`}>
                                            <tr>
                                                <th className="pb-3 px-6 font-medium whitespace-nowrap">
                                                    Lecture Title
                                                </th>
                                                <th className="pb-3 px-4 font-medium whitespace-nowrap">
                                                    Subject
                                                </th>
                                                <th className="pb-3 px-4 font-medium whitespace-nowrap">
                                                    Chapter
                                                </th>
                                                <th className="pb-3 px-4 font-medium whitespace-nowrap">
                                                    Progress
                                                </th>
                                                <th className="pb-3 px-4 font-medium whitespace-nowrap">
                                                    Watched Date
                                                </th>
                                                <th className="pb-3 px-4 font-medium whitespace-nowrap">
                                                    Summary
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className={`${isDark ? 'text-[#AAAAAA]' : 'text-zinc-900/80'}`}>
                                            {lecturesLoading ? (
                                                <tr>
                                                    <td colSpan="6" className="py-8 text-center">
                                                        <div className="flex items-center justify-center">
                                                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mr-3"></div>
                                                            <span className="text-sm">Loading watched lectures...</span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ) : lecturesError ? (
                                                <tr>
                                                    <td colSpan="6" className="py-8 text-center">
                                                        <div className="text-sm text-red-500">{lecturesError}</div>
                                                    </td>
                                                </tr>
                                            ) : lectures.length === 0 ? (
                                                <tr>
                                                    <td colSpan="6" className="py-8 text-center">
                                                        <div className="text-sm opacity-60">No watched lectures found</div>
                                                    </td>
                                                </tr>
                                            ) : (
                                                lectures.map((lec, i) => (
                                                    <tr
                                                        key={i}
                                                        className={`border-b ${isDark ? 'border-zinc-800/50 hover:bg-zinc-800/30' : 'border-zinc-200 hover:bg-zinc-50'} transition-colors`}
                                                    >
                                                        <td className="py-3 md:py-4 px-6 whitespace-nowrap overflow-hidden text-ellipsis">
                                                            {lec.title}
                                                        </td>
                                                        <td className="py-3 md:py-4 px-4 whitespace-nowrap overflow-hidden text-ellipsis">
                                                            {lec.subject}
                                                        </td>
                                                        <td className="py-3 md:py-4 px-4 whitespace-nowrap overflow-hidden text-ellipsis">
                                                            {lec.chapter}
                                                        </td>
                                                        <td className="py-3 md:py-4 px-4">
                                                            <div className="flex items-center gap-2">
                                                                <div className={`w-32 h-1.5 ${isDark ? 'bg-zinc-800' : 'bg-zinc-200'} rounded-full overflow-hidden`}>
                                                                    <div
                                                                        className={`h-full ${isDark ? 'bg-blue-500' : 'bg-[#696CFF]'} rounded-full`}
                                                                        style={{
                                                                            width: `${Math.min((parseInt(lec.progress?.split('/')[0]) || 0) / (parseInt(lec.progress?.split('/')[1]) || 1) * 100, 100)}%`,
                                                                        }}
                                                                    ></div>
                                                                </div>
                                                                <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-zinc-500'}`}>
                                                                    {lec.progress}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="py-3 md:py-4 px-4 whitespace-nowrap overflow-hidden text-ellipsis">
                                                            {lec.date}
                                                        </td>
                                                        <td className="py-3 md:py-4 px-4">
                                                            <button
                                                                onClick={() => handleViewSummary(lec)}
                                                                className={`flex items-center gap-1 cursor-pointer transition-colors pointer-events-auto ${isDark ? 'text-blue-500 hover:text-blue-400' : 'text-[#696CFF] hover:opacity-80'}`}
                                                            >
                                                                <svg
                                                                    className="w-4 h-4"
                                                                    fill="none"
                                                                    stroke="currentColor"
                                                                    viewBox="0 0 24 24"
                                                                >
                                                                    <path
                                                                        strokeLinecap="round"
                                                                        strokeLinejoin="round"
                                                                        strokeWidth={2}
                                                                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                                                    />
                                                                </svg>
                                                                Summary
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Old Purchase Tab Content */}
                    {activeTab === "old" && (
                        <div className={`rounded-lg overflow-hidden mb-6 ${isDark ? 'border-zinc-800 bg-zinc-950' : 'border-zinc-200 bg-white shadow-sm'}`}>
                            {/* Header */}
                            <div className={`${isDark ? 'bg-zinc-900' : 'bg-zinc-100'} p-4 flex items-center justify-between`}>
                                <div className="flex items-center gap-2">
                                    <Handbag className={`w-6 h-6 ${isDark ? 'text-zinc-100' : 'text-zinc-900'}`} />
                                    <h2 className="text-base md:text-lg font-semibold">
                                        Purchase History
                                    </h2>
                                </div>
                                <div className="text-right">
                                    <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-zinc-500'}`}>Total Transaction Ammount</div>
                                    <div className="text-sm font-semibold text-[#0CFF00]">₹{totalAmount.toLocaleString()}</div>
                                </div>
                            </div>

                            {/* Table */}
                            <div className="overflow-x-auto no-scrollbar">
                                <table className="w-full text-[13px] md:text-sm text-left border-collapse" style={{ minWidth: 960 }}>
                                    <thead className={`${isDark ? 'text-white' : 'text-zinc-900/80'} border-b ${isDark ? 'border-zinc-800/50' : 'border-zinc-200'}`}>
                                        <tr>
                                            <th className="py-3 px-6 font-medium whitespace-nowrap">Date</th>
                                            <th className="py-3 px-4 font-medium whitespace-nowrap">Time</th>
                                            <th className="py-3 px-4 font-medium whitespace-nowrap">Transaction Type</th>
                                            <th className="py-3 px-4 font-medium whitespace-nowrap">Amount</th>
                                            <th className="py-3 px-4 font-medium whitespace-nowrap">Status</th>
                                            <th className="py-3 px-4 font-medium whitespace-nowrap">Details</th>
                                        </tr>
                                    </thead>
                                    <tbody className={`${isDark ? 'text-[#AAAAAA]/90' : 'text-zinc-900/70'}`}>
                                        {purchaseHistory.map((purchase, i) => (
                                            <tr
                                                key={i}
                                                className={`border-b transition-colors ${isDark ? 'border-zinc-800/50 hover:bg-zinc-900/30' : 'border-zinc-200 hover:bg-zinc-50'}`}
                                            >
                                                <td className="py-3 md:py-4 px-6 whitespace-nowrap">{purchase.date}</td>
                                                <td className="py-3 md:py-4 px-4 whitespace-nowrap">{purchase.time}</td>
                                                <td className="py-3 md:py-4 px-4 whitespace-nowrap">{purchase.transactionType}</td>
                                                <td className="py-3 md:py-4 px-4 font-medium whitespace-nowrap">₹{purchase.amount}</td>
                                                <td className="py-3 md:py-4 px-4 whitespace-nowrap">
                                                    <span
                                                        className={`${purchase.status === "Completed"
                                                            ? "text-[#0CFF00]"
                                                            : "text-white"
                                                            }`}
                                                    >
                                                        {purchase.status}
                                                    </span>
                                                </td>
                                                <td className="py-3 md:py-4 px-4 whitespace-nowrap">
                                                    <button
                                                        onClick={() => handleViewDetails(purchase)}
                                                        className={`cursor-pointer transition-colors pointer-events-auto ${isDark ? 'text-white' : 'text-[#696CFF] hover:opacity-80'}`}
                                                    >
                                                        View Details
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </main>
            </div>

            {/* Transaction Details Modal Component */}
            <TransactionDetailsModal
                transaction={selectedTransaction}
                isDark={isDark}
                onClose={handleCloseModal}
            />

            {/* **NEW Lecture Summary Modal Component** */}
            <LectureSummaryModal
                lecture={selectedLecture}
                isDark={isDark}
                onClose={handleCloseModal}
            />
        </div>
    );
}

export default StudentDetails;