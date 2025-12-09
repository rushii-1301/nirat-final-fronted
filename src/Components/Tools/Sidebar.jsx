import React, { useState, useEffect } from "react";
import axios from "axios";
import { BACKEND_API_URL, getAsset, handlesuccess, handleerror } from "../../utils/assets.js";
import {
  Home,
  Users,
  BookOpen,
  GraduationCap,
  ChevronDown,
  ChevronRight,
  SlidersHorizontal,
  BarChart3,
  Layers,
  User,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

function Sidebar({ isDark, sidebardata = [] }) {
  const [isMembersOpen, setMembersOpen] = useState(false);
  const [isLectureOpen, setLectureOpen] = useState(false);
  const [isStudentOpen, setStudentOpen] = useState(false);
  const [isMobileMenu, setMobileMenu] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [adminId] = useState(localStorage.getItem('admin_id'));

  const location = useLocation();
  const navigate = useNavigate();

  // ✅ Handle responsive default state
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width >= 1024) {
        setSidebarOpen(true);
        setIsTablet(false);
      } else if (width >= 768) {
        setSidebarOpen(false);
        setIsTablet(true);
      } else {
        setSidebarOpen(true);
        setIsTablet(false);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isAdminPath = location?.pathname?.toLowerCase().startsWith("/admin");
  const isStudentPortalPath = location?.pathname?.toLowerCase().startsWith("/studentportel");

  const handleLogout = async () => {
    try {
      // Admin portal logout
      if (isAdminPath || !isStudentPortalPath) {
        const token = localStorage.getItem('access_token');
        if (!token) {
          handleerror('You are not logged in.');
          localStorage.clear();
          navigate('/login');
          return;
        }

        const headers = {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        };

        const response = await axios.post(
          `${BACKEND_API_URL}/auth/logout`,
          {},
          { headers }
        );
        if (response.status === 200) {
          handlesuccess(response.data?.message || 'Logged out successfully');
          localStorage.clear();
          navigate("/login");
        } else {
          handleerror('Failed to logout. Please try again.');
        }

        localStorage.clear();
        navigate('/login');
        return;
      }

      // Student portal logout (/StudentPortel...)
      if (isStudentPortalPath) {
        const token = localStorage.getItem('token');
        if (!token) {
          handleerror('You are not logged in.');
          localStorage.clear();
          navigate('/StudentPortel/Login');
          return;
        }

        const headers = {
          accept: 'application/json',
          Authorization: `Bearer ${token}`,
        };

        try {
          const response = await axios.post(
            `${BACKEND_API_URL}/school-portal/auth/logout`,
            {},
            { headers }
          );

          if (response.status === 200) {
            handlesuccess(response.data?.message || 'Logged out successfully');
            localStorage.clear();
            navigate("StudentPortel/Login");
          } else {
            handleerror('Failed to logout. Please try again.');
          }
        } catch (error) {
          console.error('Error during student logout:', error);
          const msg = error.response?.data?.detail || error.response?.data?.message || 'Error during logout';
          handleerror(msg);
        }

        localStorage.clear();
        navigate('/StudentPortel/Login');
        return;
      }

      // Fallback: clear and go home if no specific portal matched
      localStorage.clear();
      navigate('/');
    } catch (error) {
      console.error('Error during logout:', error);
      const msg = error.response?.data?.detail || error.response?.data?.message || 'Error during logout';
      handleerror(msg);
      localStorage.clear();
      navigate('/');
    }
  };

  return (
    <>
      {/* ===== Mobile Toggle Button ===== */}
      <button
        onClick={() => setMobileMenu(!isMobileMenu)}
        className={`md:hidden fixed top-6 left-4 cursor-pointer z-50 ${isDark ? 'bg-zinc-900 text-gray-200 hover:bg-zinc-800' : 'bg-transparent text-zinc-700 hover:bg-zinc-100'} ${!isMobileMenu && "p-2 rounded-lg"}  transition`}
      >
        {!isMobileMenu && <Menu size={22} />}
      </button>

      {/* ===== Sidebar ===== */}
      <aside
        className={`${isDark ? 'bg-zinc-900 text-gray-200' : 'bg-white text-zinc-700'} flex flex-col justify-between fixed top-0 left-0 z-40 h-screen transition-all duration-300 ease-in-out
        ${isMobileMenu ? "translate-x-0 w-64" : "-translate-x-full"}
        md:translate-x-0 ${isSidebarOpen ? "md:w-64" : "md:w-15"} lg:w-72`}
      >
        {/* <div className="flex flex-col h-full"> */}
        <div className="flex flex-col min-h-full justify-between">

          {/* ===== Logo Section ===== */}
          <div className={`relative flex flex-col h-[100px] items-center justify-center p-4 ${isDark ? 'border-zinc-800' : 'border-zinc-200'} transition-colors duration-300`}>
            <img
              src={isDark ? getAsset('inailogo_dark') : getAsset('inailogo_light')}
              alt="INAI Logo"
              className={`object-contain transition-all duration-300 ${isSidebarOpen ? "w-28" : "w-10"
                }`}
            />

            {/* ===== Tablet Toggle Button (hidden as requested) ===== */}
            {false && isTablet && (
              <button
                onClick={() => setSidebarOpen(!isSidebarOpen)}
                className={`absolute top-25 ${isSidebarOpen ? `right-1` : "left-1/2 -translate-x-1/2"
                  } ${isDark ? 'bg-zinc-900 text-gray-200 hover:bg-zinc-800' : 'bg-transparent text-zinc-700 hover:bg-zinc-100'} p-3 rounded-lg transition cursor-pointer`}
              >
                {isSidebarOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            )}
          </div>

          {/* ===== Navigation (always show; icons only on tablet collapsed) ===== */}
          <nav className="flex-1 flex flex-col gap-[15px] mt-2 p-1 z-1000">
            {(sidebardata || []).map((bar, i) => {
              // Calculate active state manually
              const activePaths = Array.isArray(bar?.activePaths) ? bar.activePaths : [];
              const isInCustomGroup = activePaths.some((p) =>
                typeof p === "string" && location.pathname === p
              );
              const baseMatch = typeof bar?.to === "string" && location.pathname === bar.to;
              const isActiveCombined = baseMatch || isInCustomGroup;

              return (
                <div
                  key={i}
                  onClick={() => navigate(bar?.to || "/login")}
                  className={`group relative flex items-center space-x-3 py-2 px-3 rounded-lg transition-colors duration-300 cursor-pointer
                  ${isDark ? 'hover:bg-zinc-800/40' : 'hover:bg-[#eef0ff]/40'}
                  ${isActiveCombined
                      ? isDark
                        ? ' bg-zinc-800 text-white'
                        : ' bg-[#eef0ff] text-[#696CFF]'
                      : ''}`}
                >
                  <img
                    src={isDark ? getAsset(bar?.icon[0]) : getAsset(bar?.icon[1])}
                    alt="home_dark"
                    className={`object-contain transition-all duration-300 w-5`}
                  />

                  {isSidebarOpen && <span>{bar?.label}</span>}
                  {/* Tooltip label on tablet when collapsed */}
                  {isTablet && !isSidebarOpen && (
                    <span className={`pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-2 whitespace-nowrap text-xs ${isDark ? 'bg-zinc-800 text-gray-200' : 'bg-white text-zinc-700'} border ${isDark ? 'border-zinc-700' : 'border-zinc-200'} rounded px-2 py-1 opacity-0 group-hover:opacity-100 shadow`}>{bar?.label}</span>
                  )}
                </div>
              );
            })}
          </nav>

          {/* ===== Logout (always show; icon only on tablet collapsed, label on hover) ===== */}
          <div className={`p-4 border-t ${isDark ? 'border-zinc-800' : 'border-zinc-200'} transition-colors duration-300`}>
            <div className="relative group cursor-pointer">
              <button
                onClick={handleLogout}
                className={`w-full cursor-pointer flex items-center justify-center space-x-2 py-2 rounded-lg transition-colors duration-300 ${isDark ? 'bg-zinc-800 hover:bg-zinc-700' : 'bg-zinc-100 hover:bg-zinc-200'}`}
              >
                <LogOut size={16} />
                {isSidebarOpen && <span>Logout</span>}
              </button>
              {isTablet && !isSidebarOpen && (
                <span className={`pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-2 whitespace-nowrap text-xs ${isDark ? 'bg-zinc-800 text-gray-200' : 'bg-white text-zinc-700'} border ${isDark ? 'border-zinc-700' : 'border-zinc-200'} rounded px-2 py-1 opacity-0 group-hover:opacity-100 shadow`}>Logout</span>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* ===== Mobile Overlay ===== */}
      {isMobileMenu && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setMobileMenu(false)}
        ></div>
      )}

      {/* ===== Tablet Overlay (md only) - show when sidebar expanded ===== */}
      {isTablet && isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30 hidden md:block lg:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}
    </>
  );
}

export default Sidebar;
