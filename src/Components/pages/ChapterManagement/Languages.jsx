import React, { useState } from "react";
import Sidebar from "../../Tools/Sidebar";
import Header from "../../Tools/Header";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { BACKEND_API_URL, handlesuccess } from "../../../utils/assets";

function Languages({ theme = "dark", isDark: isDarkProp, toggleTheme, sidebardata, backto = "/chapter/Narration" }) {
  const isDark = typeof isDarkProp === "boolean" ? isDarkProp : theme === "dark";

  const [minutes, setMinutes] = useState("");
  const [language, setLanguage] = useState("");
  const location = useLocation();
  const navigate = useNavigate();
  const navState = location.state || {};
  const lectureId = navState.lectureId || null;

  const handleNext = async () => {
    try {
      const duration = Number(minutes);
      const mergedId = lectureId || navState.merged_id || null;

      // Require all fields before calling API
      if (!duration || !language || !mergedId) {
        return;
      }

      const token = localStorage.getItem("access_token");

      const response = await axios.post(
        `${BACKEND_API_URL}/chapter-materials/chapter_lecture/config`,
        {
          merged_id: mergedId,
          language,
          duration,
        },
        {
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }
      );

      if (response?.data?.status) {
        handlesuccess(response?.data?.message || "Lecture configuration saved");
      }

      navigate("/chapter/Narration", {
        state: {
          lectureId,
        },
      });
    } catch (error) {
      console.error("Error saving lecture configuration:", error);
    }
  };

  const cardCls = `${isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200"} border rounded-2xl p-4 sm:p-5 shadow-sm transition-colors duration-200`;

  return (
    <div className={`flex ${isDark ? "bg-black text-gray-100" : "bg-zinc-50 text-zinc-900"} h-screen overflow-hidden transition-colors duration-300`}>
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
                  className={`${isDark
                      ? "bg-zinc-800 text-gray-300 hover:bg-zinc-700 border border-zinc-700"
                      : "bg-white text-zinc-700 hover:bg-zinc-100 border border-zinc-300"
                    } w-full cursor-pointer px-4 py-1.5 flex items-center justify-center rounded-md text-sm`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleNext}
                  className={`${isDark
                      ? "bg-white text-black hover:bg-zinc-100"
                      : "bg-[#696CFF] text-white hover:bg-[#696CFF]/90"
                    } w-full cursor-pointer px-4 py-1.5 flex items-center justify-center rounded-md text-sm`}
                >
                  Next
                </button>
              </div>
            </div>

            {/* Set Time card */}
            <div className={cardCls}>
              <div className="space-y-4">
                <div>
                  <h2 className="text-base sm:text-lg font-semibold flex items-center gap-2">
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-red-500/15 text-red-400 text-xs">
                      ●
                    </span>
                    <span>Set Time For Single Chapter</span>
                  </h2>
                  <p className="mt-1 text-xs sm:text-sm text-gray-400">Set Minute</p>
                </div>

                <div>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={minutes}
                    onChange={(e) => {
                      const onlyDigits = e.target.value.replace(/[^0-9]/g, "");
                      setMinutes(onlyDigits);
                    }}
                    placeholder="Enter Minute"
                    className={`${isDark
                        ? "w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#696CFF]"
                        : "w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-[#696CFF]"
                      }`}
                  />
                </div>
              </div>
            </div>

            {/* Language Selection card */}
            <div className={cardCls}>
              <div className="space-y-4">
                <div>
                  <h2 className="text-base sm:text-lg font-semibold flex items-center gap-2">
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-emerald-500/15 text-emerald-400 text-xs">
                      ●
                    </span>
                    <span>Language Selection</span>
                  </h2>
                  <p className="mt-1 text-xs sm:text-sm text-gray-400">Select Language</p>
                </div>

                <div className="space-y-2">
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className={`${isDark
                        ? "w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-gray-100 focus:outline-none focus:ring-1 focus:ring-[#696CFF]"
                        : "w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#696CFF]"
                      }`}
                  >
                    <option value="">Enter Language</option>
                    <option value="English">English</option>
                    <option value="Hindi">Hindi</option>
                    <option value="Gujarati">Gujarati</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default Languages;
