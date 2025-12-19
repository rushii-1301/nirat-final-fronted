import React, { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { X, Share2, Download, Play, Square, ChevronLeft, Pause, RotateCcw, Mic, MicOff, MessageCircle, Send, SendHorizontal } from "lucide-react";
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
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [isLectureReady, setIsLectureReady] = useState(false); // Track if first slide is loaded

    // Mic / Speech Recognition State
    const [micStatus, setMicStatus] = useState('idle'); // 'idle', 'listening', 'denied'
    const recognitionRef = useRef(null);

    // Chat State
    const [currentMessage, setCurrentMessage] = useState("");
    const [messages, setMessages] = useState([
        { id: 1, text: "Hi, Welcome To Class", sender: "system" },
        { id: 2, text: "I Hope You Are Enjoy", sender: "system" }
    ]);

    const chatContainerRef = useRef(null);

    // Auto-scroll to bottom of chat
    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages, isChatOpen]);

    const handleSendMessage = (textOverride) => {
        const textToSend = textOverride || currentMessage;
        if (!textToSend.trim()) return;

        // Add user message
        const newUserMessage = {
            id: Date.now(),
            text: textToSend,
            sender: "user"
        };
        setMessages(prev => [...prev, newUserMessage]);
        setCurrentMessage("");

        // Simulate chatbot API call
        // In production, this would be your axios.post to /chatbot
        setTimeout(() => {
            const botResponseText = "Yes, certainly! I can explain that further. The process involves multiple steps...";
            const botResponse = {
                id: Date.now() + 1,
                text: botResponseText,
                sender: "system"
            };
            setMessages(prev => [...prev, botResponse]);

            // Sync with Iframe recording
            if (videoRef.current && videoRef.current.contentWindow) {
                videoRef.current.contentWindow.postMessage({
                    type: 'CMD_CHAT_REPLY',
                    text: botResponseText
                }, '*');
            } else {
                // Fallback: Browser TTS if iframe is gone
                const utterance = new SpeechSynthesisUtterance(botResponseText);
                window.speechSynthesis.speak(utterance);
            }
        }, 800);
    };

    const location = useLocation();
    const navigate = useNavigate();

    const [isLoading, setIsLoading] = useState(true);
    const [pageError, setPageError] = useState(null);

    useEffect(() => {
        const fetchLectureData = async () => {
            setIsLoading(true);
            setPageError(null);

            // If lecturejson is provided directly, use it
            if (location.state?.lecturejson) {
                setLecturejson(location.state.lecturejson);
                console.log("Lecture JSON from state:", location.state.lecturejson);
                setIsLoading(false);
                return;
            }

            // If lectureId is provided but no lecturejson, fetch from API
            let lectureId = location.state?.lectureId || new URLSearchParams(window.location.search).get('lectureId');

            if (lectureId) {
                try {
                    let token = null;
                    try {
                        token = localStorage.getItem("access_token") || localStorage.getItem("token");
                    } catch (e) {
                        console.error("LocalStorage access error:", e);
                    }

                    const response = await axios.get(
                        `${BACKEND_API_URL}/lectures/${lectureId}/play`,
                        {
                            headers: {
                                Authorization: token ? `Bearer ${token}` : ""
                            }
                        }
                    );

                    if (response.data?.lecture_url) {
                        setLecturejson(response.data.lecture_url);
                        console.log("Lecture JSON from API:", response.data.lecture_url);
                    } else {
                        setPageError("Lecture content not found");
                    }
                } catch (error) {
                    console.error("Failed to fetch lecture data:", error);
                    setPageError("Failed to load lecture data. Please check your connection.");
                    setSpeechError("Failed to load lecture data");
                } finally {
                    setIsLoading(false);
                }
            } else {
                setPageError("Missing Lecture Information");
                setIsLoading(false);
            }
        };

        fetchLectureData();
    }, [location.state?.lecturejson, location.state?.lectureId]);

    // Initialize Mic Permission on Load
    useEffect(() => {
        if (typeof navigator !== 'undefined' && navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function') {
            navigator.mediaDevices.getUserMedia({ audio: true })
                .then(stream => {
                    // Permission granted
                    stream.getTracks().forEach(track => track.stop()); // Stop immediately, just checking
                    setMicStatus('idle');
                })
                .catch(err => {
                    console.warn("Mic permission denied or error:", err);
                    setMicStatus('denied');
                });
        } else {
            console.warn("MediaDevices API not supported in this browser");
            setMicStatus('denied');
        }

        return () => {
            if (recognitionRef.current) {
                try {
                    recognitionRef.current.abort();
                } catch (e) {
                    console.error("Error aborting recognition:", e);
                }
            }
        };
    }, []);

    // Handle Speech Recognition
    const startRecognition = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

        if (!SpeechRecognition) {
            alert("Speech recognition is not supported in this browser.");
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
            setMicStatus('listening');
        };

        recognition.onresult = (event) => {
            const transcript = Array.from(event.results)
                .map(result => result[0])
                .map(result => result.transcript)
                .join('');

            setCurrentMessage(transcript);
        };

        recognition.onerror = (event) => {
            console.error("Speech recognition error", event.error);
            if (event.error === 'not-allowed') {
                setMicStatus('denied');
            } else {
                setMicStatus('idle');
            }
        };

        recognition.onend = () => {
            // Only reset to idle if we weren't explicitly stopped/denied during session
            setMicStatus(prev => prev === 'denied' ? 'denied' : 'idle');
        };

        recognitionRef.current = recognition;
        recognition.start();
    };

    const handleMicClick = () => {
        if (micStatus === 'denied') {
            // Try requesting permission again
            navigator.mediaDevices.getUserMedia({ audio: true })
                .then(stream => {
                    stream.getTracks().forEach(track => track.stop());
                    setMicStatus('idle');
                    // Optionally start immediately after granting
                    startRecognition();
                })
                .catch(err => {
                    console.warn("Permission still denied:", err);
                    alert("Microphone permission is required. Please enable it in your browser settings.");
                });
            return;
        }

        if (micStatus === 'listening') {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
        } else {
            startRecognition();
        }
    };

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

    // Hide cursor when recording - DISABLED to fix UI interaction issues
    /* 
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

        return () => {
            if (styleElement) {
                document.head.removeChild(styleElement);
            }
        };
    }, [isRecording]); 
    */



    // --- Iframe Communication & Recording Sync ---
    const [iframeState, setIframeState] = useState('IDLE');

    useEffect(() => {
        const handleMessage = (event) => {
            const { type, state, blob, response, extension, codec, size, oldState, slideIndex } = event.data;
            console.log("React received from Iframe:", type || event.data);

            switch (type || event.data) {
                case 'EVT_READY':
                    setIsLoading(false);
                    setIsLectureReady(true); // Enable play button
                    console.log('✅ Lecture ready - first slide loaded');
                    break;
                case 'EVT_SYNC_STATE':
                    setIframeState(state);
                    // Update playing state - consider CHAT_MODE as paused
                    setIsPlaying(state === 'PLAYING');

                    // Auto-open chat when entering CHAT_MODE
                    if (state === 'CHAT_MODE') {
                        setIsChatOpen(true);
                    }

                    // Log detailed state info
                    console.log(`📊 State: ${oldState || '?'} → ${state} | Slide: ${slideIndex || '?'}`);
                    break;
                case 'EVT_VOICE_TRIGGER':
                    if (response === 'YES') {
                        setIsChatOpen(true);
                        handlesuccess("Opening Chatbot...");
                        // Optionally auto-open mic for chat or wait for user
                    }
                    break;
                case 'RECORDING_DATA':
                    console.log(`🎥 Recording received: ${codec || 'Unknown codec'}, ${(size / 1024 / 1024).toFixed(2)} MB`);
                    // Store blob with metadata for proper download
                    const blobWithMeta = blob;
                    blobWithMeta._extension = extension || 'webm';
                    blobWithMeta._codec = codec || 'Unknown';
                    setRecordedBlob(blobWithMeta);
                    setIsRecording(false);
                    handlesuccess(`Recording complete! (${codec || 'Unknown codec'})`);
                    break;
                case 'EVT_LECTURE_COMPLETED':
                    handlesuccess("Lecture Completed!");
                    setIsPlaying(false);
                    setIsRecording(false);
                    break;
            }
        };

        window.addEventListener("message", handleMessage);
        return () => window.removeEventListener("message", handleMessage);
    }, []);

    // Start recording - sends message to iframe
    const startRecording = () => {
        if (videoRef.current && videoRef.current.contentWindow) {
            videoRef.current.contentWindow.postMessage({ type: 'CMD_START' }, '*');
            setIsRecording(true);
            setIsPlaying(true);
            setIsRecordModalOpen(false);
        }
    };

    // Stop recording - sends message to iframe
    const stopRecording = () => {
        if (videoRef.current && videoRef.current.contentWindow) {
            videoRef.current.contentWindow.postMessage({ type: 'CMD_STOP' }, '*');
            setIsRecording(false);
            setIsPlaying(false);
        }
    };

    const handlePlay = () => {
        // Don't allow play if lecture not ready
        if (!isLectureReady) {
            console.log('⏳ Waiting for lecture to load...');
            return;
        }

        if (!isRecording) {
            setIsRecordModalOpen(true);
            return;
        }

        if (isPlaying) {
            videoRef.current?.contentWindow.postMessage({ type: 'CMD_PAUSE' }, '*');
        } else {
            // Close chat when resuming
            if (isChatOpen) {
                setIsChatOpen(false);
            }
            videoRef.current?.contentWindow.postMessage({ type: 'CMD_RESUME' }, '*');
        }
    };

    const handleReset = () => {
        videoRef.current?.contentWindow.postMessage({ type: 'CMD_STOP' }, '*');
        setIsPlaying(false);
        setIsRecording(false);
        setRecordedBlob(null);
    };







    // Download recorded video (Replaces Upload functionality)
    const handleDownload = (blobToUse) => {
        const blob = blobToUse || recordedBlob;
        if (!blob) return;

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;

        // Generate filename using metadata if available
        const lectureId = location.state?.lectureId || 'video';
        const extension = blob._extension || blob.type.split(';')[0].split('/')[1] || 'webm';
        const codec = blob._codec || 'Unknown';

        link.download = `lecture-${lectureId}-${Date.now()}.${extension}`;

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        console.log(`📥 Downloaded: ${link.download} (${codec})`);
        handlesuccess(`Downloading recording... (${codec})`);
    };

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
        <div
            style={{ backgroundColor: isDark ? 'black' : '#18181b' }}
            className={`fixed inset-0 w-full h-dvh min-h-screen overflow-hidden ${isDark ? "bg-black" : "bg-zinc-900"}`}
        >
            {/* Full-Screen Video Player */}
            <div className="absolute inset-0 w-full h-full bg-black flex items-center justify-center">
                {isLoading ? (
                    <div className="flex flex-col items-center gap-4 text-white">
                        <div className="w-10 h-10 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
                        <p className="text-sm font-medium animate-pulse">Loading Lecture...</p>
                    </div>
                ) : pageError ? (
                    <div className="flex flex-col items-center gap-4 px-6 text-center">
                        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 mb-2">
                            <RotateCcw size={32} />
                        </div>
                        <p className="text-white text-lg font-semibold">{pageError}</p>
                        <button
                            onClick={() => window.location.reload()}
                            className="px-6 py-2 bg-white text-black rounded-full font-bold hover:bg-gray-200 transition-colors"
                        >
                            Retry
                        </button>
                        <button
                            onClick={() => navigate(-1)}
                            className="text-white/60 hover:text-white transition-colors"
                        >
                            Go Back
                        </button>
                    </div>
                ) : lecturejson && (
                    <iframe
                        ref={videoRef}
                        // src={`https://mzhyi8c6omxn.id.wasmer.app/?lectureId=${location.state?.lectureId ||
                        src={`/Templates/index.html?lectureId=${location.state?.lectureId ||
                            ((lecturejson && typeof lecturejson === 'string' && lecturejson.match(/(\d+)\.json$/)) ? lecturejson.match(/(\d+)\.json$/)[1] : '2')
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
                                <h1 className="text-white text-sm sm:text-base md:text-lg font-semibold truncate capitalize">
                                    {location.state?.title || "Untitled"}
                                </h1>
                                <p className="text-white/70 text-xs sm:text-sm mt-0.5 truncate capitalize">
                                    {location.state?.subject || ""}
                                </p>
                            </div>
                        </div>

                        {/* Right: Download and Share buttons */}
                        <div className="shrink-0 flex items-center gap-2">
                            {/* Download Button - Only enabled after recording */}
                            {/* Upload Button - Replacing Download */}
                            <button
                                onClick={() => handleDownload()}
                                disabled={!isUploadEnabled}
                                className={`inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full backdrop-blur-sm transition-all duration-200 text-xs sm:text-sm font-medium ${isUploadEnabled
                                    ? 'bg-white/10 hover:bg-white/20 text-white cursor-pointer'
                                    : 'bg-white/5 text-white/30 cursor-not-allowed'
                                    }`}
                                aria-label="Download recording"
                                title={!isUploadEnabled ? "Start recording first to enable download" : "Download recorded lecture"}
                            >
                                <Download size={16} /> {/* Using Download icon */}
                                <span className="hidden sm:inline">Download</span>
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

            {/* Controls overlay - 3 Buttons (Play, Mic, Chat) */}
            <div className={`absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center justify-center gap-6 z-50 transition-all duration-300 ${showControls ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}>

                {/* Play/Pause Button */}
                <button
                    onClick={handlePlay}
                    disabled={!isLectureReady && !isRecording}
                    className={`w-16 h-16 flex items-center justify-center rounded-full backdrop-blur-md transition-all duration-200 border border-white/10 group pointer-events-auto
                        ${!isLectureReady && !isRecording
                            ? 'bg-white/10 cursor-not-allowed opacity-50'
                            : 'bg-white/20 hover:bg-white/30 cursor-pointer'}`}
                    title={!isLectureReady && !isRecording ? 'Loading lecture...' : isPlaying ? 'Pause' : 'Play'}
                >
                    <div className="w-12 h-12 rounded-full border-2 border-white flex items-center justify-center">
                        {isPlaying ? <Pause className="w-6 h-6 text-white fill-white" /> : <Play className="w-6 h-6 text-white fill-white ml-1" />}
                    </div>
                </button>

                {/* Mic Button */}
                <button
                    onClick={handleMicClick}
                    className={`w-16 h-16 flex items-center justify-center rounded-full backdrop-blur-md transition-all duration-200 border border-white/10 cursor-pointer group 
                        ${micStatus === 'listening' ? 'bg-red-500 hover:bg-red-600 animate-pulse' :
                            micStatus === 'denied' ? 'bg-zinc-800/80 hover:bg-zinc-800 border-zinc-600' :
                                'bg-white/20 hover:bg-white/30'}`}
                    title={micStatus === 'denied' ? "Permission Denied (Click to retry)" : micStatus === 'listening' ? "Stop Listening" : "Start Voice Input"}
                >
                    <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center 
                        ${micStatus === 'listening' ? 'border-white' :
                            micStatus === 'denied' ? 'border-zinc-500' :
                                'border-white'}`}>
                        {micStatus === 'denied' ? (
                            <MicOff className="w-6 h-6 text-zinc-400" />
                        ) : (
                            <Mic className={`w-6 h-6 ${micStatus === 'listening' ? 'text-white' : 'text-white'}`} />
                        )}
                    </div>
                </button>

                {/* Chat Button */}
                <button
                    onClick={() => {
                        if (isChatOpen) {
                            // Closing chat - resume lecture
                            setIsChatOpen(false);
                            if (videoRef.current?.contentWindow) {
                                videoRef.current.contentWindow.postMessage({ type: 'CMD_RESUME' }, '*');
                                console.log('📤 Sent CMD_RESUME (closing chat)');
                            }
                        } else {
                            // Opening chat - pause lecture and enter chat mode
                            setIsChatOpen(true);
                            if (videoRef.current?.contentWindow) {
                                videoRef.current.contentWindow.postMessage({ type: 'CMD_ENTER_CHAT' }, '*');
                                console.log('📤 Sent CMD_ENTER_CHAT (opening chat)');
                            }
                        }
                    }}
                    className={`w-16 h-16 flex items-center justify-center rounded-full backdrop-blur-md transition-all duration-200 border border-white/10 cursor-pointer group ${isChatOpen ? 'bg-white' : 'bg-white/20 hover:bg-white/30'}`}
                >
                    <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center ${isChatOpen ? 'border-black' : 'border-white'}`}>
                        <MessageCircle className={`w-6 h-6 ${isChatOpen ? 'text-black' : 'text-white'}`} />
                    </div>
                </button>

                {/* Stop Recording Button (Only visible when recording) - Kept small/separate if needed, or integrate? 
                    User asked for 3 icons. I will keep Stop Recording as a separate specialized button slightly offset if needed, 
                    OR assume Play/Pause handles flow. But 'stopRecording' is distinct. 
                    Let's keep the original "Stop" button visible if recording, but maybe styled to match?
                    For now, I'll place it to the side if recording is active, to not break the 3-icon symmetry. 
                 */}
                {isRecording && (
                    <button
                        onClick={stopRecording}
                        className="absolute -right-24 w-12 h-12 flex items-center justify-center rounded-full bg-red-500/80 hover:bg-red-600 backdrop-blur-md border border-red-400 cursor-pointer transition-all"
                        title="Stop Recording"
                    >
                        <Square className="w-5 h-5 fill-white text-white" />
                    </button>
                )}
            </div>

            {/* Chatbot Interface */}
            {isChatOpen && (
                <div className={`absolute right-6 bottom-6 w-80 rounded-3xl border shadow-2xl overflow-hidden flex flex-col z-50 pointer-events-auto animate-in slide-in-from-bottom-5 fade-in duration-300 ${isDark ? "bg-black border-zinc-800" : "bg-white border-zinc-200"
                    }`}>
                    <div ref={chatContainerRef} className="p-4 space-y-4 max-h-96 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none'] flex-1">
                        {messages.map((msg) => (
                            <div key={msg.id} className={`flex items-end gap-3 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
                                {msg.sender === 'system' && (
                                    <div className={`shrink-0 p-2 rounded-full ${isDark ? "bg-zinc-700" : "bg-zinc-300"}`}></div>
                                )}

                                <div className={`px-4 py-2 text-sm max-w-[80%] ${msg.sender === 'system'
                                    ? `border rounded-2xl rounded-bl-none ${isDark ? "bg-zinc-900 border-zinc-800 text-white" : "bg-zinc-100 border-zinc-200 text-zinc-800"}`
                                    : `rounded-2xl rounded-br-none font-medium ${isDark ? "bg-white text-black" : "bg-black text-white"}`
                                    }`}>
                                    {msg.text}
                                </div>

                                {msg.sender === 'user' && (
                                    <div className={`w-8 h-8 rounded-full shrink-0 ${isDark ? "bg-zinc-200" : "bg-zinc-400"}`}></div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Input */}
                    <div className={`p-3 border-t relative ${isDark ? "bg-black border-zinc-800" : "bg-white border-zinc-200"
                        }`}>
                        <div className="relative flex items-center">
                            <input
                                type="text"
                                value={currentMessage}
                                onChange={(e) => setCurrentMessage(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                placeholder="send your message..."
                                className={`w-full pl-4 pr-12 py-3 rounded-full text-sm outline-none border transition-colors ${isDark
                                    ? "bg-zinc-900 text-white border-zinc-800 focus:border-zinc-700 placeholder:text-zinc-500"
                                    : "bg-zinc-100 text-zinc-900 border-zinc-200 focus:border-zinc-300 placeholder:text-zinc-400"
                                    }`}
                            />
                            <button
                                onClick={handleSendMessage}
                                className={`absolute right-1.5 w-9 h-9 rounded-full flex items-center justify-center transition-transform active:scale-95 cursor-pointer border ${isDark
                                    ? "bg-black border-zinc-700 text-white hover:bg-zinc-900"
                                    : "bg-white border-zinc-300 text-black hover:bg-zinc-50"
                                    }`}
                            >
                                <SendHorizontal size={16} className="ml-0.5" fill="none" />
                            </button>
                        </div>
                    </div>
                </div>
            )
            }

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