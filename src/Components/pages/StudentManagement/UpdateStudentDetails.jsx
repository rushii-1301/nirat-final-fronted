
import React, { useState, useEffect } from "react";
import axios from "axios";
import { getAsset, handlesuccess, handleerror } from "../../../utils/assets";
import { useNavigate, useLocation } from "react-router-dom";
import { BACKEND_API_URL } from "../../../utils/assets";
import { X, Loader2 } from "lucide-react";

function UpdateStudentDetails({ theme, isDark, toggleTheme, sidebardata }) {
  const navigate = useNavigate();
  const location = useLocation();

  const stateEnrollmentNumber = location.state?.enrollmentNumber || "";
  const stateId = location.state?.id;

  const [formData, setFormData] = useState({
    firstName: "",
    fatherName: "",
    classStream: "",
    division: "",
    classHead: "",
    enrollmentNumber: "",
    mobileNumber: "",
    parentsNumber: "",
    emailAddress: "",
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Agar StudentsList se enrollmentNumber aaya hai to wahi use karo,
    // warna pehle jaisa localStorage se profile-status prefill karo.

    if (stateEnrollmentNumber) {
      setFormData((prev) => ({
        ...prev,
        enrollmentNumber: stateEnrollmentNumber,
      }));
      // Don't return - let the localStorage logic also run if needed
    }

    const storedEnrollment =
      localStorage.getItem("enrolment_number") ||
      localStorage.getItem("enrollment_number");

    if (!storedEnrollment) return;

    const fetchProfile = async () => {
      setLoading(true);
      try {
        const res = await axios.get(
          `${BACKEND_API_URL}/school-portal/profile-status/${storedEnrollment}`,
          { headers: { accept: "application/json" } }
        );

        const data = res.data || {};
        const prefill = data.prefill || {};

        setFormData((prev) => ({
          ...prev,
          firstName: prefill.first_name || "",
          fatherName: prefill.father_name || "",
          classStream: prefill.class_stream || "",
          division: prefill.division || "",
          classHead: prefill.class_head || "",
          enrollmentNumber: prefill.enrollment_number || storedEnrollment,
          mobileNumber: data.mobile_number || "",
          parentsNumber: data.parents_number || "",
          emailAddress: data.email || "",
        }));
      } catch (error) {
        const msg =
          error.response?.data?.detail ||
          error.response?.data?.message ||
          error.message ||
          "Failed to fetch profile details";

        console.error("Profile status fetch error:", error);
        handleerror(msg);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [stateEnrollmentNumber]);

  // 🟦 GET API: Particular student ki details prefill karne ke liye
  useEffect(() => {
    console.log("GET API useEffect triggered");
    console.log("stateEnrollmentNumber:", stateEnrollmentNumber);
    
    if (!stateEnrollmentNumber) {
      console.log("No stateEnrollmentNumber, returning");
      return;
    }

    const token =
      localStorage.getItem("access_token") ||
      localStorage.getItem("token") ||
      "";

    console.log("Token:", token ? "exists" : "missing");

    if (!token) {
      console.log("No token found, returning");
      return;
    }

    const fetchSelectedStudent = async () => {
      setLoading(true);
      try {
        
        const res = await axios.get(
          `${BACKEND_API_URL}/student-management/roster/${stateEnrollmentNumber}`,
          {
            headers: {
              accept: "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        console.log("GET API Response:", res.data);

        const found = res.data?.data?.profile || res.data?.data || res.data;

        console.log("Found student data:", found);

        if (!found) {
          console.log("No student data found in response");
          return;
        }

        // Map the correct field names from API response
        setFormData((prev) => {
          const updated = {
            ...prev,
            firstName: found.first_name || "",
            fatherName: found.father_name || "",
            classStream: found.class_stream || "",
            division: found.division || "",
            classHead: found.class_head || "",
            enrollmentNumber:
              found.enrollment_number || stateEnrollmentNumber || prev.enrollmentNumber,
            mobileNumber: found.mobile_number || "",
            parentsNumber: found.parents_number || "",
            emailAddress: found.email || "",
          };
          console.log("Updated form data:", updated);
          return updated;
        });

      } catch (error) {
        console.error("GET API Error:", error);
        console.error("Error response:", error.response?.data);
        
        const msg =
          error.response?.data?.message ||
          error.response?.data?.detail ||
          error.message ||
          "Failed to fetch selected student";

        console.error("Error message:", msg);
        handleerror(msg);
      } finally {
        setLoading(false);
      }
    };

    fetchSelectedStudent();
  }, [stateEnrollmentNumber]);

  // 🟦 Input Change Handler
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // 🟦 PUT API (Replaced POST with your Postman request)
  const handleSave = async () => {
    if (!formData.enrollmentNumber) {
      handleerror("Please enter enrollment number");
      return;
    }

    const token = localStorage.getItem("access_token") || 
                 localStorage.getItem("token") || 
                 "";

    setLoading(true);
    try {
      const formDataToSend = new FormData();
      
      // Add all form fields
      const fields = {
        first_name: formData.firstName,
        father_name: formData.fatherName,
        class_stream: formData.classStream,
        division: formData.division,
        class_head: formData.classHead,
        enrollment_number: formData.enrollmentNumber,
        mobile_number: formData.mobileNumber,
        parents_number: formData.parentsNumber,
        email: formData.emailAddress
      };

      // Append all fields to FormData
      Object.entries(fields).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          formDataToSend.append(key, value);
        }
      });


      // Log the payload for debugging
      console.log("FormData entries:");
      for (let pair of formDataToSend.entries()) {
        console.log(pair[0] + ': ', pair[1]);
      }

      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      };

      const res = await axios.put(
        `${BACKEND_API_URL}/student-management/roster/${formData.enrollmentNumber}`,
        formDataToSend,
        config
      );

      handlesuccess(res.data?.message || "Profile updated successfully!");
      
      try {
        localStorage.setItem("studentDetailsCompleted", "true");
      } catch (e) {
        console.error("Failed to update local storage:", e);
      }

      navigate("/Student/list");
    } catch (error) {
      console.error("Update error:", error);
      const errorMessage = error.response?.data?.message || 
                         error.response?.data?.detail || 
                         error.message || 
                         "Failed to update profile";
      
      // Log the full error response for debugging
      if (error.response?.data) {
        console.error("Error response data:", error.response.data);
      }
      
      handleerror(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    navigate("/Student/list");
  };

  const inputCls = isDark
    ? "w-full rounded-md px-3 py-2 text-sm bg-zinc-800 border border-[#2A2A2A] text-white placeholder:text-gray-500 focus:outline-none focus:border-[#3A3A3A]"
    : "w-full rounded-md px-3 py-2 text-sm bg-[#F6F7FF] border border-[#E0E3FF] text-zinc-900 placeholder:text-gray-500 focus:outline-none focus:border-[#6366F1]";

  return (
    <div
      className={`w-full min-h-screen flex flex-col md:flex-row ${
        isDark ? "bg-black" : "bg-[#F4F4FF]"
      }`}
    >
      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/40">
          <div className={`flex flex-col items-center gap-4 p-8 rounded-lg ${isDark ? 'bg-zinc-900' : 'bg-white'}`}>
            <Loader2 className={`h-8 w-8 animate-spin ${isDark ? 'text-white' : 'text-zinc-900'}`} />
            <p className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-zinc-700'}`}>Loading...</p>
          </div>
        </div>
      )}
      <div
        className={`w-full md:w-2/5 flex items-center justify-center p-6 ${
          isDark ? "bg-black" : "bg-[#F4F4FF]"
        }`}
      >
        <div className="text-center">
          <div
            className={`flex flex-col items-center ${
              isDark ? "text-white" : "text-zinc-900"
            }`}
          >
            <img
              src={getAsset(isDark ? "inailogo_dark" : "inailogo_light")}
              alt="INAI Logo"
              className="w-40 md:w-60 h-auto mb-4"
            />
          </div>
        </div>
      </div>

      <div className="w-full md:w-3/5 flex items-center justify-center p-4 sm:p-8">
        <div
          className={`w-full max-w-3xl rounded-2xl p-6 md:p-8 shadow-2xl relative ${
            isDark ? "bg-zinc-900 text-white" : "bg-white text-zinc-900"
          }`}
        >
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-white text-xl leading-none cursor-pointer"
            aria-label="Close"
          >
            <X color={isDark ? "white" : "black"} />
          </button>

          <h2
            className={`text-[32px] font-bold leading-[100%] capitalize mb-4 font-[Inter] ${
              isDark ? "text-white" : "text-zinc-900"
            }`}
          >
            Student Details
          </h2>

          <div className="space-y-3">
            {/* FIRST NAME */}
            <div>
              <label
                className={`block mb-2 text-[14px] font-medium capitalize ${
                  isDark ? "text-white" : "text-zinc-700"
                }`}
              >
                First Name
              </label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                placeholder="Enter First name"
                className={inputCls}
              />
            </div>

            {/* FATHER NAME */}
            <div>
              <label
                className={`block mb-2 text-[14px] font-medium capitalize ${
                  isDark ? "text-white" : "text-zinc-700"
                }`}
              >
                Father Name
              </label>
              <input
                type="text"
                name="fatherName"
                value={formData.fatherName}
                onChange={handleChange}
                placeholder="Enter father name"
                className={inputCls}
              />
            </div>

            {/* CLASS + DIVISION */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label
                  className={`block mb-2 text-[14px] font-medium capitalize ${
                    isDark ? "text-white" : "text-zinc-700"
                  }`}
                >
                  Class / Stream
                </label>
                <input
                  type="text"
                  name="classStream"
                  value={formData.classStream}
                  onChange={handleChange}
                  placeholder="Enter Class | Stream"
                  className={inputCls}
                />
              </div>

              <div>
                <label
                  className={`block mb-2 text-[14px] font-medium capitalize ${
                    isDark ? "text-white" : "text-zinc-700"
                  }`}
                >
                  Division
                </label>
                <input
                  type="text"
                  name="division"
                  value={formData.division}
                  onChange={handleChange}
                  placeholder="Enter Division"
                  className={inputCls}
                />
              </div>
            </div>

            {/* CLASS HEAD + ENROLLMENT NUMBER */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label
                  className={`block mb-2 text-[14px] font-medium capitalize ${
                    isDark ? "text-white" : "text-zinc-700"
                  }`}
                >
                  Class Head
                </label>
                <input
                  type="text"
                  name="classHead"
                  value={formData.classHead}
                  onChange={handleChange}
                  placeholder="Enter Class Head"
                  className={inputCls}
                />
              </div>

              <div>
                <label
                  className={`block mb-2 text-[14px] font-medium capitalize ${
                    isDark ? "text-white" : "text-zinc-700"
                  }`}
                >
                  Enrollment Number
                </label>
                <input
                  type="text"
                  name="enrollmentNumber"
                  value={formData.enrollmentNumber}
                  onChange={handleChange}
                  placeholder="Enter Enrollment Number"
                  className={inputCls}
                />
              </div>
            </div>

            {/* MOBILE + PARENT NUMBER */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label
                  className={`block mb-2 text-[14px] font-medium capitalize ${
                    isDark ? "text-white" : "text-zinc-700"
                  }`}
                >
                  Mobile Number
                </label>
                <input
                  type="tel"
                  name="mobileNumber"
                  value={formData.mobileNumber}
                  onChange={handleChange}
                  placeholder="Enter Mobile Number"
                  className={inputCls}
                />
              </div>

              <div>
                <label
                  className={`block mb-2 text-[14px] font-medium capitalize ${
                    isDark ? "text-white" : "text-zinc-700"
                  }`}
                >
                  Parents Number
                </label>
                <input
                  type="tel"
                  name="parentsNumber"
                  value={formData.parentsNumber}
                  onChange={handleChange}
                  placeholder="Enter Parents Number"
                  className={inputCls}
                />
              </div>
            </div>

            {/* EMAIL */}
            <div>
              <label
                className={`block mb-2 text-[14px] font-medium capitalize ${
                  isDark ? "text-white" : "text-zinc-700"
                }`}
              >
                Email Address
              </label>
              <input
                type="email"
                name="emailAddress"
                value={formData.emailAddress}
                onChange={handleChange}
                placeholder="Enter Email address"
                className={inputCls}
              />
            </div>


            {/* SAVE BUTTON */}
            <div className="flex justify-center pt-3">
              <button
                onClick={handleSave}
                className={`${
                  isDark
                    ? "bg-white text-black hover:bg-gray-100"
                    : "bg-[#4F46E5] text-white hover:bg-[#4338CA]"
                } cursor-pointer rounded-md w-full sm:w-auto px-6 sm:px-20 py-2 text-sm font-medium transition-colors`}
              >
                Save
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

export default UpdateStudentDetails;
