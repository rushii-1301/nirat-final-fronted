import React, { useEffect, useState } from 'react'
import { Search, Bell, Sun, Moon, User } from "lucide-react";
import { useLocation, useNavigate } from 'react-router-dom';

import { checkType, BACKEND_API_URL, studentPortalAuth } from '../../utils/assets';
import axios from 'axios';

const Portalheader = ({ title, isDark, toggleTheme, searchValue, setSearchValue, isSearchbar = false }) => {
    const location = useLocation();
    const pathname = location.pathname || "";
    const isAdminDashboard = /^\/admin\/dashboard$/i.test(pathname);
    const isAdminPath = /^\/admin\//i.test(pathname);
    const isLecturePath = /^\/lecture\//i.test(pathname);
    const isStudentPath = /^\/student\//i.test(pathname);
    const isChapterPath = /^\/chapter\//i.test(pathname);
    const isStudentPortalPath = /^\/StudentPortel\//i.test(pathname);
    const navigate = useNavigate();

    const [isMobile, setIsMobile] = useState(false);
    const [adminProfileImage, setAdminProfileImage] = useState(null);

    useEffect(() => {
        const handleResize = () => {
            const width = window.innerWidth;
            if (width < 768) {
                setIsMobile(true);
            } else {
                setIsMobile(false);
            }
        };

        handleResize();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    useEffect(() => {
        if (!isAdminPath) return;
        if (typeof window === 'undefined') return;

        const stored = localStorage.getItem('admin_profile_image');
        if (stored) {
            setAdminProfileImage(stored);
        } else {
            fetchProfile();
        }
    }, [isAdminPath]);

    useEffect(() => {
        validation();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pathname]);

    const handleNotificationPath = () => {
        if (isLecturePath) {
            return "/lecture/Notification";
        } else if (isAdminPath) {
            return "/Admin/Notification";
        } else if (isStudentPath) {
            return "/student/Notification";
        } else if (isChapterPath) {
            return "/chapter/Notification";
        }
    }

    const fetchProfile = async () => {
        try {
            const response = await axios.get(`${BACKEND_API_URL}/admin-portal/profile`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('access_token')}`,
                },
            });
            const profileData = response.data.data.profile;
            if (profileData && profileData.photo) {
                const normalizedPhoto = profileData.photo.replace(/\\/g, '/');
                localStorage.setItem('admin_profile_image', normalizedPhoto);
                setAdminProfileImage(normalizedPhoto);
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
        }
    }

    const validation = () => {
        // Admin area: only admins allowed
        if (isAdminPath) {
            const ok = checkType('admin');
            if (!ok) {
                navigate('/login');
            }
            return;
        }

        // Member areas: lecture, student, chapter
        if (isLecturePath || isStudentPath || isChapterPath) {
            const ok = checkType('member');
            if (!ok) {
                navigate('/login');
            }
        }

        // Student portal areas: student portal
        if (isStudentPortalPath) {
            const ok = studentPortalAuth("student");
            if (!ok) {
                navigate('/StudentPortel/Login');
            }
        }
    }

    const handleProfilePath = () => {
        if (isAdminPath) {
            return "/Admin/Profile";
        } else if (isLecturePath) {
            return "/lecture/Profile";
        }
        return "/Admin/Profile";
    }

    return (
        <header className={`${isDark ? 'bg-[#111111] border-zinc-800' : 'bg-white border-zinc-200'} flex items-center ${isMobile && !isSearchbar ? 'justify-end' : 'justify-between'} py-3 px-3 transition-colors duration-300`}>
            {/* Left: Title */}
            {!isMobile && (
                <h1 className={`header-1 font-semibold ${isDark ? 'text-white' : 'text-[#696CFF]'}`}>{title}</h1>
            )}

            {/* Center: Search Bar */}
            {isSearchbar && (
                <div className="relative flex items-center w-full max-w-md mx-4">
                    <Search className="absolute left-3 text-zinc-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search..."
                        value={searchValue}
                        onChange={(e) => setSearchValue(e.target.value)}
                        className={`w-full py-2 pl-10 pr-4 rounded-full ${isDark ? 'bg-zinc-800 text-white placeholder-zinc-400' : 'bg-zinc-200 text-zinc-900 placeholder-zinc-500'} focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-300`}
                    />
                </div>
            )}

            {/* Right: Icons */}
            <div className={`flex items-center space-x-1`}>
                {/* Dark / Light toggle */}
                <button onClick={toggleTheme} className={`p-1 rounded-lg transition cursor-pointer ${isDark ? 'hover:bg-zinc-800' : 'hover:bg-zinc-100'}`} aria-label="Toggle theme">
                    {isDark ? <Sun size={18} className="text-gray-300" /> : <Moon size={18} className="text-zinc-700" />}
                </button>

                {/* Notifications - only navigates on lecture routes */}
                {/* <button
                    type="button"
                    onClick={() => navigate(handleNotificationPath())}
                    className={`relative cursor-pointer p-1 rounded-lg transition ${isDark ? 'hover:bg-zinc-800' : 'hover:bg-zinc-100'}`}
                >
                    <Bell size={18} className={`${isDark ? 'text-gray-300' : 'text-zinc-700'} transition-colors duration-300`} />
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                </button> */}

                {/* Profile Avatar */}

                <button
                    type="button"
                    onClick={() => navigate(handleProfilePath())}
                    className="relative cursor-pointer"
                >
                    {adminProfileImage
                        ? <img
                            src={adminProfileImage ? `${BACKEND_API_URL}/${adminProfileImage}` : "https://i.pravatar.cc/32"}

                            alt="User Avatar"
                            className={`w-8 h-8 rounded-full border-2 ${isDark ? 'border-zinc-700' : 'border-zinc-300'} transition-colors duration-300`}
                        />
                        : <User size={32} className="text-gray-300" />
                    }
                    <span className={`absolute bottom-0 right-0 w-2 h-2 bg-green-500 rounded-full border ${isDark ? 'border-zinc-900' : 'border-white'} transition-colors duration-300`}></span>
                </button>

            </div>
        </header>
    )
}

export default Portalheader
