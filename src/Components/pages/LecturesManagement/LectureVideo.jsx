import React, { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { X, Share2, Download, Play, Square, ChevronLeft, Pause, RotateCcw } from "lucide-react";
import axios from "axios";
import { BACKEND_API_URL, handleerror, handlesuccess } from "../../../utils/assets.js";

function LectureVideo({ theme, isDark, toggleTheme, sidebardata }) {
    const [isShareOpen, setIsShareOpen] = useState(false);
    const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
    const [shareClass, setShareClass] = useState("");
    const [lecturejson, setLecturejson] = useState("");
    const [showControls, setShowControls] = useState(true);
    const [isRecording, setIsRecording] = useState(false);
    const [recordedBlob, setRecordedBlob] = useState(null);
    const [mediaRecorder, setMediaRecorder] = useState(null);
    const autoUploadRef = useRef(false); // To track if upload should happen automatically
    const [viewportDimensions, setViewportDimensions] = useState({
        width: window.innerWidth,
        height: window.innerHeight,
        isPortrait: window.innerHeight > window.innerWidth
    });

    // Video Controls State
    const videoRef = useRef(null);

    const [isPlaying, setIsPlaying] = useState(false);

    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchLectureData = async () => {
            // If lecturejson is provided directly, use it
            if (location.state?.lecturejson) {
                setLecturejson(location.state.lecturejson);
                console.log("Lecture JSON from state:", location.state.lecturejson);
                return;
            }

            // If lectureId is provided but no lecturejson, fetch from API
            if (location.state?.lectureId) {
                try {
                    const token = localStorage.getItem("token");
                    const response = await axios.get(
                        `${BACKEND_API_URL}/lectures/${location.state.lectureId}/play`,
                        {
                            headers: {
                                Authorization: `Bearer ${token}`
                            }
                        }
                    );

                    if (response.data?.lecture_url) {
                        setLecturejson(response.data.lecture_url);
                        console.log("Lecture JSON from API:", response.data.lecture_url);
                    }
                } catch (error) {
                    console.error("Failed to fetch lecture data:", error);
                    setSpeechError("Failed to load lecture data");
                }
            }
        };

        fetchLectureData();
    }, [location.state?.lecturejson, location.state?.lectureId]);

    // Handle viewport resize and orientation changes
    useEffect(() => {
        const handleResize = () => {
            setViewportDimensions({
                width: window.innerWidth,
                height: window.innerHeight,
                isPortrait: window.innerHeight > window.innerWidth
            });
        };

        const handleOrientationChange = () => {
            setTimeout(handleResize, 100);
        };

        window.addEventListener('resize', handleResize);
        window.addEventListener('orientationchange', handleOrientationChange);

        handleResize();

        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('orientationchange', handleOrientationChange);
        };
    }, []);

    // Listen for messages from iframe (e.g. Lecture Ended)
    useEffect(() => {
        const handleMessage = (event) => {
            // Adjust condition based on actual message sent by iframe
            // Assuming "LectureCompleted" or similar
            if (event.data === "LectureCompleted" || event.data?.type === "LectureCompleted") {
                console.log("Lecture completed received");
                if (isRecording) {
                    autoUploadRef.current = true;
                    stopRecording();
                }
            }
        };

        window.addEventListener("message", handleMessage);
        return () => window.removeEventListener("message", handleMessage);
    }, [isRecording]);

    // Auto-hide controls after 3 seconds of inactivity
    useEffect(() => {
        // If recording, force hide controls and don't add listeners
        if (isRecording) {
            setShowControls(false);
            return;
        }

        // Listen for messages from iframe (e.g. Lecture Ended)


        let timeout;

        const resetTimeout = () => {
            setShowControls(true);
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                setShowControls(false);
            }, 3000);
        };

        const handleMouseMove = () => resetTimeout();
        const handleTouchStart = () => resetTimeout();

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('touchstart', handleTouchStart);

        // Initial timeout
        resetTimeout();

        return () => {
            clearTimeout(timeout);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('touchstart', handleTouchStart);
        };
    }, [isRecording]);

    // Handle Escape key to stop recording
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isRecording) {
                stopRecording();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isRecording, mediaRecorder]);

    // Hide cursor when recording
    useEffect(() => {
        let styleElement = null;

        if (isRecording) {
            // Create a style element to force cursor hidden on EVERYTHING
            styleElement = document.createElement('style');
            styleElement.textContent = `
                *, *::before, *::after {
                    cursor: none !important;
                }
            `;
            document.head.appendChild(styleElement);
        }

        // Cleanup function to remove style when recording stops
        return () => {
            if (styleElement) {
                document.head.removeChild(styleElement);
            }
        };
    }, [isRecording]);



    // Start recording - captures current tab/window
    const startRecording = async () => {
        try {

            // Get display media stream
            const stream = await navigator.mediaDevices.getDisplayMedia({
                video: {
                    displaySurface: 'browser',
                    cursor: 'always'
                },
                audio: true,
                preferCurrentTab: true
            });

            // Priority order for mimeTypes
            const mimeTypes = [
                "video/mp4",
                "video/webm;codecs=vp9",
                "video/webm"
            ];

            const mimeType = mimeTypes.find(type => MediaRecorder.isTypeSupported(type)) || "video/webm";

            const recorder = new MediaRecorder(stream, {
                mimeType,
                videoBitsPerSecond: 5000000 // 5 Mbps for high quality (perfect quality)
            });

            const chunks = [];

            recorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    chunks.push(event.data);
                }
            };

            recorder.onstop = () => {
                // Strip codecs from mimeType to ensure backend compatibility (e.g. "video/webm;codecs=vp9" -> "video/webm")
                const cleanMimeType = recorder.mimeType.split(';')[0];
                const blob = new Blob(chunks, { type: cleanMimeType });
                setRecordedBlob(blob);
                stream.getTracks().forEach(track => track.stop());
                setIsRecording(false);
                setIsPlaying(false); // Stop lecture playback when recording stops
                setShowControls(true); // Show controls when recording stops

                // Auto upload if triggered
                if (autoUploadRef.current) {
                    handleUpload(blob);
                    autoUploadRef.current = false;
                }
            };

            // Handle system "Stop sharing" button
            stream.getVideoTracks()[0].onended = () => {
                recorder.stop();
            };

            setShowControls(false); // Hide controls immediately before start
            setTimeout(() => {
                if (recorder.state === "inactive") recorder.start();
            }, 1500);
            setMediaRecorder(recorder);
            setIsRecording(true);
            setIsPlaying(true); // Start lecture playback when recording starts
            setIsRecordModalOpen(false); // Close modal after starting
        } catch (error) {
            console.error('Error starting recording:', error);
            setIsRecordModalOpen(false);
        }
    };

    // Stop screen recording
    const stopRecording = () => {
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
            setIsRecording(false);
            setIsPlaying(false); // Stop lecture playback when recording stops
            setShowControls(true); // Ensure controls come back
        }
    };





    const handlePlay = async () => {
        // If not recording, open modal to start/restart recording
        if (!isRecording) {
            setIsRecordModalOpen(true);
            return;
        }

        // Toggle video playback
        if (videoRef.current) {
            if (isPlaying) {
                if (typeof videoRef.current.pause === 'function') videoRef.current.pause();
            } else {
                if (typeof videoRef.current.play === 'function') videoRef.current.play().catch(() => { });
            }
        }
        setIsPlaying(!isPlaying);
    };

    const handleReset = () => {
        if (videoRef.current) {
            if (typeof videoRef.current.pause === 'function') {
                videoRef.current.pause();
            }
            if ('currentTime' in videoRef.current) {
                try { videoRef.current.currentTime = 0; } catch { }
            }
        }
        setIsPlaying(false);

        // Stop recording if active
        if (isRecording) {
            stopRecording();
        }

        // Clear recorded video
        if (recordedBlob) {
            URL.revokeObjectURL(URL.createObjectURL(recordedBlob)); // Clean up
            setRecordedBlob(null);
        }
    };

    // Upload recorded video
    const handleUpload = async (blobToUpload) => {
        const blob = blobToUpload || recordedBlob;
        if (!blob) return;

        // Get Lecture ID
        let lectureId = location.state?.lectureId;
        if (!lectureId && lecturejson) {
            const match = lecturejson.match(/(\d+)\.json$/);
            if (match) lectureId = match[1];
        }

        if (!lectureId) {
            handleerror("Lecture ID not found");
            return;
        }

        try {
            const token = localStorage.getItem("access_token") || localStorage.getItem("token");
            const formData = new FormData();

            // Determine extension based on blob type
            const extension = blob.type.split(';')[0].split('/')[1] || 'mp4';
            formData.append('file', blob, `lecture-${lectureId}-${Date.now()}.${extension}`);

            handlesuccess("Uploading recording...");

            const response = await axios.post(
                `${BACKEND_API_URL}/lectures/${lectureId}/share-recording`,
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data',
                    }
                }
            );

            if (response.data) {
                handlesuccess("Recording uploaded successfully!");
                // Clear blob after success
                setRecordedBlob(null);
            }
        } catch (error) {
            console.error("Error uploading recording:", error);
            handleerror("Failed to upload recording.");
        }
    };

    // Download recorded video (Commented out as per request)
    // const handleDownload = () => {
    //     if (recordedBlob) {
    //         const url = URL.createObjectURL(recordedBlob);
    //         const link = document.createElement('a');
    //         link.href = url;
    //         link.download = `lecture-${Date.now()}.mp4`;
    //         document.body.appendChild(link);
    //         link.click();
    //         document.body.removeChild(link);
    //         URL.revokeObjectURL(url);
    //     }
    // };

    // Check if upload should be enabled
    const isUploadEnabled = recordedBlob !== null;

    const handleShare = async () => {
        if (!shareClass.trim()) {
            alert("Please enter a class number");
            return;
        }

        let lectureId = location.state?.lectureId;
        if (!lectureId) {
            const lectureUrl = lecturejson || location.state?.lectureId;
            lectureId = lectureUrl.match(/(\d+)\.json$/)[1];
        }


        try {
            const token = localStorage.getItem("access_token") || localStorage.getItem("token");
            const response = await axios.post(
                `${BACKEND_API_URL}/lectures/${lectureId}/share`,
                { std: shareClass },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json"
                    }
                }
            );

            setIsShareOpen(false);
            setShareClass("");
            handlesuccess(response?.data?.message || "Lecture shared successfully!");
        } catch (error) {
            console.error("Error sharing lecture:", error);
            handleerror("Failed to share lecture. Please try again.");
        }
    };

    return (
        <div className={`relative w-screen h-screen overflow-hidden ${isDark ? "bg-black" : "bg-zinc-900"}`}>
            {/* Full-Screen Video Player */}
            <div className="absolute inset-0 w-full h-full">
                {lecturejson && (
                    <iframe
                        ref={videoRef}
                        src={`https://xlhyimcoyqyp.id.wasmer.app/?lectureId=${location.state?.lectureId ||
                            (lecturejson.match(/(\d+)\.json$/) ? lecturejson.match(/(\d+)\.json$/)[1] : '2')
                            }`}
                        className="w-full h-full"
                        allow="autoplay; fullscreen; picture-in-picture; microphone"
                        allowFullScreen
                        style={{ border: 'none' }}
                        title="Unreal Lecture Viewer"
                    />
                )}
            </div>

            {/* Floating Top Bar - Shows on hover/touch */}
            <div
                className={`absolute top-0 left-0 right-0 z-30 transition-all duration-300 ${showControls ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
                    }`}
            >
                <div className="bg-linear-to-b from-black/80 via-black/50 to-transparent px-4 sm:px-6 py-4 sm:py-6">
                    <div className="flex items-start justify-between gap-4">
                        {/* Left: Back button, Title and instructor */}
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                            <button
                                onClick={() => navigate(-1)}
                                className="shrink-0 p-2 rounded-full cursor-pointer bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-all duration-200 text-white"
                                aria-label="Go back"
                            >
                                <ChevronLeft size={20} />
                            </button>

                            <div className="flex-1 min-w-0">
                                <h1 className="text-white text-sm sm:text-base md:text-lg font-semibold truncate">
                                    Introduction TO Quantum Physics
                                </h1>
                                <p className="text-white/70 text-xs sm:text-sm mt-0.5 truncate">
                                    Dr Evelyn Reed
                                </p>
                            </div>
                        </div>

                        {/* Right: Download and Share buttons */}
                        <div className="shrink-0 flex items-center gap-2">
                            {/* Download Button - Only enabled after recording */}
                            {/* Upload Button - Replacing Download */}
                            <button
                                onClick={() => handleUpload()}
                                disabled={!isUploadEnabled}
                                className={`inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full backdrop-blur-sm transition-all duration-200 text-xs sm:text-sm font-medium ${isUploadEnabled
                                    ? 'bg-white/10 hover:bg-white/20 text-white cursor-pointer'
                                    : 'bg-white/5 text-white/30 cursor-not-allowed'
                                    }`}
                                aria-label="Upload recording"
                                title={!isUploadEnabled ? "Start recording first to enable upload" : "Upload recorded lecture"}
                            >
                                <Share2 size={16} /> {/* Using Share icon for upload/share */}
                                <span className="hidden sm:inline">Upload</span>
                            </button>

                            {/* Share Button */}
                            {/* <button
                                onClick={() => setIsShareOpen(true)}
                                className="inline-flex cursor-pointer items-center gap-2 px-3 sm:px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-all duration-200 text-white text-xs sm:text-sm font-medium"
                            >
                                <Share2 size={16} />
                                <span className="hidden sm:inline">Share</span>
                            </button> */}
                        </div>
                    </div>
                </div>
            </div>

            {/* Recording Indicator - Bottom Left - Only show if controls are shown */}
            {isRecording && showControls && (
                <div className="absolute bottom-6 left-6 z-30 flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/90 backdrop-blur-sm">
                    <div className="w-3 h-3 rounded-full bg-white animate-pulse" />
                    <span className="text-white text-sm font-medium">Recording...</span>
                </div>
            )}

            {/* Controls overlay */}
            <div className={`absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center justify-center gap-6 z-30 transition-all duration-300 ${showControls ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}>
                <button
                    onClick={handlePlay}
                    className={`p-4 cursor-pointer rounded-full border-2 border-cyan-500 bg-cyan-500/10 text-cyan-400 hover:shadow-lg hover:shadow-cyan-500/50 transition-all duration-300`}
                    title={isPlaying ? "Pause" : "Play"}
                >
                    {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                </button>

                {/* Stop Recording Button */}
                {isRecording && (
                    <button
                        onClick={stopRecording}
                        className="p-4 cursor-pointer rounded-full border-2 border-red-500 bg-red-500/20 text-red-400 hover:shadow-lg hover:shadow-red-500/50 transition-all duration-300"
                        title="Stop Recording"
                    >
                        <Square className="w-6 h-6 fill-current" />
                    </button>
                )}

                {/* <button
                    onClick={handleReset}
                    className="p-4 cursor-pointer rounded-full border-2 border-cyan-500 bg-cyan-500/10 text-cyan-400 hover:shadow-lg hover:shadow-cyan-500/50 transition-all duration-300"
                    title="Reset"
                >
                    <RotateCcw className="w-6 h-6" />
                </button> */}
            </div>

            {/* Bottom Gradient Overlay */}
            <div
                className={`absolute bottom-0 left-0 right-0 h-24 bg-linear-to-t from-black/60 to-transparent pointer-events-none z-20 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'
                    }`}
            />

            {/* Custom Recording Confirmation Modal */}
            {
                isRecordModalOpen && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/70 backdrop-blur-sm"
                        onClick={() => setIsRecordModalOpen(false)}
                    >
                        <div
                            className={`${isDark ? 'bg-zinc-900 text-white' : 'bg-white text-zinc-900'
                                } w-full max-w-md rounded-2xl shadow-2xl border ${isDark ? 'border-zinc-800' : 'border-zinc-200'
                                } px-6 py-6 transform transition-all`}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="text-center mb-6">
                                <div className="mx-auto w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
                                    <Play size={32} className="text-green-500" fill="currentColor" />
                                </div>
                                <h3 className="text-lg md:text-xl font-semibold mb-2">
                                    {recordedBlob ? "Start New Recording?" : "Start Recording Lecture?"}
                                </h3>
                                <p className={`text-sm ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                                    {recordedBlob ? "Starting a new recording will discard the previous one." : "This will record the current lecture screen"}
                                </p>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsRecordModalOpen(false)}
                                    className={`flex-1 cursor-pointer px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${isDark
                                        ? 'bg-zinc-800 text-white hover:bg-zinc-700'
                                        : 'bg-zinc-100 text-zinc-900 hover:bg-zinc-200'
                                        }`}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={startRecording}
                                    className="flex-1 cursor-pointer inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-green-500 text-white hover:bg-green-600 transition-colors"
                                >
                                    <Play size={16} fill="white" />
                                    <span>Start</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Share Modal */}
            {
                isShareOpen && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/70 backdrop-blur-sm"
                        onClick={() => setIsShareOpen(false)}
                    >
                        <div
                            className={`${isDark ? 'bg-zinc-900 text-white' : 'bg-white text-zinc-900'
                                } w-full max-w-md rounded-2xl shadow-2xl border ${isDark ? 'border-zinc-800' : 'border-zinc-200'
                                } px-6 py-6 transform transition-all`}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-start justify-between mb-5">
                                <div>
                                    <h3 className="text-base md:text-lg font-semibold">
                                        Share With Student
                                    </h3>
                                    <p className={`text-xs mt-1 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                                        Enter class number to share this lecture
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsShareOpen(false)}
                                    className={`shrink-0 cursor-pointer p-1.5 rounded-full transition-colors ${isDark ? 'hover:bg-zinc-800' : 'hover:bg-zinc-100'
                                        }`}
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className={`block text-xs font-medium mb-2 ${isDark ? 'text-zinc-300' : 'text-zinc-700'
                                        }`}>
                                        Class Number
                                    </label>
                                    <input
                                        type="text"
                                        value={shareClass}
                                        onChange={(e) => setShareClass(e.target.value)}
                                        placeholder="e.g., Class 10-A"
                                        className={`w-full rounded-lg px-4 py-2.5 text-sm outline-none border-2 transition-colors ${isDark
                                            ? 'bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-zinc-500'
                                            : 'bg-zinc-50 border-zinc-300 text-zinc-900 placeholder:text-zinc-400 focus:border-[#696CFF]'
                                            }`}
                                        autoFocus
                                    />
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setIsShareOpen(false)}
                                        className={`flex-1 cursor-pointer px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${isDark
                                            ? 'bg-zinc-800 text-white hover:bg-zinc-700'
                                            : 'bg-zinc-100 text-zinc-900 hover:bg-zinc-200'
                                            }`}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleShare}
                                        className={`flex-1 cursor-pointer inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${isDark
                                            ? 'bg-white text-zinc-900 hover:bg-zinc-100'
                                            : 'bg-[#696CFF] text-white hover:bg-[#5a5de6]'
                                            }`}
                                    >
                                        <Share2 size={16} />
                                        <span>Share Now</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}

export default LectureVideo;