import React, { useEffect, useState, useRef, useCallback } from "react";
import { io } from "socket.io-client";
import { useLocation, useNavigate } from "react-router-dom";
import { ChevronLeft, Pause, Play, MessageCircle, Loader2, Download } from "lucide-react";
import axios from "axios";
import { BACKEND_API_URL, handleerror, handlesuccess } from "../../../utils/assets.js";
import fixWebmDuration from "fix-webm-duration";
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
    const [hasRecordingStarted, setHasRecordingStarted] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [recordedBlob, setRecordedBlob] = useState(null);
    const mediaRecorderRef = useRef(null);
    const recordedChunksRef = useRef([]);
    const audioDestinationRef = useRef(null);
    const screenStreamRef = useRef(null);
    const recordingStartTimeRef = useRef(null);

    // Question Popup State
    const [isQuestionPopupOpen, setIsQuestionPopupOpen] = useState(false);
    const popupTimeoutRef = useRef(null);

    // Initialize Audio Context
    useEffect(() => {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;

        // Create audio destination for recording (system audio only, no mic)
        const audioDestination = ctx.createMediaStreamDestination();
        audioDestinationRef.current = audioDestination;

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

    // =========================================
    // RECORDING FUNCTIONS (OLD FLOW - SCREEN CAPTURE)
    // =========================================

    // Upload recording to API
    const uploadRecording = useCallback(async (blob, filename) => {
        try {
            setIsUploading(true);
            const token = localStorage.getItem("access_token") || localStorage.getItem("token");
            const lectureId = location.state?.lectureId;
            const stdParam = location.state?.std || '5';
            const divisionParam = location.state?.division || 'A';

            const formData = new FormData();
            formData.append('file', blob, filename);
            formData.append('std', stdParam);
            formData.append('division', divisionParam);

            const response = await axios.post(
                `${BACKEND_API_URL}/lectures/${lectureId}/share-recording`,
                formData,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/json',
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );

            handlesuccess("Recording uploaded successfully!");
            console.log("Upload response:", response.data);
        } catch (error) {
            console.error("Upload failed:", error);
            handleerror("Failed to upload recording. File saved locally.");
        } finally {
            setIsUploading(false);
        }
    }, [location.state?.lectureId, location.state?.std, location.state?.division]);

    // Download and Upload Recording
    const downloadAndUploadRecording = useCallback(async (blob, isMP4 = false) => {
        const extension = isMP4 ? 'mp4' : 'webm';
        const mimeType = isMP4 ? 'video/mp4' : 'video/webm';
        const filename = `lecture-${Date.now()}.${extension}`;

        // Create a new blob with clean MIME type (without codecs) for API compatibility
        const cleanBlob = new Blob([blob], { type: mimeType });

        // Save blob for manual download option
        setRecordedBlob(cleanBlob);

        // Auto download - COMMENTED OUT
        // const url = URL.createObjectURL(cleanBlob);
        // const link = document.createElement('a');
        // link.href = url;
        // link.download = filename;
        // document.body.appendChild(link);
        // link.click();
        // document.body.removeChild(link);
        // URL.revokeObjectURL(url);
        // handlesuccess(`Recording downloaded as ${extension.toUpperCase()}!`);

        // Upload to API (background, no blocking UI)
        await uploadRecording(cleanBlob, filename);
    }, [uploadRecording]);

    // Stop Recording
    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }

        // Stop screen stream tracks
        if (screenStreamRef.current) {
            screenStreamRef.current.getTracks().forEach(track => track.stop());
            screenStreamRef.current = null;
        }

        // Reset lecture to beginning (slide 0) after recording stops
        setCurrentSlideIndex(0);
        setPlaybackProgress(0);
        setCurrentState(STATES.IDLE);
        setHasRecordingStarted(false);

        // Stop any playing audio
        if (audioManagerRef.current) {
            audioManagerRef.current.pauseSlideAudio();
        }
    }, []);

    // Start Recording - Uses Screen Capture API to record the browser tab with system audio only
    const startRecording = useCallback(async () => {
        try {
            // Request screen capture - will capture the current browser tab
            const displayMediaOptions = {
                video: {
                    displaySurface: 'browser',
                    cursor: 'never', // Hide mouse cursor in recording
                    width: { ideal: 1280, max: 1280 },  // 720p width
                    height: { ideal: 720, max: 720 },   // 720p height
                    frameRate: { ideal: 30, max: 30 }
                },
                audio: false, // We'll use our own audio from AudioContext
                preferCurrentTab: true, // Prefer capturing the current tab
                selfBrowserSurface: 'include', // Include this tab in the options
                surfaceSwitching: 'exclude', // Don't allow switching
                monitorTypeSurfaces: 'exclude' // Exclude entire screen options
            };

            let screenStream;
            try {
                screenStream = await navigator.mediaDevices.getDisplayMedia(displayMediaOptions);
                screenStreamRef.current = screenStream;
            } catch (err) {
                console.error("Screen capture not available:", err);
                handleerror("Screen sharing permission is required to start the lecture");
                return false;
            }

            // Get video track from screen capture
            const videoTrack = screenStream.getVideoTracks()[0];
            if (!videoTrack) {
                handleerror("Could not get video track from screen capture");
                return false;
            }

            // Set up track ended handler (user clicks "Stop sharing")
            videoTrack.onended = () => {
                console.log("Screen sharing stopped by user");
                stopRecording();
            };

            // Get audio from the audio context destination (lecture audio only, no mic)
            if (!audioDestinationRef.current && audioContext) {
                audioDestinationRef.current = audioContext.createMediaStreamDestination();
            }

            // Combine video from screen capture and audio from our AudioContext
            const tracks = [videoTrack];
            if (audioDestinationRef.current?.stream?.getAudioTracks().length > 0) {
                tracks.push(...audioDestinationRef.current.stream.getAudioTracks());
            }
            const combinedStream = new MediaStream(tracks);

            // Determine best supported mime type
            // Use WebM format (Chrome/Firefox) - it has proper duration with fix-webm-duration library
            // MP4 not used because browser records Opus audio which is incompatible with MP4 container
            let mimeType = '';
            let isMP4 = false;

            // Use WebM format (most browsers support this well)
            const webmTypes = [
                'video/webm;codecs=vp8,opus',
                'video/webm;codecs=vp9,opus',
                'video/webm;codecs=vp8',
                'video/webm'
            ];

            for (const type of webmTypes) {
                if (MediaRecorder.isTypeSupported(type)) {
                    mimeType = type;
                    console.log('Using WebM format:', type);
                    break;
                }
            }

            // Fallback to MP4 only for Safari (which uses AAC audio, compatible with MP4)
            if (!mimeType) {
                const mp4Types = [
                    'video/mp4;codecs=h264,aac',
                    'video/mp4;codecs=avc1',
                    'video/mp4'
                ];

                for (const type of mp4Types) {
                    if (MediaRecorder.isTypeSupported(type)) {
                        mimeType = type;
                        isMP4 = true;
                        console.log('Using MP4 format (Safari):', type);
                        break;
                    }
                }
            }

            // Create recorder with settings for stability
            const recorderOptions = {
                videoBitsPerSecond: 2500000 // 2.5 Mbps for 720p
            };

            if (mimeType) {
                recorderOptions.mimeType = mimeType;
            }

            const recorder = new MediaRecorder(combinedStream, recorderOptions);

            recordedChunksRef.current = [];

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    recordedChunksRef.current.push(e.data);
                }
            };

            recorder.onstop = async () => {
                // Stop all tracks from the screen capture
                if (screenStreamRef.current) {
                    screenStreamRef.current.getTracks().forEach(track => track.stop());
                    screenStreamRef.current = null;
                }

                // Determine if it's MP4 based on recorder's mimeType
                const recorderMimeType = recorder.mimeType || '';
                const isActuallyMP4 = recorderMimeType.includes('mp4');

                // Create initial blob
                let blob = new Blob(recordedChunksRef.current, { type: isActuallyMP4 ? 'video/mp4' : 'video/webm' });
                recordedChunksRef.current = [];

                console.log('Recording stopped. Format:', blob.type, 'Size:', blob.size);

                // Fix WebM duration metadata (WebM files from MediaRecorder often have missing duration)
                if (!isActuallyMP4 && blob.size > 0) {
                    try {
                        // Calculate approximate duration based on recording time
                        const recordingDuration = Date.now() - recordingStartTimeRef.current;
                        console.log('Fixing WebM duration:', recordingDuration, 'ms');
                        blob = await fixWebmDuration(blob, recordingDuration, { logger: false });
                        console.log('WebM duration fixed successfully');
                    } catch (err) {
                        console.warn('Could not fix WebM duration:', err);
                        // Continue with original blob
                    }
                }

                // Download and upload
                if (blob.size > 0) {
                    await downloadAndUploadRecording(blob, isActuallyMP4);
                }
            };

            recorder.start(100); // Collect data every 100ms for stability
            mediaRecorderRef.current = recorder;
            recordingStartTimeRef.current = Date.now(); // Track recording start time for duration fix
            setIsRecording(true);
            setHasRecordingStarted(true);

            console.log('Recording started successfully with screen capture');
            return true;
        } catch (error) {
            console.error("Recording start failed:", error);
            handleerror("Failed to start recording: " + error.message);
            return false;
        }
    }, [audioContext, downloadAndUploadRecording, stopRecording]);

    // Play Slide - Auto-starts recording on first play
    const playSlide = useCallback(async (index) => {
        if (!lectureData[index] || !audioContext) return;

        // Auto-start recording on first play if not already started
        if (!hasRecordingStarted && index === 0) {
            const recordingStarted = await startRecording();
            if (!recordingStarted) {
                // User denied screen sharing permission - don't start lecture
                // handleerror("Screen sharing permission is required to start the lecture");
                return;
            }
        }

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
            // Connect audio to recording destination if recording
            if (audioDestinationRef.current && currentAudioSource) {
                try {
                    currentAudioSource.connect(audioDestinationRef.current);
                } catch (e) {
                    // Already connected or source ended
                }
            }

            const { duration } = await audioManagerRef.current.playSlideAudio(slide.audio_url, () => {
                if (progressFrameRef.current) cancelAnimationFrame(progressFrameRef.current);
                setPlaybackProgress(1);

                if (!slide.isLastSlide) {
                    setCurrentState(STATES.QUESTION_WAIT);
                    popupTimeoutRef.current = setTimeout(() => {
                        setIsQuestionPopupOpen(true);
                    }, 1500);
                } else {
                    // Last slide finished - stop recording
                    setCurrentState(STATES.IDLE);
                    if (isRecording) {
                        stopRecording();
                    }
                }
            }) || { duration: 0 };

            setSlideDuration(duration || 0);
        }
    }, [lectureData, audioContext, isRecording, stopRecording, hasRecordingStarted, startRecording, currentAudioSource]);


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

    // Download Recording (manual download option)
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
                onAudioSourceChange={(source) => {
                    setCurrentAudioSource(source);
                    // Connect audio source to recording destination for system audio capture
                    if (audioDestinationRef.current && source) {
                        try {
                            source.connect(audioDestinationRef.current);
                        } catch (e) {
                            // Already connected
                        }
                    }
                }}
            />

            {/* Recording Indicator */}
            {/* {isRecording && (
                <div className="absolute top-4 right-4 z-50 flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-full font-semibold animate-pulse">
                    <div className="w-3 h-3 bg-white rounded-full animate-ping" />
                    <span>Recording...</span>
                </div>
            )} */}

            {/* Uploading Indicator - HIDDEN (upload happens in background) */}
            {/* {isUploading && (
                <div className="absolute inset-0 z-100 bg-black/50 flex items-center justify-center">
                    <div className="bg-white rounded-xl p-8 flex flex-col items-center gap-4 shadow-2xl">
                        <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
                        <p className="text-gray-800 font-semibold text-lg">Uploading recording...</p>
                        <p className="text-gray-500 text-sm">Please wait while we upload your lecture</p>
                    </div>
                </div>
            )} */}

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

                {/* Download Recording Button - Shows after recording is complete */}
                {/* {recordedBlob && !isRecording && (
                    <button onClick={downloadRecording} className="px-6 py-3 bg-green-500 text-white rounded-full font-semibold hover:bg-green-600 flex items-center gap-2">
                        <Download className="w-5 h-5" />
                        Download Recording
                    </button>
                )} */}
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