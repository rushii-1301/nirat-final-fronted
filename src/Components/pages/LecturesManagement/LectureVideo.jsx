import React, { useEffect, useState, useRef, useCallback } from "react";
import { io } from "socket.io-client";
import { useLocation, useNavigate } from "react-router-dom";
import { X, ChevronLeft, Pause, Play, MessageCircle, Mic, MicOff, SendHorizontal, Download } from "lucide-react";
import axios from "axios";
import { BACKEND_API_URL, handleerror, handlesuccess } from "../../../utils/assets.js";
// import Avatar from "./components/Avatar";
import Chatbot from "./components/Chatbot";
import QuestionPopup from "./components/QuestionPopup";
import AudioManager from "./components/AudioManager";
import TypingEffect from "./components/TypingEffect";
import MathTypingEffect from "./components/MathTypingEffect";

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
    const [recordedBlob, setRecordedBlob] = useState(null);
    const mediaRecorderRef = useRef(null);
    const recordedChunksRef = useRef([]);

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

    // Fetch Lecture Data
    useEffect(() => {
        const fetchLectureData = async () => {
            setIsLoading(true);
            const lectureId = location.state?.lectureId;

            if (!lectureId) {
                setPageError("Missing Lecture Information");
                setIsLoading(false);
                return;
            }

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

        fetchLectureData();
    }, [location.state?.lectureId]);

    // Progress Tracking Loop
    useEffect(() => {
        let animationFrameId;

        // ✅ Is function ko apne LectureVideo.js me replace kar do

        const animateProgress = () => {
            // 1. Safety Checks: State PLAYING hona chahiye aur Audio Manager ready hona chahiye
            if (currentState === STATES.SLIDE_PLAYING && slideDuration > 0 && audioManagerRef.current) {

                // 2. Audio ka current time nikalo (AudioManager se)
                const elapsed = audioManagerRef.current.getSlideElapsed();

                // 3. Calculation: (Kitna time chala / Total time kitna hai)
                // Math.min use kiya taaki progress kabhi 1 (100%) se upar na jaye
                const prog = Math.min(elapsed / slideDuration, 1);

                // 4. Progress State update karo (Isse UI me typing effect chalega)
                setPlaybackProgress(prog);

                // 5. Check karo audio abhi baaki hai ya nahi
                if (elapsed < slideDuration) {
                    // Agar audio bacha hai, to animation loop continue rakho
                    animationFrameId = requestAnimationFrame(animateProgress);
                } else {
                    // Agar audio duration complete ho gayi, to progress 100% set kardo
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

    // Stop Recording
    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
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
    }, [lectureData, audioContext, isRecording, stopRecording, currentState]);


    // ---------------------------------------------------------
    // ✅ NEW HELPER FUNCTION: Handle Send Message (Unified Logic)
    // ---------------------------------------------------------
    const handleSendMessage = useCallback((text) => {
        if (!text || typeof text !== 'string' || !text.trim()) return;

        // 1. UI update: Add user message
        setMessages(prev => [...prev, { id: Date.now(), text, sender: "user" }]);

        // 2. Send to Backend via Socket
        if (socketRef.current?.connected) {
            socketRef.current.emit("lecture:chat", {
                lecture_id: location.state?.lectureId?.toString(),
                question: text
            });
        }
    }, [location.state?.lectureId]);


    // ---------------------------------------------------------
    // ✅ UPDATED LOGIC: Handle Question Response
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
            // Using the common handleSendMessage function
            if (response && response !== 'YES' && typeof response === 'string') {
                handleSendMessage(response);
            }
        }
    }, [currentState, currentSlideIndex, lectureData.length, playSlide, isRecording, stopRecording, handleSendMessage]);

    // Start Recording
    const startRecording = useCallback(async () => {
        try {
            const canvas = document.getElementById('lecture-canvas');
            if (!canvas) {
                handleerror("Canvas element not found");
                return;
            }
            const canvasStream = canvas.captureStream(30);

            const audioDestination = audioContext.createMediaStreamDestination();
            if (currentAudioSource) {
                currentAudioSource.connect(audioDestination);
            }

            const combinedStream = new MediaStream([
                ...canvasStream.getVideoTracks(),
                ...audioDestination.stream.getAudioTracks()
            ]);

            const recorder = new MediaRecorder(combinedStream, {
                mimeType: 'video/webm;codecs=vp9,opus',
                videoBitsPerSecond: 2500000
            });

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    recordedChunksRef.current.push(e.data);
                }
            };

            recorder.onstop = () => {
                const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
                setRecordedBlob(blob);
                recordedChunksRef.current = [];
            };

            recorder.start(1000);
            mediaRecorderRef.current = recorder;
            setIsRecording(true);
            setCurrentState(STATES.RECORDING_ACTIVE);

            playSlide(0);
        } catch (error) {
            console.error("Recording failed:", error);
            handleerror("Failed to start recording");
        }
    }, [audioContext, currentAudioSource, playSlide]);

    // Download Recording
    const downloadRecording = useCallback(() => {
        if (!recordedBlob) return;

        const url = URL.createObjectURL(recordedBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `lecture-${Date.now()}.webm`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        handlesuccess("Recording downloaded!");
    }, [recordedBlob]);

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

            {/* Main Content */}
            <div className="absolute inset-0 flex flex-col items-center justify-between px-8 py-6">
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
                                                        <MathTypingEffect
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
                                            <MathTypingEffect
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

            {/* Controls */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-6 z-50">
                <button
                    onClick={() => {
                        // Case 1: Agar chal raha hai to pause karo
                        if (currentState === STATES.SLIDE_PLAYING) {
                            audioManagerRef.current?.pauseSlideAudio();
                            setCurrentState(STATES.SLIDE_PAUSED);
                            setIsQuestionPopupOpen(true);
                        }
                        else {
                            // Case 2 (FIXED): Agar Paused hai YA Chatbot Active hai, to wahin se RESUME karo
                            if (currentState === STATES.SLIDE_PAUSED || currentState === STATES.CHATBOT_ACTIVE) {
                                audioManagerRef.current?.resumeSlideAudio();
                                setCurrentState(STATES.SLIDE_PLAYING);
                                setIsQuestionPopupOpen(false);
                            }
                            // Case 3: Agar slide khatam ho gayi hai aur next slide hai
                            else if (playbackProgress >= 1 && currentSlideIndex < lectureData.length - 1) {
                                playSlide(currentSlideIndex + 1);
                            }
                            // Case 4: Agar bilkul shuru se chalana hai (Restart)
                            else {
                                playSlide(currentSlideIndex);
                            }
                        }
                    }}
                    disabled={isChatOpen || (currentState === STATES.IDLE && lectureData.length === 0) || (currentState === STATES.SLIDE_PLAYING && slideDuration === 0)}
                    className="w-16 h-16 flex items-center justify-center rounded-full bg-gray-800 border-2 border-gray-900 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {currentState === STATES.SLIDE_PLAYING ? <Pause className="w-6 h-6 text-white" /> : <Play className="w-6 h-6 text-white ml-1" />}
                </button>

                <button
                    onClick={() => {
                        if (!isChatOpen) {
                            // Chat Open kar rahe hain -> Pause if playing
                            if (currentState === STATES.SLIDE_PLAYING || currentState === STATES.SLIDE_PAUSED) {
                                audioManagerRef.current?.pauseSlideAudio();
                                setCurrentState(STATES.CHATBOT_ACTIVE);
                            }
                            setIsChatOpen(true);
                        } else {
                            // Chat Close kar rahe hain -> Resume if it was active
                            if (currentState === STATES.CHATBOT_ACTIVE) {
                                audioManagerRef.current?.resumeSlideAudio();
                                setCurrentState(STATES.SLIDE_PLAYING);
                            }
                            setIsChatOpen(false);
                        }
                    }}
                    className={`w-16 h-16 flex items-center justify-center rounded-full border-2 ${isChatOpen ? 'bg-gray-800 border-gray-900' : 'bg-white border-gray-800'}`}
                >
                    <MessageCircle className={`w-6 h-6 ${isChatOpen ? 'text-white' : 'text-gray-800'}`} />
                </button>

                {!isRecording && currentState === STATES.IDLE && (
                    <button onClick={startRecording} className="px-6 py-3 bg-red-500 text-white rounded-full font-semibold hover:bg-red-600">
                        Start Recording
                    </button>
                )}
            </div>

            {/* Progress */}
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

            {/* Question Popup */}
            <QuestionPopup
                isOpen={isQuestionPopupOpen}
                onResponse={handleQuestionResponse}
                onClose={() => handleQuestionResponse('NO')}
            />

            {/* Chatbot */}
            {isChatOpen && (
                <Chatbot
                    messages={messages}
                    onSendMessage={handleSendMessage}
                    onClose={() => {
                        setIsChatOpen(false);

                        // FIX: Agar chat active thi, to turant resume karo bina restart kiye
                        if (currentState === STATES.CHATBOT_ACTIVE) {
                            audioManagerRef.current?.resumeSlideAudio();
                            setCurrentState(STATES.SLIDE_PLAYING);
                        }
                    }}
                />
            )}
        </div>
    );
}

export default LectureVideo;