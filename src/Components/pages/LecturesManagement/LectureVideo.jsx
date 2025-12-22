// import React, { useEffect, useState, useRef, useCallback } from "react";
// import { io } from "socket.io-client";
// import { useLocation, useNavigate } from "react-router-dom";
// import { X, ChevronLeft, Pause, Play, MessageCircle, Mic, MicOff, SendHorizontal, Download } from "lucide-react";
// import axios from "axios";
// import { BACKEND_API_URL, handleerror, handlesuccess } from "../../../utils/assets.js";
// import Avatar from "./components/Avatar";
// import QuestionPopup from "./components/QuestionPopup";
// import Chatbot from "./components/Chatbot";
// import AudioManager from "./components/AudioManager";

// // STATE MACHINE
// const STATES = {
//     IDLE: 'IDLE',
//     SLIDE_PLAYING: 'SLIDE_PLAYING',
//     SLIDE_PAUSED: 'SLIDE_PAUSED',
//     QUESTION_WAIT: 'QUESTION_WAIT',
//     CHATBOT_ACTIVE: 'CHATBOT_ACTIVE',
//     RECORDING_ACTIVE: 'RECORDING_ACTIVE'
// };

// function LectureVideo({ theme, isDark }) {
//     const location = useLocation();
//     const navigate = useNavigate();

//     // State Management
//     const [currentState, setCurrentState] = useState(STATES.IDLE);
//     const [lectureData, setLectureData] = useState([]);
//     const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
//     const [isLoading, setIsLoading] = useState(true);
//     const [pageError, setPageError] = useState(null);

//     // Audio State
//     const [audioContext, setAudioContext] = useState(null);
//     const [analyserNode, setAnalyserNode] = useState(null);
//     const [currentAudioSource, setCurrentAudioSource] = useState(null);
//     const audioManagerRef = useRef(null);

//     // Chat State
//     const [isChatOpen, setIsChatOpen] = useState(false);
//     const [messages, setMessages] = useState([{ id: 1, text: "Hi, Welcome To Class", sender: "system" }]);
//     const socketRef = useRef(null);

//     // Recording State
//     const [isRecording, setIsRecording] = useState(false);
//     const [recordedBlob, setRecordedBlob] = useState(null);
//     const mediaRecorderRef = useRef(null);
//     const recordedChunksRef = useRef([]);

//     // Question Popup State
//     const [isQuestionPopupOpen, setIsQuestionPopupOpen] = useState(false);

//     // Initialize Audio Context
//     useEffect(() => {
//         const ctx = new (window.AudioContext || window.webkitAudioContext)();
//         const analyser = ctx.createAnalyser();
//         analyser.fftSize = 256;
//         setAudioContext(ctx);
//         setAnalyserNode(analyser);

//         return () => {
//             if (ctx.state !== 'closed') {
//                 ctx.close();
//             }
//         };
//     }, []);

//     // Fetch Lecture Data
//     useEffect(() => {
//         const fetchLectureData = async () => {
//             setIsLoading(true);
//             const lectureId = location.state?.lectureId;

//             if (!lectureId) {
//                 setPageError("Missing Lecture Information");
//                 setIsLoading(false);
//                 return;
//             }

//             try {
//                 const token = localStorage.getItem("access_token") || localStorage.getItem("token");
//                 const response = await axios.get(`${BACKEND_API_URL}/lectures/${lectureId}/play`, {
//                     headers: { Authorization: token ? `Bearer ${token}` : "" }
//                 });

//                 if (response.data?.lecture_url) {
//                     const detailUrl = BACKEND_API_URL + response.data.lecture_url;
//                     const detailRes = await axios.get(detailUrl);
//                     const slides = (detailRes.data.slides || []).map((slide, index) => ({
//                         audio_url: BACKEND_API_URL + slide.audio_url,
//                         title: slide.title || "",
//                         bullets: slide.bullets || [],
//                         subnarrations: slide.subnarrations || [],
//                         narration: slide.narration || "",
//                         question: slide.question || "",
//                         isLastSlide: index === (detailRes.data.slides || []).length - 1
//                     }));

//                     setLectureData(slides);
//                     setCurrentState(STATES.IDLE);
//                 } else {
//                     setPageError("Lecture content not found");
//                 }
//             } catch (error) {
//                 console.error("Failed to fetch lecture data:", error);
//                 setPageError("Failed to load lecture data");
//             } finally {
//                 setIsLoading(false);
//             }
//         };

//         fetchLectureData();
//     }, [location.state?.lectureId]);

//     // Socket.IO Setup
//     useEffect(() => {
//         const token = localStorage.getItem("access_token") || localStorage.getItem("token");
//         if (!token) return;

//         socketRef.current = io(`${BACKEND_API_URL}/lecture-player`, {
//             transports: ["websocket"],
//             auth: { token }
//         });

//         socketRef.current.on("lecture:reply", (data) => {
//             const botResponse = {
//                 id: Date.now(),
//                 text: data.answer || data.display_text || data.message || "Received response",
//                 sender: "system",
//                 audio_url: data.audio_url
//             };
//             setMessages(prev => [...prev, botResponse]);

//             // Play chatbot audio
//             if (data.audio_url && audioManagerRef.current) {
//                 audioManagerRef.current.playChatbotAudio(data.audio_url);
//             }
//         });

//         return () => {
//             if (socketRef.current) socketRef.current.disconnect();
//         };
//     }, []);

//     // Play Slide
//     const playSlide = useCallback(async (index) => {
//         if (!lectureData[index] || !audioContext) return;

//         setCurrentSlideIndex(index);
//         setCurrentState(STATES.SLIDE_PLAYING);

//         const slide = lectureData[index];
//         if (audioManagerRef.current) {
//             await audioManagerRef.current.playSlideAudio(slide.audio_url, () => {
//                 // Slide finished
//                 if (!slide.isLastSlide) {
//                     setCurrentState(STATES.QUESTION_WAIT);
//                     setTimeout(() => {
//                         setIsQuestionPopupOpen(true);
//                     }, 1500);
//                 } else {
//                     setCurrentState(STATES.IDLE);
//                     if (isRecording) stopRecording();
//                 }
//             });
//         }
//     }, [lectureData, audioContext, isRecording]);

//     // Handle Question Response
//     const handleQuestionResponse = useCallback((response) => {
//         setIsQuestionPopupOpen(false);

//         if (response === 'YES') {
//             setCurrentState(STATES.CHATBOT_ACTIVE);
//             setIsChatOpen(true);
//             if (audioManagerRef.current) {
//                 audioManagerRef.current.pauseSlideAudio();
//             }
// <<<<<<< HEAD
//         };
//     }, [isRecording]); 
//     */



//     // --- Iframe Communication & Recording Sync ---
//     const [iframeState, setIframeState] = useState('IDLE');
//     const [videoProgress, setVideoProgress] = useState(0); // 0 to 100
//     const [videoTime, setVideoTime] = useState({ current: 0, total: 0 });

//     useEffect(() => {
//         const handleMessage = (event) => {
//             const { type, state, blob, response, extension, codec, size, oldState, slideIndex } = event.data;
//             console.log("React received from Iframe:", type || event.data);

//             switch (type || event.data) {
//                 case 'EVT_READY':
//                     setIsLoading(false);
//                     setIsLectureReady(true); // Enable play button
//                     console.log('✅ Lecture ready - first slide loaded');
//                     break;
//                 case 'EVT_SYNC_STATE':
//                     setIframeState(state);
//                     // Update playing state - consider CHAT_MODE as paused
//                     setIsPlaying(state === 'PLAYING');

//                     // Auto-open chat when entering CHAT_MODE
//                     if (state === 'CHAT_MODE') {
//                         setIsChatOpen(true);
//                     }

//                     // Log detailed state info
//                     console.log(`📊 State: ${oldState || '?'} → ${state} | Slide: ${slideIndex || '?'}`);
//                     break;
//                 case 'EVT_PROGRESS':
//                     setVideoProgress(event.data.progress);
//                     setVideoTime({
//                         current: event.data.currentTime || 0,
//                         total: event.data.totalDuration || 0
//                     });
//                     break;
//                 case 'EVT_VOICE_TRIGGER':
//                     if (response === 'YES') {
//                         setIsChatOpen(true);
//                         handlesuccess("Opening Chatbot...");
//                         // Optionally auto-open mic for chat or wait for user
//                     }
//                     break;
//                 case 'RECORDING_DATA':
//                     console.log(`🎥 Recording received: ${codec || 'Unknown codec'}, ${(size / 1024 / 1024).toFixed(2)} MB`);
//                     // Store blob with metadata for proper download
//                     const blobWithMeta = blob;
//                     blobWithMeta._extension = extension || 'webm';
//                     blobWithMeta._codec = codec || 'Unknown';
//                     setRecordedBlob(blobWithMeta);
//                     setIsRecording(false);
//                     handlesuccess(`Recording complete! (${codec || 'Unknown codec'})`);
//                     break;
//                 case 'EVT_LECTURE_COMPLETED':
//                     handlesuccess("Lecture Completed!");
//                     setIsPlaying(false);
//                     setIsRecording(false);
//                     break;
//             }
//         };

//         window.addEventListener("message", handleMessage);
//         return () => window.removeEventListener("message", handleMessage);
//     }, []);

//     // Start recording - sends message to iframe
//     const startRecording = () => {
//         if (videoRef.current && videoRef.current.contentWindow) {
//             videoRef.current.contentWindow.postMessage({ type: 'CMD_START' }, '*');
//             setIsRecording(true);
//             setIsPlaying(true);
//             setIsRecordModalOpen(false);
//         }
//     };

//     // Stop recording - sends message to iframe
//     const stopRecording = () => {
//         if (videoRef.current && videoRef.current.contentWindow) {
//             videoRef.current.contentWindow.postMessage({ type: 'CMD_STOP' }, '*');
//             setIsRecording(false);
//             setIsPlaying(false);
//         }
//     };

//     const handlePlay = () => {
//         // Don't allow play if lecture not ready
//         if (!isLectureReady) {
//             console.log('⏳ Waiting for lecture to load...');
//             return;
//         }

//         if (isPlaying) {
//             videoRef.current?.contentWindow.postMessage({ type: 'CMD_PAUSE' }, '*');
// =======
// >>>>>>> f1f5bcd191d9e60ab0c0ce181b54d5119d125c23
//         } else {
//             // Move to next slide
//             if (currentSlideIndex < lectureData.length - 1) {
//                 playSlide(currentSlideIndex + 1);
//             }
//         }
//     }, [currentSlideIndex, lectureData.length, playSlide]);

//     // Start Recording
//     const startRecording = useCallback(async () => {
//         try {
//             const canvas = document.getElementById('lecture-canvas');
//             const canvasStream = canvas.captureStream(30);

//             // Get audio stream from AudioContext
//             const audioDestination = audioContext.createMediaStreamDestination();
//             if (currentAudioSource) {
//                 currentAudioSource.connect(audioDestination);
//             }

//             const combinedStream = new MediaStream([
//                 ...canvasStream.getVideoTracks(),
//                 ...audioDestination.stream.getAudioTracks()
//             ]);

//             const recorder = new MediaRecorder(combinedStream, {
//                 mimeType: 'video/webm;codecs=vp9,opus',
//                 videoBitsPerSecond: 2500000
//             });

//             recorder.ondataavailable = (e) => {
//                 if (e.data.size > 0) {
//                     recordedChunksRef.current.push(e.data);
//                 }
//             };

//             recorder.onstop = () => {
//                 const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
//                 setRecordedBlob(blob);
//                 recordedChunksRef.current = [];
//             };

//             recorder.start(1000);
//             mediaRecorderRef.current = recorder;
//             setIsRecording(true);
//             setCurrentState(STATES.RECORDING_ACTIVE);

//             // Start first slide
//             playSlide(0);
//         } catch (error) {
//             console.error("Recording failed:", error);
//             handleerror("Failed to start recording");
//         }
//     }, [audioContext, currentAudioSource, playSlide]);

//     // Stop Recording
//     const stopRecording = useCallback(() => {
//         if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
//             mediaRecorderRef.current.stop();
//             setIsRecording(false);
//         }
//     }, []);

//     // Download Recording
//     const downloadRecording = useCallback(() => {
//         if (!recordedBlob) return;

//         const url = URL.createObjectURL(recordedBlob);
//         const link = document.createElement('a');
//         link.href = url;
//         link.download = `lecture-${Date.now()}.webm`;
//         document.body.appendChild(link);
//         link.click();
//         document.body.removeChild(link);
//         URL.revokeObjectURL(url);
//         handlesuccess("Recording downloaded!");
//     }, [recordedBlob]);

//     const currentSlide = lectureData[currentSlideIndex];

//     if (isLoading) {
//         return (
//             <div className="fixed inset-0 bg-white flex items-center justify-center">
//                 <div className="flex flex-col items-center gap-4">
//                     <div className="w-10 h-10 border-4 border-gray-300 border-t-gray-800 rounded-full animate-spin"></div>
//                     <p className="text-sm font-medium text-gray-600">Loading Lecture...</p>
//                 </div>
//             </div>
//         );
//     }

//     if (pageError) {
//         return (
//             <div className="fixed inset-0 bg-white flex items-center justify-center">
//                 <div className="flex flex-col items-center gap-4 text-center">
//                     <p className="text-gray-800 text-lg font-semibold">{pageError}</p>
//                     <button
//                         onClick={() => navigate(-1)}
//                         className="px-6 py-2 bg-gray-800 text-white rounded-full font-bold hover:bg-gray-700"
//                     >
//                         Go Back
//                     </button>
//                 </div>
//             </div>
//         );
//     }

//     const formatTime = (seconds) => {
//         if (!seconds) return "00:00";
//         const mins = Math.floor(seconds / 60);
//         const secs = Math.floor(seconds % 60);
//         return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
//     };

//     return (
//         <div className="fixed inset-0 bg-white overflow-hidden">
//             {/* Audio Manager */}
//             <AudioManager
//                 ref={audioManagerRef}
//                 audioContext={audioContext}
//                 analyserNode={analyserNode}
//                 onAudioSourceChange={setCurrentAudioSource}
//             />

//             {/* Main Canvas */}
//             <canvas
//                 id="lecture-canvas"
//                 className="absolute inset-0 w-full h-full"
//                 style={{ display: 'none' }}
//             />

//             {/* Top Bar */}
//             <div className="absolute top-0 left-0 right-0 z-30 bg-white border-b border-gray-200">
//                 <div className="px-6 py-4 flex items-center justify-between">
//                     <div className="flex items-center gap-3">
//                         <button onClick={() => navigate(-1)} className="p-2 rounded-full bg-gray-100 hover:bg-gray-200">
//                             <ChevronLeft size={20} />
//                         </button>
// <<<<<<< HEAD
//                         <button
//                             onClick={() => navigate(-1)}
//                             className="text-white/60 hover:text-white transition-colors"
//                         >
//                             Go Back
//                         </button>
//                     </div>
//                 ) : lecturejson && (
//                     <iframe
//                         ref={videoRef}
//                         // src={`https://mzhyi8c6omxn.id.wasmer.app/?lectureId=${location.state?.lectureId ||
//                         src={`/Templates/index.html?lectureId=${location.state?.lectureId ||
//                             ((lecturejson && typeof lecturejson === 'string' && lecturejson.match(/(\d+)\.json$/)) ? lecturejson.match(/(\d+)\.json$/)[1] : '2')
//                             }`}
//                         className="w-full h-full"
//                         allow="autoplay; fullscreen; picture-in-picture; microphone"
//                         allowFullScreen
//                         style={{ border: 'none' }}
//                         title="Lecture Viewer"
//                     />
//                 )}
//             </div>

//             {/* Floating Top Bar - Shows on hover/touch */}
//             <div
//                 className={`absolute top-0 left-0 right-0 z-30 transition-all duration-300 ${showControls ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
//                     }`}
//             >
//                 <div className="bg-linear-to-b from-black/80 via-black/50 to-transparent px-4 sm:px-6 py-4 sm:py-6">
//                     <div className="flex items-start justify-between gap-4">
//                         {/* Left: Back button, Title and instructor */}
//                         <div className="flex items-start gap-3 flex-1 min-w-0">
//                             <button
//                                 onClick={() => navigate(-1)}
//                                 className="shrink-0 p-2 rounded-full cursor-pointer bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-all duration-200 text-white"
//                                 aria-label="Go back"
//                             >
//                                 <ChevronLeft size={20} />
//                             </button>

//                             <div className="flex-1 min-w-0">
//                                 <h1 className="text-white text-sm sm:text-base md:text-lg font-semibold truncate capitalize">
//                                     {location.state?.title || "Untitled"}
//                                 </h1>
//                                 <p className="text-white/70 text-xs sm:text-sm mt-0.5 truncate capitalize">
//                                     {location.state?.subject || ""}
//                                 </p>
//                             </div>
//                         </div>

//                         {/* Right: Download and Share buttons */}
//                         <div className="shrink-0 flex items-center gap-2">
//                             {/* Download Button - Only enabled after recording */}
//                             {/* Upload Button - Replacing Download */}
//                             <button
//                                 onClick={() => handleDownload()}
//                                 disabled={!isUploadEnabled}
//                                 className={`inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full backdrop-blur-sm transition-all duration-200 text-xs sm:text-sm font-medium ${isUploadEnabled
//                                     ? 'bg-white/10 hover:bg-white/20 text-white cursor-pointer'
//                                     : 'bg-white/5 text-white/30 cursor-not-allowed'
//                                     }`}
//                                 aria-label="Download recording"
//                                 title={!isUploadEnabled ? "Start recording first to enable download" : "Download recorded lecture"}
//                             >
//                                 <Download size={16} /> {/* Using Download icon */}
//                                 <span className="hidden sm:inline">Download</span>
//                             </button>

//                             {/* Share Button */}
//                             {/* <button
//                                 onClick={() => setIsShareOpen(true)}
//                                 className="inline-flex cursor-pointer items-center gap-2 px-3 sm:px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-all duration-200 text-white text-xs sm:text-sm font-medium"
//                             >
//                                 <Share2 size={16} />
//                                 <span className="hidden sm:inline">Share</span>
//                             </button> */}
//                         </div>
//                     </div>
//                 </div>
//             </div>

//             {/* Recording Indicator - Bottom Left - Only show if controls are shown */}
//             {isRecording && showControls && (
//                 <div className="absolute bottom-6 left-6 z-30 flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/90 backdrop-blur-sm">
//                     <div className="w-3 h-3 rounded-full bg-white animate-pulse" />
//                     <span className="text-white text-sm font-medium">Recording...</span>
//                 </div>
//             )}

//             {/* Controls overlay - 3 Buttons (Play, Mic, Chat) */}
//             <div className={`absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center justify-center gap-6 z-50 transition-all duration-300 ${showControls ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}>

//                 {/* Play/Pause Button */}
//                 {/* Play/Pause Button */}
//                 <button
//                     onClick={handlePlay}
//                     disabled={!isLectureReady && !isRecording}
//                     className={`w-16 h-16 flex items-center justify-center rounded-full backdrop-blur-md transition-all duration-200 border border-white/10 group pointer-events-auto
//                         ${!isLectureReady && !isRecording
//                             ? 'bg-white/10 cursor-not-allowed opacity-50'
//                             : 'bg-white/20 hover:bg-white/30 cursor-pointer'}`}
//                     title={!isLectureReady && !isRecording ? 'Loading lecture...' : isPlaying ? 'Pause' : 'Play'}
//                 >
//                     <div className="w-12 h-12 rounded-full border-2 border-white flex items-center justify-center">
//                         {isPlaying ? <Pause className="w-6 h-6 text-white fill-white" /> : <Play className="w-6 h-6 text-white fill-white ml-1" />}
//                     </div>
//                 </button>

//                 {/* Progress Bar (Between Buttons) */}
//                 <div className="flex flex-col items-center gap-1 min-w-[120px] sm:min-w-[200px]">
//                     <div className="relative w-full h-1.5 bg-white/20 rounded-full overflow-hidden backdrop-blur-sm">
//                         <div
//                             className="absolute top-0 left-0 h-full bg-white rounded-full transition-all duration-75 ease-linear"
//                             style={{ width: `${videoProgress}%`, boxShadow: '0 0 8px rgba(255,255,255,0.5)' }}
//                         />
//                     </div>
//                     <div className="flex items-center justify-between w-full px-1">
//                         <span className="text-[10px] text-white/80 font-medium font-mono">
//                             {formatTime(videoTime.current)} / {formatTime(videoTime.total)}
//                         </span>
//                         <span className="text-[10px] text-white/60 font-medium font-mono">{Math.round(videoProgress)}%</span>
//                     </div>
//                 </div>

//                 {/* Chat Button */}
//                 <button
//                     onClick={() => {
//                         if (isChatOpen) {
//                             // Closing chat - Do NOT auto-resume. User must click Play.
//                             if (micStatus === 'listening' && recognitionRef.current) {
//                                 recognitionRef.current.stop();
//                             }
//                             setIsChatOpen(false);
//                             console.log('Chat closed. Waiting for manual resume.');
//                         } else {
//                             // Opening chat - pause lecture and enter chat mode
//                             setIsChatOpen(true);
//                             if (videoRef.current?.contentWindow) {
//                                 videoRef.current.contentWindow.postMessage({ type: 'CMD_ENTER_CHAT' }, '*');
//                                 console.log('📤 Sent CMD_ENTER_CHAT (opening chat)');
//                             }
//                         }
//                     }}
//                     className={`w-16 h-16 flex items-center justify-center rounded-full backdrop-blur-md transition-all duration-200 border border-white/10 cursor-pointer group ${isChatOpen ? 'bg-white' : 'bg-white/20 hover:bg-white/30'}`}
//                 >
//                     <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center ${isChatOpen ? 'border-black' : 'border-white'}`}>
//                         <MessageCircle className={`w-6 h-6 ${isChatOpen ? 'text-black' : 'text-white'}`} />
//                     </div>
//                 </button>

//                 {/* Stop Recording Button (Only visible when recording) - Kept small/separate if needed, or integrate? 
//                     User asked for 3 icons. I will keep Stop Recording as a separate specialized button slightly offset if needed, 
//                     OR assume Play/Pause handles flow. But 'stopRecording' is distinct. 
//                     Let's keep the original "Stop" button visible if recording, but maybe styled to match?
//                     For now, I'll place it to the side if recording is active, to not break the 3-icon symmetry. 
//                  */}
//                 {isRecording && (
// =======
//                         <div>
//                             <h1 className="text-gray-900 text-base font-semibold">{location.state?.title || "Lecture"}</h1>
//                             <p className="text-gray-600 text-sm">{location.state?.subject || ""}</p>
//                         </div>
//                     </div>
// >>>>>>> f1f5bcd191d9e60ab0c0ce181b54d5119d125c23
//                     <button
//                         onClick={downloadRecording}
//                         disabled={!recordedBlob}
//                         className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${recordedBlob ? 'bg-gray-800 text-white hover:bg-gray-700' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
//                             }`}
//                     >
//                         <Download size={16} />
//                         Download
//                     </button>
//                 </div>
//             </div>

//             {/* Main Content */}
//             <div className="absolute inset-0 top-20 flex items-center justify-between px-8 py-6">
//                 {/* Left: Avatar & Logo */}
//                 <div className="w-1/3 h-full flex flex-col items-center justify-center gap-8">
//                     <img src="/inai-logo-light.png" alt="INAI" className="w-32 h-auto" />
//                     <Avatar analyserNode={analyserNode} isPlaying={currentState === STATES.SLIDE_PLAYING || currentState === STATES.CHATBOT_ACTIVE} />
//                 </div>

//                 {/* Right: Whiteboard */}
//                 <div className="w-2/3 h-full flex items-center justify-center relative">
//                     <div className="relative w-full h-full">
//                         <img src="/backgrounds/board.png" alt="Board" className="w-full h-5/6 object-contain" style={{ filter: 'drop-shadow(0 8px 30px rgba(0,0,0,0.2))' }} />

//                         {currentSlide && (
//                             <div className="absolute inset-0 flex items-center justify-center">
//                                 <div className="w-4/5 h-4/5 overflow-y-auto p-8">
//                                     {currentSlide.title && (
//                                         <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-3 border-b-2 border-gray-800 text-center">
//                                             {currentSlide.title}
//                                         </h2>
//                                     )}

//                                     {currentSlide.bullets.length > 0 ? (
//                                         <ul className="space-y-3">
//                                             {currentSlide.bullets.map((bullet, i) => (
//                                                 <li key={i} className="relative pl-6 text-gray-800 text-base">
//                                                     <span className="absolute left-0 text-xl font-bold">•</span>
//                                                     {bullet}
//                                                 </li>
//                                             ))}
//                                         </ul>
//                                     ) : currentSlide.narration && (
//                                         <p className="text-gray-800 text-base leading-relaxed">{currentSlide.narration}</p>
//                                     )}
//                                 </div>
//                             </div>
//                         )}
//                     </div>
//                 </div>
//             </div>

//             {/* Controls */}
//             <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-6 z-50">
//                 <button
//                     onClick={() => currentState === STATES.SLIDE_PLAYING ? audioManagerRef.current?.pauseSlideAudio() : playSlide(currentSlideIndex)}
//                     disabled={currentState === STATES.IDLE && lectureData.length === 0}
//                     className="w-16 h-16 flex items-center justify-center rounded-full bg-gray-800 border-2 border-gray-900 hover:bg-gray-700 disabled:opacity-50"
//                 >
//                     {currentState === STATES.SLIDE_PLAYING ? <Pause className="w-6 h-6 text-white" /> : <Play className="w-6 h-6 text-white ml-1" />}
//                 </button>

//                 <button
//                     onClick={() => setIsChatOpen(!isChatOpen)}
//                     className={`w-16 h-16 flex items-center justify-center rounded-full border-2 ${isChatOpen ? 'bg-gray-800 border-gray-900' : 'bg-white border-gray-800'}`}
//                 >
//                     <MessageCircle className={`w-6 h-6 ${isChatOpen ? 'text-white' : 'text-gray-800'}`} />
//                 </button>

//                 {!isRecording && currentState === STATES.IDLE && (
//                     <button onClick={startRecording} className="px-6 py-3 bg-red-500 text-white rounded-full font-semibold hover:bg-red-600">
//                         Start Recording
//                     </button>
//                 )}
//             </div>

//             {/* Progress */}
//             {lectureData.length > 0 && (
//                 <div className="absolute top-24 left-0 right-0 px-6 z-20">
//                     <div className="max-w-2xl mx-auto">
//                         <div className="flex justify-between mb-2 text-sm font-semibold text-gray-800">
//                             <span>Slide {currentSlideIndex + 1} / {lectureData.length}</span>
//                             <span>{Math.round(((currentSlideIndex + 1) / lectureData.length) * 100)}%</span>
//                         </div>
//                         <div className="w-full h-2 bg-gray-200 rounded-full">
//                             <div className="h-full bg-linear-to-r from-blue-500 to-purple-500 rounded-full transition-all" style={{ width: `${((currentSlideIndex + 1) / lectureData.length) * 100}%` }} />
//                         </div>
//                     </div>
//                 </div>
//             )}

//             {/* Question Popup */}
//             <QuestionPopup
//                 isOpen={isQuestionPopupOpen}
//                 onResponse={handleQuestionResponse}
//                 onClose={() => handleQuestionResponse('NO')}
//             />

//             {/* Chatbot */}
//             {isChatOpen && (
//                 <Chatbot
//                     messages={messages}
//                     onSendMessage={(text) => {
//                         setMessages(prev => [...prev, { id: Date.now(), text, sender: "user" }]);
//                         if (socketRef.current?.connected) {
//                             socketRef.current.emit("lecture:chat", {
//                                 lecture_id: location.state?.lectureId?.toString(),
//                                 question: text
//                             });
//                         }
//                     }}
//                     onClose={() => {
//                         setIsChatOpen(false);
//                         setTimeout(() => {
//                             if (currentState === STATES.CHATBOT_ACTIVE) {
//                                 audioManagerRef.current?.resumeSlideAudio();
//                                 setCurrentState(STATES.SLIDE_PLAYING);
//                             }
//                         }, 3000);
//                     }}
//                 />
//             )}
//         </div>
//     );
// }

// export default LectureVideo;






import React, { useEffect, useState, useRef, useCallback } from "react";
import { io } from "socket.io-client";
import { useLocation, useNavigate } from "react-router-dom";
import { X, ChevronLeft, Pause, Play, MessageCircle, Mic, MicOff, SendHorizontal, Download } from "lucide-react";
import axios from "axios";
import { BACKEND_API_URL, handleerror, handlesuccess } from "../../../utils/assets.js";
import Avatar from "./components/Avatar";
import QuestionPopup from "./components/QuestionPopup";
import Chatbot from "./components/Chatbot";
import AudioManager from "./components/AudioManager";

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
    const audioManagerRef = useRef(null);

    // Chat State
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [messages, setMessages] = useState([{ id: 1, text: "Hi, Welcome To Class", sender: "system" }]);
    const socketRef = useRef(null);

    // Recording State
    const [isRecording, setIsRecording] = useState(false);
    const [recordedBlob, setRecordedBlob] = useState(null);
    const mediaRecorderRef = useRef(null);
    const recordedChunksRef = useRef([]);

    // UI State
    const [showControls, setShowControls] = useState(true); // Added to fix UI reference
    const [isUploadEnabled, setIsUploadEnabled] = useState(false); // Added for UI

    // Question Popup State
    const [isQuestionPopupOpen, setIsQuestionPopupOpen] = useState(false);

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

            // Play chatbot audio
            if (data.audio_url && audioManagerRef.current) {
                audioManagerRef.current.playChatbotAudio(data.audio_url);
            }
        });

        return () => {
            if (socketRef.current) socketRef.current.disconnect();
        };
    }, []);

    // Helper: Stop Recording
    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    }, []);

    // Play Slide
    const playSlide = useCallback(async (index) => {
        if (!lectureData[index] || !audioContext) return;

        setCurrentSlideIndex(index);
        setCurrentState(STATES.SLIDE_PLAYING);

        const slide = lectureData[index];
        if (audioManagerRef.current) {
            await audioManagerRef.current.playSlideAudio(slide.audio_url, () => {
                // Slide finished
                if (!slide.isLastSlide) {
                    setCurrentState(STATES.QUESTION_WAIT);
                    setTimeout(() => {
                        setIsQuestionPopupOpen(true);
                    }, 1500);
                } else {
                    setCurrentState(STATES.IDLE);
                    if (isRecording) stopRecording();
                }
            });
        }
    }, [lectureData, audioContext, isRecording, stopRecording]);

    // Handle Question Response
    const handleQuestionResponse = useCallback((response) => {
        setIsQuestionPopupOpen(false);

        if (response === 'YES') {
            setCurrentState(STATES.CHATBOT_ACTIVE);
            setIsChatOpen(true);
            if (audioManagerRef.current) {
                audioManagerRef.current.pauseSlideAudio();
            }
        } else {
            // If NO, continue to next slide
            if (currentSlideIndex < lectureData.length - 1) {
                playSlide(currentSlideIndex + 1);
            } else {
                setCurrentState(STATES.IDLE);
            }
        }
    }, [currentSlideIndex, lectureData.length, playSlide]);


    // Start Recording
    const startRecording = useCallback(async () => {
        try {
            const canvas = document.getElementById('lecture-canvas');
            const canvasStream = canvas.captureStream(30);

            // Get audio stream from AudioContext
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
                setIsUploadEnabled(true);
            };

            recorder.start(1000);
            mediaRecorderRef.current = recorder;
            setIsRecording(true);
            setCurrentState(STATES.RECORDING_ACTIVE);

            // Start first slide
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

    // Handle standard download/upload action
    const handleDownload = () => {
        downloadRecording();
    };

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

    const formatTime = (seconds) => {
        if (!seconds) return "00:00";
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="fixed inset-0 bg-white overflow-hidden">
            {/* Audio Manager */}
            <AudioManager
                ref={audioManagerRef}
                audioContext={audioContext}
                analyserNode={analyserNode}
                onAudioSourceChange={setCurrentAudioSource}
            />

            {/* Main Canvas */}
            <canvas
                id="lecture-canvas"
                className="absolute inset-0 w-full h-full"
                style={{ display: 'none' }}
            />

            {/* Top Bar - Simple Back Button */}
            <div className="absolute top-0 left-0 right-0 z-30 bg-transparent">
                <div className="px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {/* Empty placeholder to maintain layout if needed, or specific back logic */}
                    </div>
                </div>
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

                        {/* Right: Download buttons */}
                        <div className="shrink-0 flex items-center gap-2">
                            <button
                                onClick={() => handleDownload()}
                                disabled={!isUploadEnabled}
                                className={`inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full backdrop-blur-sm transition-all duration-200 text-xs sm:text-sm font-medium ${isUploadEnabled
                                    ? 'bg-white/10 hover:bg-white/20 text-white cursor-pointer'
                                    : 'bg-white/5 text-white/30 cursor-not-allowed'
                                    }`}
                                title={!isUploadEnabled ? "Start recording first to enable download" : "Download recorded lecture"}
                            >
                                <Download size={16} />
                                <span className="hidden sm:inline">Download</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recording Indicator */}
            {isRecording && showControls && (
                <div className="absolute bottom-6 left-6 z-30 flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/90 backdrop-blur-sm">
                    <div className="w-3 h-3 rounded-full bg-white animate-pulse" />
                    <span className="text-white text-sm font-medium">Recording...</span>
                </div>
            )}

            {/* Main Content */}
            <div className="absolute inset-0 top-20 flex items-center justify-between px-8 py-6">
                {/* Left: Avatar & Logo */}
                <div className="w-1/3 h-full flex flex-col items-center justify-center gap-8">
                    <img src="/inai-logo-light.png" alt="INAI" className="w-32 h-auto" />
                    <Avatar analyserNode={analyserNode} isPlaying={currentState === STATES.SLIDE_PLAYING || currentState === STATES.CHATBOT_ACTIVE} />
                </div>

                {/* Right: Whiteboard */}
                <div className="w-2/3 h-full flex items-center justify-center relative">
                    <div className="relative w-full h-full">
                        <img src="/backgrounds/board.png" alt="Board" className="w-full h-5/6 object-contain" style={{ filter: 'drop-shadow(0 8px 30px rgba(0,0,0,0.2))' }} />

                        {currentSlide && (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-4/5 h-4/5 overflow-y-auto p-8">
                                    {currentSlide.title && (
                                        <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-3 border-b-2 border-gray-800 text-center">
                                            {currentSlide.title}
                                        </h2>
                                    )}

                                    {currentSlide.bullets.length > 0 ? (
                                        <ul className="space-y-3">
                                            {currentSlide.bullets.map((bullet, i) => (
                                                <li key={i} className="relative pl-6 text-gray-800 text-base">
                                                    <span className="absolute left-0 text-xl font-bold">•</span>
                                                    {bullet}
                                                </li>
                                            ))}
                                        </ul>
                                    ) : currentSlide.narration && (
                                        <p className="text-gray-800 text-base leading-relaxed">{currentSlide.narration}</p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-6 z-50">
                <button
                    onClick={() => currentState === STATES.SLIDE_PLAYING ? audioManagerRef.current?.pauseSlideAudio() : playSlide(currentSlideIndex)}
                    disabled={currentState === STATES.IDLE && lectureData.length === 0}
                    className="w-16 h-16 flex items-center justify-center rounded-full bg-gray-800 border-2 border-gray-900 hover:bg-gray-700 disabled:opacity-50"
                >
                    {currentState === STATES.SLIDE_PLAYING ? <Pause className="w-6 h-6 text-white" /> : <Play className="w-6 h-6 text-white ml-1" />}
                </button>

                <button
                    onClick={() => setIsChatOpen(!isChatOpen)}
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
                <div className="absolute top-24 left-0 right-0 px-6 z-20">
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
                    onSendMessage={(text) => {
                        setMessages(prev => [...prev, { id: Date.now(), text, sender: "user" }]);
                        if (socketRef.current?.connected) {
                            socketRef.current.emit("lecture:chat", {
                                lecture_id: location.state?.lectureId?.toString(),
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