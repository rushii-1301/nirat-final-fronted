import React, { useEffect, useState, useRef, useCallback } from "react";
import { io } from "socket.io-client";
import { useLocation, useNavigate } from "react-router-dom";
import { X, ChevronLeft, Pause, Play, MessageCircle, Mic, MicOff, SendHorizontal, Download } from "lucide-react";
import axios from "axios";
import html2canvas from "html2canvas";
import { BACKEND_API_URL, handleerror, handlesuccess } from "../../../utils/assets.js";
// import Avatar from "./components/Avatar";
import Chatbot from "./components/Chatbot";
import QuestionPopup from "./components/QuestionPopup";
import AudioManager from "./components/AudioManager";
import TypingEffect from "./components/TypingEffect";

// ✅ FIX 1: Move Local Image Loading OUTSIDE the component
const localSlideImages = import.meta.glob('../../../assets/Slide*.*', { eager: true });
const localImagesMap = {};

Object.keys(localSlideImages).forEach(path => {
    const match = path.match(/Slide(\d+)\./i);
    if (match && match[1]) {
        const index = parseInt(match[1], 10);
        localImagesMap[index] = localSlideImages[path].default;
    }
});

// STATE MACHINE
const STATES = {
    IDLE: 'IDLE',
    SLIDE_PLAYING: 'SLIDE_PLAYING',
    SLIDE_PAUSED: 'SLIDE_PAUSED',
    QUESTION_WAIT: 'QUESTION_WAIT',
    CHATBOT_ACTIVE: 'CHATBOT_ACTIVE',
    RECORDING_ACTIVE: 'RECORDING_ACTIVE'
};

function LectureVideo({ theme, isDark }) {
    const location = useLocation();
    const navigate = useNavigate();

    // State Management
    const [currentState, setCurrentState] = useState(STATES.IDLE);
    const [lectureData, setLectureData] = useState([]);
    const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [pageError, setPageError] = useState(null);
    const [lectureId, setLectureId] = useState(null);

    // Audio State
    const [audioContext, setAudioContext] = useState(null);
    const [analyserNode, setAnalyserNode] = useState(null);
    const [currentAudioSource, setCurrentAudioSource] = useState(null);
    const [playbackProgress, setPlaybackProgress] = useState(0);
    const [slideDuration, setSlideDuration] = useState(0);
    const progressFrameRef = useRef(null);
    const audioManagerRef = useRef(null);

    // Video Ref
    const videoRef = useRef(null);

    // Chat State
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [messages, setMessages] = useState([{ id: 1, text: "Hi, Welcome To Class", sender: "system" }]);
    const socketRef = useRef(null);

    // Recording State
    const [isRecording, setIsRecording] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [recordedBlob, setRecordedBlob] = useState(null);
    const mediaRecorderRef = useRef(null);
    const recordedChunksRef = useRef([]);
    const canvasStreamRef = useRef(null);
    const recordingCanvasRef = useRef(null);
    const recordingContextRef = useRef(null);
    const animationFrameIdRef = useRef(null);
    const contentDivRef = useRef(null);

    // Question Popup State
    const [isQuestionPopupOpen, setIsQuestionPopupOpen] = useState(false);
    const popupTimeoutRef = useRef(null);

    // Initialize Audio Context
    useEffect(() => {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        setAudioContext(ctx);
        setAnalyserNode(analyser);

        return () => {
            if (ctx.state !== 'closed') {
                ctx.close();
            }
            if (popupTimeoutRef.current) clearTimeout(popupTimeoutRef.current);
        };
    }, []);

    // Get lectureId from URL params or location.state
    useEffect(() => {
        // Priority: URL params (for new tab) > location.state (for same page navigation)
        const urlParams = new URLSearchParams(window.location.search);
        const idFromUrl = urlParams.get('lectureId');
        const idFromState = location.state?.lectureId;

        const resolvedId = idFromUrl || idFromState;
        setLectureId(resolvedId);
    }, [location.state?.lectureId]);

    // Fetch Lecture Data
    useEffect(() => {
        const fetchLectureData = async () => {
            if (!lectureId) {
                setPageError("Missing Lecture Information");
                setIsLoading(false);
                return;
            }

            setIsLoading(true);

            try {
                const token = localStorage.getItem("access_token") || localStorage.getItem("token");
                const response = await axios.get(`${BACKEND_API_URL}/lectures/${lectureId}/play`, {
                    headers: { Authorization: token ? `Bearer ${token}` : "" }
                });

                if (response.data?.lecture_url) {
                    const detailUrl = BACKEND_API_URL + response.data.lecture_url;
                    const detailRes = await axios.get(detailUrl);
                    const slides = (detailRes.data.slides || []).map((slide, index) => ({
                        audio_url: BACKEND_API_URL + slide.audio_url,
                        title: slide.title || "",
                        bullets: slide.bullets || [],
                        subnarrations: slide.subnarrations || [],
                        narration: slide.narration || "",
                        question: slide.question || "",
                        content_url: slide.content_url || slide.visual_url || slide.image_url || "",
                        video_url: slide.video_url || "",
                        isLastSlide: index === (detailRes.data.slides || []).length - 1
                    }));

                    setLectureData(slides);
                    setCurrentState(STATES.IDLE);
                } else {
                    setPageError("Lecture content not found");
                }
            } catch (error) {
                console.error("Failed to fetch lecture data:", error);
                setPageError("Failed to load lecture data");
            } finally {
                setIsLoading(false);
            }
        };

        if (lectureId) {
            fetchLectureData();
        }
    }, [lectureId]);

    // Progress Tracking Loop
    useEffect(() => {
        let animationFrameId;

        const animateProgress = () => {
            if (currentState === STATES.SLIDE_PLAYING && slideDuration > 0 && audioManagerRef.current && lectureData[currentSlideIndex]) {
                const elapsed = audioManagerRef.current.getSlideElapsed();

                const slide = lectureData[currentSlideIndex];
                const titleLen = slide.title?.length || 0;
                const bulletsLen = slide.bullets.reduce((acc, b) => acc + b.length, 0);
                const narrationLen = slide.narration?.length || 0;
                const totalChars = titleLen + bulletsLen + narrationLen;

                const typingDuration = Math.max(2, totalChars * 0.04);
                const prog = Math.min(elapsed / typingDuration, 1);
                setPlaybackProgress(prog);

                if (elapsed < slideDuration) {
                    animationFrameId = requestAnimationFrame(animateProgress);
                } else {
                    setPlaybackProgress(1);
                }
            }
        };

        if (currentState === STATES.SLIDE_PLAYING && slideDuration > 0) {
            animationFrameId = requestAnimationFrame(animateProgress);
        }

        return () => {
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
        };
    }, [currentState, slideDuration, currentSlideIndex, lectureData]);

    // Socket.IO Setup
    useEffect(() => {
        const token = localStorage.getItem("access_token") || localStorage.getItem("token");
        if (!token) return;

        socketRef.current = io(`${BACKEND_API_URL}/lecture-player`, {
            transports: ["websocket"],
            auth: { token }
        });

        socketRef.current.on("lecture:reply", (data) => {
            const botResponse = {
                id: Date.now(),
                text: data.answer || data.display_text || data.message || "Received response",
                sender: "system",
                audio_url: data.audio_url
            };
            setMessages(prev => [...prev, botResponse]);

            if (data.audio_url && audioManagerRef.current) {
                audioManagerRef.current.playChatbotAudio(data.audio_url);
            }
        });

        return () => {
            if (socketRef.current) socketRef.current.disconnect();
        };
    }, []);

    // Pause Recording
    const pauseRecording = useCallback(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.pause();
            setIsPaused(true);
            if (animationFrameIdRef.current) {
                cancelAnimationFrame(animationFrameIdRef.current);
            }
        }
    }, []);

    // Resume Recording
    const resumeRecording = useCallback(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
            mediaRecorderRef.current.resume();
            setIsPaused(false);
            captureFrame();
        }
    }, []);

    // Stop Recording
    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            setIsPaused(false);
            if (animationFrameIdRef.current) {
                cancelAnimationFrame(animationFrameIdRef.current);
            }
        }
    }, []);

    // Play Slide
    const playSlide = useCallback(async (index) => {
        if (!lectureData[index] || !audioContext) return;

        if (popupTimeoutRef.current) {
            clearTimeout(popupTimeoutRef.current);
            popupTimeoutRef.current = null;
        }
        setIsQuestionPopupOpen(false);

        setCurrentSlideIndex(index);
        setCurrentState(STATES.SLIDE_PLAYING);
        setPlaybackProgress(0);
        setSlideDuration(0);

        // Resume recording if it was paused
        if (isRecording && isPaused) {
            resumeRecording();
        }

        const slide = lectureData[index];
        if (audioManagerRef.current) {
            const { duration } = await audioManagerRef.current.playSlideAudio(slide.audio_url, () => {
                if (progressFrameRef.current) cancelAnimationFrame(progressFrameRef.current);
                setPlaybackProgress(1);

                if (!slide.isLastSlide) {
                    setCurrentState(STATES.QUESTION_WAIT);
                    popupTimeoutRef.current = setTimeout(() => {
                        setIsQuestionPopupOpen(true);
                    }, 1500);
                } else {
                    setCurrentState(STATES.IDLE);
                    if (isRecording) stopRecording();
                }
            }) || { duration: 0 };

            setSlideDuration(duration || 0);
        }
    }, [lectureData, audioContext, isRecording, isPaused, stopRecording, resumeRecording, currentState]);

    // ---------------------------------------------------------
    // ✅ MAIN LOGIC UPDATE: Handle Question Response with Text
    // ---------------------------------------------------------
    const handleQuestionResponse = useCallback((response) => {
        setIsQuestionPopupOpen(false);

        // Agar user ne 'NO' select kiya ya close kiya
        if (response === 'NO') {
            if (currentState === STATES.SLIDE_PAUSED) {
                audioManagerRef.current?.resumeSlideAudio();
                setCurrentState(STATES.SLIDE_PLAYING);
            } else {
                if (currentSlideIndex < lectureData.length - 1) {
                    playSlide(currentSlideIndex + 1);
                } else {
                    setCurrentState(STATES.IDLE);
                    if (isRecording) stopRecording();
                }
            }
        } else {
            // ✅ SCENARIO: User sends a question (response holds the text or 'YES')
            setCurrentState(STATES.CHATBOT_ACTIVE);
            setIsChatOpen(true);
            if (audioManagerRef.current) {
                audioManagerRef.current.pauseSlideAudio();
            }

            // Agar response ek proper question text hai (sirf 'YES' nahi), toh use chat me bhejo
            if (response && response !== 'YES' && typeof response === 'string') {
                const questionText = response;

                // 1. User ka message Chatbot UI me add karo
                setMessages(prev => [...prev, { id: Date.now(), text: questionText, sender: "user" }]);

                // 2. Socket ke through backend ko bhejo taaki answer aaye
                if (socketRef.current?.connected) {
                    socketRef.current.emit("lecture:chat", {
                        lecture_id: lectureId?.toString(),
                        question: questionText
                    });
                }
            }
        }
    }, [currentState, currentSlideIndex, lectureData.length, playSlide, isRecording, stopRecording, location.state?.lectureId]);

    // Capture frame function
    const captureFrame = useCallback(() => {
        if (!contentDivRef.current || !recordingCanvasRef.current || !recordingContextRef.current) return;

        html2canvas(contentDivRef.current, {
            backgroundColor: '#ffffff',
            logging: false,
            scale: 1,
            useCORS: true,
            allowTaint: true
        }).then(canvas => {
            recordingContextRef.current.clearRect(0, 0, recordingCanvasRef.current.width, recordingCanvasRef.current.height);
            recordingContextRef.current.drawImage(canvas, 0, 0, recordingCanvasRef.current.width, recordingCanvasRef.current.height);

            if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                animationFrameIdRef.current = requestAnimationFrame(captureFrame);
            }
        }).catch(err => {
            console.error('Canvas capture error:', err);
        });
    }, []);

    // Start Recording
    const startRecording = useCallback(async () => {
        try {
            if (!contentDivRef.current) {
                handleerror("Content element not found");
                return;
            }

            // Create canvas for recording
            const canvas = document.createElement('canvas');
            canvas.width = 1920;
            canvas.height = 1080;
            recordingCanvasRef.current = canvas;
            recordingContextRef.current = canvas.getContext('2d');

            // Start capturing frames
            const stream = canvas.captureStream(30);
            canvasStreamRef.current = stream;

            // Get audio stream
            const audioDestination = audioContext.createMediaStreamDestination();
            if (currentAudioSource) {
                currentAudioSource.connect(audioDestination);
            }

            // Combine video and audio
            const combinedStream = new MediaStream([
                ...stream.getVideoTracks(),
                ...audioDestination.stream.getAudioTracks()
            ]);

            // Try MP4 first, fallback to WebM
            let mimeType = 'video/webm;codecs=vp9,opus';
            let extension = 'webm';

            if (MediaRecorder.isTypeSupported('video/mp4')) {
                mimeType = 'video/mp4';
                extension = 'mp4';
            }

            const recorder = new MediaRecorder(combinedStream, {
                mimeType: mimeType,
                videoBitsPerSecond: 5000000 // Higher quality
            });

            recordedChunksRef.current = [];

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    recordedChunksRef.current.push(e.data);
                }
            };

            recorder.onstop = () => {
                const blob = new Blob(recordedChunksRef.current, { type: mimeType });
                setRecordedBlob(blob);
            };

            recorder.start(100); // Capture every 100ms
            mediaRecorderRef.current = recorder;
            setIsRecording(true);
            setIsPaused(false);
            setCurrentState(STATES.RECORDING_ACTIVE);

            // Start frame capture
            captureFrame();

            // Start playing
            playSlide(0);
        } catch (error) {
            console.error("Recording failed:", error);
            handleerror("Failed to start recording: " + error.message);
        }
    }, [audioContext, currentAudioSource, playSlide, captureFrame]);

    // Download Recording (download whatever is recorded so far)
    const downloadRecording = useCallback(() => {
        // Create blob from current chunks
        if (recordedChunksRef.current.length === 0) {
            handleerror("No recording data available");
            return;
        }

        let mimeType = 'video/webm';
        let extension = 'webm';

        if (MediaRecorder.isTypeSupported('video/mp4')) {
            mimeType = 'video/mp4';
            extension = 'mp4';
        }

        const blob = new Blob(recordedChunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `lecture-recording-${Date.now()}.${extension}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        handlesuccess("Recording downloaded successfully!");
    }, []);

    const currentSlide = lectureData[currentSlideIndex];

    if (isLoading) {
        return (
            <div className="fixed inset-0 bg-white flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-4 border-gray-300 border-t-gray-800 rounded-full animate-spin"></div>
                    <p className="text-sm font-medium text-gray-600">Loading Lecture...</p>
                </div>
            </div>
        );
    }

    if (pageError) {
        return (
            <div className="fixed inset-0 bg-white flex items-center justify-center">
                <div className="flex flex-col items-center gap-4 text-center">
                    <p className="text-gray-800 text-lg font-semibold">{pageError}</p>
                    <button
                        onClick={() => navigate(-1)}
                        className="px-6 py-2 bg-gray-800 text-white rounded-full font-bold hover:bg-gray-700"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-white overflow-hidden">

            {/* Audio Manager */}
            <AudioManager
                ref={audioManagerRef}
                audioContext={audioContext}
                analyserNode={analyserNode}
                onAudioSourceChange={setCurrentAudioSource}
            />

            {/* Main Content - THIS IS WHAT GETS RECORDED */}
            <div ref={contentDivRef} className="absolute inset-0 flex flex-col items-center justify-between px-8 py-6">
                {/* Left: Avatar & Logo */}
                <div className="flex flex-col items-center justify-center gap-8">
                    <img src="/inai-logo-light.png" alt="INAI" className="w-32 h-auto" />
                </div>

                {/* Right: Whiteboard */}
                <div
                    className="w-full h-full flex flex-1 items-center justify-center relative"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex-1 relative w-full h-full">

                        {currentSlide && (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-full h-4/5 overflow-y-auto p-8">
                                    {currentSlide.title && (
                                        <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-3 border-b-2 border-gray-800 text-center">
                                            {currentSlide.title}
                                        </h2>
                                    )}

                                    {currentSlide.bullets.length > 0 ? (
                                        <ul className="space-y-3">
                                            {currentSlide.bullets.map((bullet, i) => {
                                                const totalBullets = currentSlide.bullets.length;
                                                const step = 1 / totalBullets;
                                                const start = i * step;
                                                const localProgress = Math.max(0, Math.min(1, (playbackProgress - start) / step));

                                                return (
                                                    <li key={i} className="relative pl-6 text-gray-800 text-base">
                                                        <span className="absolute left-0 text-xl font-bold">•</span>
                                                        <TypingEffect
                                                            text={bullet}
                                                            progress={localProgress}
                                                            isTyping={currentState === STATES.SLIDE_PLAYING && localProgress < 1 && localProgress > 0}
                                                        />
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    ) : currentSlide.narration && (
                                        <div className="text-gray-800 text-base leading-relaxed">
                                            <TypingEffect
                                                text={currentSlide.narration}
                                                progress={playbackProgress}
                                                isTyping={currentState === STATES.SLIDE_PLAYING}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {currentSlide?.video_url ? (
                        <div className="flex-1 w-full h-full flex items-center justify-center p-4">
                            <video
                                ref={videoRef}
                                src={currentSlide.video_url}
                                className="max-w-full max-h-full rounded-lg shadow-lg"
                                controls={false}
                                muted={true}
                                playsInline
                            >
                                Your browser does not support the video tag.
                            </video>
                        </div>
                    ) : (localImagesMap[currentSlideIndex + 1] || currentSlide?.content_url) ? (
                        <div className={`flex-1 w-full h-full flex items-center justify-center transition-opacity duration-700 ${currentState === STATES.SLIDE_PLAYING || playbackProgress > 0 ? 'opacity-100' : 'opacity-0'}`}>
                            {(localImagesMap[currentSlideIndex + 1] || currentSlide.content_url).match(/\.(jpeg|jpg|gif|png|webp)($|\?)/i) ? (
                                <img
                                    src={localImagesMap[currentSlideIndex + 1] || currentSlide.content_url}
                                    alt="Slide Content"
                                    className="w-full h-min rounded-lg shadow-lg"
                                />
                            ) : (
                                <iframe
                                    src={currentSlide.content_url}
                                    className="w-full h-full border-0 rounded-lg shadow-lg"
                                    title="Slide Content"
                                    allowFullScreen
                                />
                            )}
                        </div>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-gray-400 font-medium text-lg italic">
                        </div>
                    )}

                </div>
            </div>

            {/* Controls - POSITIONED OUTSIDE RECORDING AREA */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 z-50">
                {/* Play/Pause Button - Always show during recording mode */}
                {(isRecording || !isRecording) && (
                    <button
                        onClick={async () => {
                            if (currentState === STATES.SLIDE_PLAYING || currentState === STATES.RECORDING_ACTIVE) {
                                // Pause lecture audio
                                audioManagerRef.current?.pauseSlideAudio();
                                setCurrentState(STATES.SLIDE_PAUSED);

                                // Pause recording if active
                                if (isRecording && !isPaused) {
                                    pauseRecording();
                                }

                                // Show question popup only if not recording
                                if (!isRecording) {
                                    setIsQuestionPopupOpen(true);
                                }
                            } else {
                                // Auto-start recording on first play
                                if (!isRecording && currentSlideIndex === 0 && playbackProgress === 0) {
                                    await startRecording();
                                    return;
                                }

                                // Resume lecture audio
                                if (currentState === STATES.SLIDE_PAUSED) {
                                    audioManagerRef.current?.resumeSlideAudio();
                                    setCurrentState(isRecording ? STATES.RECORDING_ACTIVE : STATES.SLIDE_PLAYING);

                                    // Resume recording if it was paused
                                    if (isRecording && isPaused) {
                                        resumeRecording();
                                    }

                                    setIsQuestionPopupOpen(false);
                                }
                                else if (playbackProgress >= 1 && currentSlideIndex < lectureData.length - 1) {
                                    playSlide(currentSlideIndex + 1);
                                }
                                else {
                                    playSlide(currentSlideIndex);
                                }
                            }
                        }}
                        disabled={lectureData.length === 0}
                        className="w-16 h-16 flex items-center justify-center rounded-full bg-gray-800 border-2 border-gray-900 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                        {(currentState === STATES.SLIDE_PLAYING || currentState === STATES.RECORDING_ACTIVE) ? <Pause className="w-6 h-6 text-white" /> : <Play className="w-6 h-6 text-white ml-1" />}
                    </button>
                )}

                {/* Chatbot Button */}
                <button
                    onClick={() => setIsChatOpen(!isChatOpen)}
                    disabled={lectureData.length === 0}
                    className={`w-16 h-16 flex items-center justify-center rounded-full border-2 transition-all disabled:opacity-30 disabled:cursor-not-allowed ${isChatOpen ? 'bg-gray-800 border-gray-900' : 'bg-white border-gray-800'}`}
                >
                    <MessageCircle className={`w-6 h-6 ${isChatOpen ? 'text-white' : 'text-gray-800'}`} />
                </button>


                {/* Download Button - Shows when paused and has recording data */}
                {isRecording && isPaused && recordedChunksRef.current.length > 0 && (
                    <button
                        onClick={downloadRecording}
                        className="px-6 py-3 bg-green-500 text-white rounded-full font-semibold hover:bg-green-600 flex items-center gap-2 transition-all"
                    >
                        <Download className="w-5 h-5" />
                        Download Recording
                    </button>
                )}
            </div>

            {/* Progress Bar - POSITIONED OUTSIDE RECORDING AREA */}
            {lectureData.length > 0 && (
                <div className="absolute bottom-26 left-0 right-0 px-6 z-20">
                    <div className="max-w-2xl mx-auto">
                        <div className="flex justify-between mb-2 text-sm font-semibold text-gray-800">
                            <span>Slide {currentSlideIndex + 1} / {lectureData.length}</span>
                            <span>{Math.round(((currentSlideIndex + 1) / lectureData.length) * 100)}%</span>
                        </div>
                        <div className="w-full h-2 bg-gray-200 rounded-full">
                            <div className="h-full bg-linear-to-r from-blue-500 to-purple-500 rounded-full transition-all" style={{ width: `${((currentSlideIndex + 1) / lectureData.length) * 100}%` }} />
                        </div>
                    </div>
                </div>
            )}

            {/* Question Popup - IMPORTANT NOTE: Ensure QuestionPopup passes the actual question text string to onResponse instead of just 'YES' */}
            <QuestionPopup
                isOpen={isQuestionPopupOpen}
                onResponse={handleQuestionResponse}
                onClose={() => handleQuestionResponse('NO')}
            />

            {/* Chatbot */}
            {isChatOpen && (
                <Chatbot
                    messages={messages}
                    onSendMessage={(text) => {
                        setMessages(prev => [...prev, { id: Date.now(), text, sender: "user" }]);
                        if (socketRef.current?.connected) {
                            socketRef.current.emit("lecture:chat", {
                                lecture_id: lectureId?.toString(),
                                question: text
                            });
                        }
                    }}
                    onClose={() => {
                        setIsChatOpen(false);
                        setTimeout(() => {
                            if (currentState === STATES.CHATBOT_ACTIVE) {
                                audioManagerRef.current?.resumeSlideAudio();
                                setCurrentState(STATES.SLIDE_PLAYING);
                            }
                        }, 3000);
                    }}
                />
            )}
        </div>
    );
}

export default LectureVideo;