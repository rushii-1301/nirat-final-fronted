// import React, { useEffect, useState, useRef, useCallback } from "react";
// import { io } from "socket.io-client";
// import { useLocation, useNavigate } from "react-router-dom";
// import { X, ChevronLeft, Pause, Play, MessageCircle, Mic, MicOff, SendHorizontal, Download } from "lucide-react";
// import axios from "axios";
// import { BACKEND_API_URL, handleerror, handlesuccess } from "../../../utils/assets.js";
// // import Avatar from "./components/Avatar";
// import Chatbot from "./components/Chatbot";
// import QuestionPopup from "./components/QuestionPopup";
// import AudioManager from "./components/AudioManager"; // Keeping original import
// import TypingEffect from "./components/TypingEffect";

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
//     const [playbackProgress, setPlaybackProgress] = useState(0);
//     const [slideDuration, setSlideDuration] = useState(0);
//     const progressFrameRef = useRef(null);
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
//                         content_url: slide.content_url || slide.visual_url || slide.image_url || "",
//                         video_url: slide.video_url || "", // Map video_url from backend
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

//     // Progress Tracking Loop
//     useEffect(() => {
//         let animationFrameId;

//         const animateProgress = () => {
//             if (currentState === STATES.SLIDE_PLAYING && slideDuration > 0 && audioManagerRef.current && lectureData[currentSlideIndex]) {
//                 const elapsed = audioManagerRef.current.getSlideElapsed();

//                 // Calculate Total Typing Duration based on char count
//                 const slide = lectureData[currentSlideIndex];
//                 const titleLen = slide.title?.length || 0;
//                 const bulletsLen = slide.bullets.reduce((acc, b) => acc + b.length, 0);
//                 const narrationLen = slide.narration?.length || 0;
//                 const totalChars = titleLen + bulletsLen + narrationLen;

//                 // Fixed speed: 40ms per char, min 2s duration
//                 const typingDuration = Math.max(2, totalChars * 0.04);

//                 const prog = Math.min(elapsed / typingDuration, 1);
//                 setPlaybackProgress(prog);

//                 // Continue loop until AUDIO finishes (elapsed < slideDuration)
//                 if (elapsed < slideDuration) {
//                     animationFrameId = requestAnimationFrame(animateProgress);
//                 } else {
//                     setPlaybackProgress(1); // Ensure final state is 1 on completion
//                 }
//             }
//         };

//         if (currentState === STATES.SLIDE_PLAYING && slideDuration > 0) {
//             animationFrameId = requestAnimationFrame(animateProgress);
//         }

//         return () => {
//             if (animationFrameId) cancelAnimationFrame(animationFrameId);
//         };
//     }, [currentState, slideDuration, currentSlideIndex, lectureData]);

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

//     // Stop Recording (Moved up due to dependency in playSlide)
//     const stopRecording = useCallback(() => {
//         if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
//             mediaRecorderRef.current.stop();
//             setIsRecording(false);
//         }
//     }, []);

//     // Play Slide (Depends on stopRecording)
//     const playSlide = useCallback(async (index) => {
//         if (!lectureData[index] || !audioContext) return;

//         setCurrentSlideIndex(index);
//         setCurrentState(STATES.SLIDE_PLAYING);
//         setPlaybackProgress(0); // Reset progress
//         setSlideDuration(0); // Reset duration to prevent flash of content

//         const slide = lectureData[index];
//         if (audioManagerRef.current) {
//             const { duration } = await audioManagerRef.current.playSlideAudio(slide.audio_url, () => {
//                 // Slide finished
//                 if (progressFrameRef.current) cancelAnimationFrame(progressFrameRef.current);
//                 setPlaybackProgress(1); // Ensure it completes visually

//                 if (!slide.isLastSlide) {
//                     setCurrentState(STATES.QUESTION_WAIT);
//                     setTimeout(() => {
//                         setIsQuestionPopupOpen(true);
//                     }, 1500);
//                 } else {
//                     setCurrentState(STATES.IDLE);
//                     if (isRecording) stopRecording();
//                 }
//             }) || { duration: 0 };

//             setSlideDuration(duration || 0);
//         }
//     }, [lectureData, audioContext, isRecording, stopRecording, currentState]);

//     // Handle Question Response
//     const handleQuestionResponse = useCallback((response) => {
//         // 1. Just close the popup
//         setIsQuestionPopupOpen(false);

//         // 2. Only do something if the answer is YES
//         if (response === 'YES') {
//             setCurrentState(STATES.CHATBOT_ACTIVE);
//             setIsChatOpen(true);
//             if (audioManagerRef.current) {
//                 audioManagerRef.current.pauseSlideAudio();
//             }
//         } else {
//             // 3. User said NO or Timeout
//             if (currentState === STATES.SLIDE_PAUSED) {
//                 // If we were paused manually, RESUME
//                 audioManagerRef.current?.resumeSlideAudio();
//                 setCurrentState(STATES.SLIDE_PLAYING);
//             } else {
//                 // Normal end-of-slide Question -> Auto-advance to next slide
//                 if (currentSlideIndex < lectureData.length - 1) {
//                     playSlide(currentSlideIndex + 1);
//                 } else {
//                     // Last slide finished
//                     setCurrentState(STATES.IDLE);
//                     if (isRecording) stopRecording();
//                 }
//             }
//         }
//     }, [currentState, currentSlideIndex, lectureData.length, playSlide, isRecording, stopRecording]);

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
//             {/* <canvas
//                 id="lecture-canvas"
//                 className="absolute inset-0 w-full h-full"
//                 style={{ display: 'none' }}
//             /> */}

//             {/* Top Bar */}
//             {/* <div className="absolute top-0 left-0 right-0 z-30 bg-white border-b border-gray-200">
//                 <div className="px-6 py-4 flex items-center justify-between">
//                     <div className="flex items-center gap-3">
//                         <button onClick={() => navigate(-1)} className="p-2 rounded-full bg-gray-100 hover:bg-gray-200">
//                             <ChevronLeft size={20} />
//                         </button>
//                         <div>
//                             <h1 className="text-gray-900 text-base font-semibold">{location.state?.title || "Lecture"}</h1>
//                             <p className="text-gray-600 text-sm">{location.state?.subject || ""}</p>
//                         </div>
//                     </div>
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
//             </div> */}

//             {/* Main Content */}
//             <div className="absolute inset-0 flex flex-col items-center justify-between px-8 py-6">
//                 {/* Left: Avatar & Logo */}
//                 <div className="flex flex-col items-center justify-center gap-8">
//                     <img src="/inai-logo-light.png" alt="INAI" className="w-32 h-auto" />
//                     {/* <Avatar analyserNode={analyserNode} isPlaying={currentState === STATES.SLIDE_PLAYING || currentState === STATES.CHATBOT_ACTIVE} /> */}
//                 </div>

//                 {/* Right: Whiteboard */}
//                 <div
//                     className="w-full h-full flex flex-1 items-center justify-center relative"
//                     onClick={(e) => e.stopPropagation()}
//                 >
//                     <div className="flex-1 relative w-full h-full">
//                         {/* <img src="/backgrounds/board.png" alt="Board" className="w-full h-5/6 object-contain" style={{ filter: 'drop-shadow(0 8px 30px rgba(0,0,0,0.2))' }} /> */}

//                         {currentSlide && (
//                             <div className="absolute inset-0 flex items-center justify-center">
//                                 <div className="w-full h-4/5 overflow-y-auto p-8">
//                                     {currentSlide.title && (
//                                         <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-3 border-b-2 border-gray-800 text-center">
//                                             {currentSlide.title}
//                                         </h2>
//                                     )}

//                                     {currentSlide.bullets.length > 0 ? (
//                                         <ul className="space-y-3">
//                                             {currentSlide.bullets.map((bullet, i) => {
//                                                 const totalBullets = currentSlide.bullets.length;
//                                                 const step = 1 / totalBullets;
//                                                 const start = i * step;
//                                                 // Calculate local progress for this specific bullet
//                                                 // If global progress is before this bullet, it's 0.
//                                                 // If after, it's 1.
//                                                 // If inside, it scales 0->1.
//                                                 const localProgress = Math.max(0, Math.min(1, (playbackProgress - start) / step));

//                                                 return (
//                                                     <li key={i} className="relative pl-6 text-gray-800 text-base">
//                                                         <span className="absolute left-0 text-xl font-bold">•</span>
//                                                         <TypingEffect
//                                                             text={bullet}
//                                                             progress={localProgress}
//                                                             isTyping={currentState === STATES.SLIDE_PLAYING && localProgress < 1 && localProgress > 0}
//                                                         />
//                                                     </li>
//                                                 );
//                                             })}
//                                         </ul>
//                                     ) : currentSlide.narration && (
//                                         <div className="text-gray-800 text-base leading-relaxed">
//                                             <TypingEffect
//                                                 text={currentSlide.narration}
//                                                 progress={playbackProgress}
//                                                 isTyping={currentState === STATES.SLIDE_PLAYING}
//                                             />
//                                         </div>
//                                     )}
//                                 </div>
//                             </div>
//                         )}
//                     </div>
//                     {currentSlide?.video_url ? (
//                         <div className="flex-1 w-full h-full flex items-center justify-center p-4">
//                             <video
//                                 src={currentSlide.video_url}
//                                 className="max-w-full max-h-full rounded-lg shadow-lg"
//                                 controls
//                                 autoPlay
//                                 playsInline
//                             >
//                                 Your browser does not support the video tag.
//                             </video>
//                         </div>
//                     ) : currentSlide?.content_url ? (
//                         <div className="flex-1 w-full h-full flex items-center justify-center p-4">
//                             {/* Check if it's an image based on extension */}
//                             {currentSlide.content_url.match(/\.(jpeg|jpg|gif|png|webp)$/i) ? (
//                                 <img
//                                     src={currentSlide.content_url}
//                                     alt="Slide Content"
//                                     className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
//                                 />
//                             ) : (
//                                 /* Fallback for non-image URLs (e.g. YouTube, PDFs) - using iframe */
//                                 <iframe
//                                     src={currentSlide.content_url}
//                                     className="w-full h-full border-0 rounded-lg shadow-lg"
//                                     title="Slide Content"
//                                     allowFullScreen
//                                 />
//                             )}
//                         </div>
//                     ) : (
//                         <div className="flex-1 flex items-center justify-center text-gray-400 font-medium text-lg italic">

//                         </div>
//                     )}
//                 </div>
//             </div>

//             {/* Controls */}
//             <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-6 z-50">
//                 <button
//                     onClick={() => {
//                         // removed debugger as it is not needed
//                         if (currentState === STATES.SLIDE_PLAYING) {
//                             audioManagerRef.current?.pauseSlideAudio();
//                             setCurrentState(STATES.SLIDE_PAUSED);
//                             setIsQuestionPopupOpen(true);
//                         } else {
//                             // If Slide is Paused -> Resume
//                             if (currentState === STATES.SLIDE_PAUSED) {
//                                 audioManagerRef.current?.resumeSlideAudio();
//                                 setCurrentState(STATES.SLIDE_PLAYING);
//                             }
//                             // If Slide Finished -> Next
//                             else if (playbackProgress >= 1 && currentSlideIndex < lectureData.length - 1) {
//                                 playSlide(currentSlideIndex + 1);
//                             }
//                             // Otherwise -> Start/Replay
//                             else {
//                                 playSlide(currentSlideIndex);
//                             }
//                         }
//                     }}
//                     disabled={(currentState === STATES.IDLE && lectureData.length === 0) || (currentState === STATES.SLIDE_PLAYING && slideDuration === 0)}
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
//                 <div className="absolute bottom-26 left-0 right-0 px-6 z-20">
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
















// import React, { useEffect, useState, useRef, useCallback } from "react";
// import { io } from "socket.io-client";
// import { useLocation, useNavigate } from "react-router-dom";
// import { X, ChevronLeft, Pause, Play, MessageCircle, Mic, MicOff, SendHorizontal, Download } from "lucide-react";
// import axios from "axios";
// import { BACKEND_API_URL, handleerror, handlesuccess } from "../../../utils/assets.js";
// import Chatbot from "./components/Chatbot";
// import QuestionPopup from "./components/QuestionPopup";
// import AudioManager from "./components/AudioManager";
// import TypingEffect from "./components/TypingEffect";

// // Load local slide images dynamically
// const localSlideImages = import.meta.glob('../../../assets/Slide*.*', { eager: true });
// const localImagesMap = {};

// Object.keys(localSlideImages).forEach(path => {
//     // Match "SlideX." pattern
//     const match = path.match(/Slide(\d+)\./i);
//     if (match && match[1]) {
//         const index = parseInt(match[1], 10);
//         localImagesMap[index] = localSlideImages[path].default;
//     }
// });

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
//     const [playbackProgress, setPlaybackProgress] = useState(0);
//     const [slideDuration, setSlideDuration] = useState(0);
//     const progressFrameRef = useRef(null);
//     const audioManagerRef = useRef(null);

//     // Video Ref
//     const videoRef = useRef(null);

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
//                         content_url: slide.content_url || slide.visual_url || slide.image_url || "",
//                         video_url: slide.video_url || "",
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

//     // ==========================================================
//     // CRITICAL FIX: VIDEO SYNC LOGIC
//     // ==========================================================
//     useEffect(() => {
//         const videoElement = videoRef.current;

//         if (videoElement) {
//             // Logic Change: Video tabhi play hoga jab:
//             // 1. State 'SLIDE_PLAYING' ho.
//             // 2. slideDuration > 0 ho (Iska matlab Audio fully load ho chuka hai).
//             if (currentState === STATES.SLIDE_PLAYING && slideDuration > 0) {
//                 const playPromise = videoElement.play();
//                 if (playPromise !== undefined) {
//                     playPromise.catch(error => {
//                         console.log("Auto-play prevented (waiting for interaction):", error);
//                     });
//                 }
//             } else {
//                 // Agar paused hai, ya duration 0 hai (loading state), toh pause rakho.
//                 videoElement.pause();
//             }
//         }
//     }, [currentState, slideDuration]); // Depend on slideDuration too!


//     // Fix: Reset video immediately when slide index changes
//     useEffect(() => {
//         if (videoRef.current) {
//             videoRef.current.pause();
//             videoRef.current.currentTime = 0;
//         }
//     }, [currentSlideIndex]);


//     // Progress Tracking Loop (Controls Typing)
//     useEffect(() => {
//         let animationFrameId;

//         const animateProgress = () => {
//             // Note: Text animation also waits for slideDuration > 0
//             if (currentState === STATES.SLIDE_PLAYING && slideDuration > 0 && audioManagerRef.current && lectureData[currentSlideIndex]) {
//                 const elapsed = audioManagerRef.current.getSlideElapsed();

//                 const slide = lectureData[currentSlideIndex];
//                 const titleLen = slide.title?.length || 0;
//                 const bulletsLen = slide.bullets.reduce((acc, b) => acc + b.length, 0);
//                 const narrationLen = slide.narration?.length || 0;
//                 const totalChars = titleLen + bulletsLen + narrationLen;

//                 const typingDuration = Math.max(2, totalChars * 0.04);
//                 const prog = Math.min(elapsed / typingDuration, 1);

//                 setPlaybackProgress(prog);

//                 if (elapsed < slideDuration) {
//                     animationFrameId = requestAnimationFrame(animateProgress);
//                 } else {
//                     setPlaybackProgress(1);
//                 }
//             }
//         };

//         if (currentState === STATES.SLIDE_PLAYING && slideDuration > 0) {
//             animationFrameId = requestAnimationFrame(animateProgress);
//         }

//         return () => {
//             if (animationFrameId) cancelAnimationFrame(animationFrameId);
//         };
//     }, [currentState, slideDuration, currentSlideIndex, lectureData]);

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

//             if (data.audio_url && audioManagerRef.current) {
//                 audioManagerRef.current.playChatbotAudio(data.audio_url);
//             }
//         });

//         return () => {
//             if (socketRef.current) socketRef.current.disconnect();
//         };
//     }, []);

//     const stopRecording = useCallback(() => {
//         if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
//             mediaRecorderRef.current.stop();
//             setIsRecording(false);
//         }
//     }, []);

//     // Play Slide Function
//     const playSlide = useCallback(async (index) => {
//         if (!lectureData[index] || !audioContext) return;

//         setCurrentSlideIndex(index);

//         // 1. Pehle Duration ko 0 karo. Isse video aur text dono ruk jayenge (Wait mode).
//         setSlideDuration(0);
//         setPlaybackProgress(0);

//         // 2. State playing set karo (lekin video nahi chalega kyunki duration 0 hai).
//         setCurrentState(STATES.SLIDE_PLAYING);

//         const slide = lectureData[index];
//         if (audioManagerRef.current) {
//             // 3. Audio load karo (Async wait).
//             const { duration } = await audioManagerRef.current.playSlideAudio(slide.audio_url, () => {
//                 if (progressFrameRef.current) cancelAnimationFrame(progressFrameRef.current);
//                 setPlaybackProgress(1);

//                 if (!slide.isLastSlide) {
//                     setCurrentState(STATES.QUESTION_WAIT);
//                     setTimeout(() => {
//                         setIsQuestionPopupOpen(true);
//                     }, 1500);
//                 } else {
//                     setCurrentState(STATES.IDLE);
//                     if (isRecording) stopRecording();
//                 }
//             }) || { duration: 0 };

//             // 4. Ab Duration set karo. Jaise hi ye set hoga:
//             //    - Video useEffect trigger hoga -> Video Play.
//             //    - AnimateProgress loop start hoga -> Text Typing.
//             //    Donon EXACT same time par start honge.
//             setSlideDuration(duration || 0);
//         }
//     }, [lectureData, audioContext, isRecording, stopRecording, currentState]);

//     // Handle Question Response
//     const handleQuestionResponse = useCallback((response) => {
//         setIsQuestionPopupOpen(false);

//         if (response === 'YES') {
//             setCurrentState(STATES.CHATBOT_ACTIVE);
//             setIsChatOpen(true);
//             if (audioManagerRef.current) {
//                 audioManagerRef.current.pauseSlideAudio();
//             }
//         } else {
//             if (currentState === STATES.SLIDE_PAUSED) {
//                 audioManagerRef.current?.resumeSlideAudio();
//                 setCurrentState(STATES.SLIDE_PLAYING);
//             } else {
//                 if (currentSlideIndex < lectureData.length - 1) {
//                     playSlide(currentSlideIndex + 1);
//                 } else {
//                     setCurrentState(STATES.IDLE);
//                     if (isRecording) stopRecording();
//                 }
//             }
//         }
//     }, [currentState, currentSlideIndex, lectureData.length, playSlide, isRecording, stopRecording]);

//     // Start Recording
//     const startRecording = useCallback(async () => {
//         try {
//             const canvas = document.getElementById('lecture-canvas');
//             const canvasStream = canvas ? canvas.captureStream(30) : null;

//             if (!canvasStream) {
//                 handleerror("Canvas not found for recording");
//                 return;
//             }

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

//             playSlide(0);
//         } catch (error) {
//             console.error("Recording failed:", error);
//             handleerror("Failed to start recording");
//         }
//     }, [audioContext, currentAudioSource, playSlide]);

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

//     return (
//         <div className="fixed inset-0 bg-white overflow-hidden">
//             <AudioManager
//                 ref={audioManagerRef}
//                 audioContext={audioContext}
//                 analyserNode={analyserNode}
//                 onAudioSourceChange={setCurrentAudioSource}
//             />

//             <div className="absolute inset-0 flex flex-col items-center justify-between px-8 py-6">
//                 <div className="flex flex-col items-center justify-center gap-8">
//                     <img src="/inai-logo-light.png" alt="INAI" className="w-32 h-auto" />
//                 </div>

//                 <div
//                     className="w-full h-full flex flex-1 items-center justify-center relative"
//                     onClick={(e) => e.stopPropagation()}
//                 >
//                     <div className="flex-1 relative w-full h-full">

//                         {currentSlide && (
//                             <div className="absolute inset-0 flex items-center justify-center">
//                                 <div className="w-full h-4/5 overflow-y-auto p-8">
//                                     {currentSlide.title && (
//                                         <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-3 border-b-2 border-gray-800 text-center">
//                                             {currentSlide.title}
//                                         </h2>
//                                     )}

//                                     {currentSlide.bullets.length > 0 ? (
//                                         <ul className="space-y-3">
//                                             {currentSlide.bullets.map((bullet, i) => {
//                                                 const totalBullets = currentSlide.bullets.length;
//                                                 const step = 1 / totalBullets;
//                                                 const start = i * step;
//                                                 const localProgress = Math.max(0, Math.min(1, (playbackProgress - start) / step));

//                                                 return (
//                                                     <li key={i} className="relative pl-6 text-gray-800 text-base">
//                                                         <span className="absolute left-0 text-xl font-bold">•</span>
//                                                         <TypingEffect
//                                                             text={bullet}
//                                                             progress={localProgress}
//                                                             isTyping={currentState === STATES.SLIDE_PLAYING && localProgress < 1 && localProgress > 0}
//                                                         />
//                                                     </li>
//                                                 );
//                                             })}
//                                         </ul>
//                                     ) : currentSlide.narration && (
//                                         <div className="text-gray-800 text-base leading-relaxed">
//                                             <TypingEffect
//                                                 text={currentSlide.narration}
//                                                 progress={playbackProgress}
//                                                 isTyping={currentState === STATES.SLIDE_PLAYING}
//                                             />
//                                         </div>
//                                     )}
//                                 </div>
//                             </div>
//                         )}
//                     </div>

//                     {/* Video and Content Logic */}

//                     {currentSlide?.video_url ? (
//                         <div className="flex-1 w-full h-full flex items-center justify-center p-4">
//                             <video
//                                 ref={videoRef}
//                                 src={currentSlide.video_url}
//                                 className="max-w-full max-h-full rounded-lg shadow-lg"
//                                 controls={false}
//                                 muted={true}
//                                 playsInline
//                             >
//                                 Your browser does not support the video tag.
//                             </video>
//                         </div>
//                     ) : (localImagesMap[currentSlideIndex + 1] || currentSlide?.content_url) ? (
//                         <div className={`flex-1 w-full h-full flex items-center justify-center transition-opacity duration-700 ${currentState === STATES.SLIDE_PLAYING || playbackProgress > 0 ? 'opacity-100' : 'opacity-0'}`}>
//                             {/* Priority: Local Image -> Remote Image -> Remote Iframe */}
//                             {(localImagesMap[currentSlideIndex + 1] || currentSlide.content_url).match(/\.(jpeg|jpg|gif|png|webp)($|\?)/i) ? (
//                                 <img
//                                     src={localImagesMap[currentSlideIndex + 1] || currentSlide.content_url}
//                                     alt="Slide Content"
//                                     className="w-full h-min rounded-lg shadow-lg"
//                                 />
//                             ) : (
//                                 <iframe
//                                     src={currentSlide.content_url}
//                                     className="w-full h-full border-0 rounded-lg shadow-lg"
//                                     title="Slide Content"
//                                     allowFullScreen
//                                 />
//                             )}
//                         </div>
//                     ) : (
//                         <div className="flex-1 flex items-center justify-center text-gray-400 font-medium text-lg italic">
//                         </div>
//                     )}
//                 </div>
//             </div>

//             <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-6 z-50">
//                 <button
//                     onClick={() => {
//                         if (currentState === STATES.SLIDE_PLAYING) {
//                             audioManagerRef.current?.pauseSlideAudio();
//                             setCurrentState(STATES.SLIDE_PAUSED);
//                             setIsQuestionPopupOpen(true);
//                         } else {
//                             if (currentState === STATES.SLIDE_PAUSED) {
//                                 audioManagerRef.current?.resumeSlideAudio();
//                                 setCurrentState(STATES.SLIDE_PLAYING);
//                             }
//                             else if (playbackProgress >= 1 && currentSlideIndex < lectureData.length - 1) {
//                                 playSlide(currentSlideIndex + 1);
//                             }
//                             else {
//                                 playSlide(currentSlideIndex);
//                             }
//                         }
//                     }}
//                     disabled={(currentState === STATES.IDLE && lectureData.length === 0) || (currentState === STATES.SLIDE_PLAYING && slideDuration === 0)}
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

//             {lectureData.length > 0 && (
//                 <div className="absolute bottom-26 left-0 right-0 px-6 z-20">
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

//             <QuestionPopup
//                 isOpen={isQuestionPopupOpen}
//                 onResponse={handleQuestionResponse}
//                 onClose={() => handleQuestionResponse('NO')}
//             />

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




















// import React, { useEffect, useState, useRef, useCallback } from "react";
// import { io } from "socket.io-client";
// import { useLocation, useNavigate } from "react-router-dom";
// import { Pause, Play, MessageCircle } from "lucide-react";
// import axios from "axios";
// import { BACKEND_API_URL, handleerror, handlesuccess } from "../../../utils/assets.js";
// import Chatbot from "./components/Chatbot";
// import QuestionPopup from "./components/QuestionPopup";
// import AudioManager from "./components/AudioManager";
// import TypingEffect from "./components/TypingEffect";

// // Load local slide images dynamically
// const localSlideImages = import.meta.glob('../../../assets/Slide*.*', { eager: true });
// const localImagesMap = {};

// Object.keys(localSlideImages).forEach(path => {
//     const match = path.match(/Slide(\d+)\./i);
//     if (match && match[1]) {
//         const index = parseInt(match[1], 10);
//         localImagesMap[index] = localSlideImages[path].default;
//     }
// });

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

//     // Audio & Timer Refs (Stability Fixes)
//     const [audioContext, setAudioContext] = useState(null);
//     const [analyserNode, setAnalyserNode] = useState(null);
//     const [currentAudioSource, setCurrentAudioSource] = useState(null);
//     const [playbackProgress, setPlaybackProgress] = useState(0);
//     const [slideDuration, setSlideDuration] = useState(0);

//     const progressFrameRef = useRef(null);
//     const audioManagerRef = useRef(null);
//     const timerRef = useRef(null); // Timeout cleanup
//     const activeSlideRef = useRef(-1); // Race condition fix

//     const videoRef = useRef(null);

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
//             if (ctx.state !== 'closed') ctx.close();
//             if (timerRef.current) clearTimeout(timerRef.current);
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
//                         content_url: slide.content_url || slide.visual_url || slide.image_url || "",
//                         video_url: slide.video_url || "",
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

//     // Video Sync
//     useEffect(() => {
//         const videoElement = videoRef.current;
//         if (videoElement) {
//             if (currentState === STATES.SLIDE_PLAYING && slideDuration > 0) {
//                 videoElement.play().catch(e => console.log("Autoplay blocked", e));
//             } else {
//                 videoElement.pause();
//             }
//         }
//     }, [currentState, slideDuration]);

//     useEffect(() => {
//         if (videoRef.current) {
//             videoRef.current.pause();
//             videoRef.current.currentTime = 0;
//         }
//     }, [currentSlideIndex]);

//     // Progress Animation
//     useEffect(() => {
//         let animationFrameId;
//         const animateProgress = () => {
//             if (currentState === STATES.SLIDE_PLAYING && slideDuration > 0 && audioManagerRef.current && lectureData[currentSlideIndex]) {
//                 const elapsed = audioManagerRef.current.getSlideElapsed();
//                 const slide = lectureData[currentSlideIndex];

//                 // Typing calculation
//                 const titleLen = slide.title?.length || 0;
//                 const bulletsLen = slide.bullets.reduce((acc, b) => acc + b.length, 0);
//                 const narrationLen = slide.narration?.length || 0;
//                 const totalChars = titleLen + bulletsLen + narrationLen;
//                 const typingDuration = Math.max(2, totalChars * 0.04);

//                 const prog = Math.min(elapsed / typingDuration, 1);
//                 setPlaybackProgress(prog);

//                 if (elapsed < slideDuration) {
//                     animationFrameId = requestAnimationFrame(animateProgress);
//                 } else {
//                     setPlaybackProgress(1);
//                 }
//             }
//         };

//         if (currentState === STATES.SLIDE_PLAYING && slideDuration > 0) {
//             animationFrameId = requestAnimationFrame(animateProgress);
//         }

//         return () => {
//             if (animationFrameId) cancelAnimationFrame(animationFrameId);
//         };
//     }, [currentState, slideDuration, currentSlideIndex, lectureData]);

//     // Socket Setup
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

//             if (data.audio_url && audioManagerRef.current) {
//                 audioManagerRef.current.playChatbotAudio(data.audio_url);
//             }
//         });

//         return () => {
//             if (socketRef.current) socketRef.current.disconnect();
//         };
//     }, []);

//     const stopRecording = useCallback(() => {
//         if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
//             mediaRecorderRef.current.stop();
//             setIsRecording(false);
//         }
//     }, []);

//     // ------------------------------------------------
//     // playSlide: Handles Playing & Auto-Stop Logic
//     // ------------------------------------------------
//     const playSlide = useCallback(async (index) => {
//         if (!lectureData[index] || !audioContext) return;

//         // Cleanup previous timers
//         if (timerRef.current) {
//             clearTimeout(timerRef.current);
//             timerRef.current = null;
//         }

//         // Set Active Slide Ref to prevent race conditions
//         activeSlideRef.current = index;

//         setCurrentSlideIndex(index);
//         setSlideDuration(0);
//         setPlaybackProgress(0);
//         setCurrentState(STATES.SLIDE_PLAYING);

//         if (videoRef.current) {
//             videoRef.current.pause();
//             videoRef.current.currentTime = 0;
//         }

//         const slide = lectureData[index];

//         if (audioManagerRef.current) {
//             const { duration } = await audioManagerRef.current.playSlideAudio(slide.audio_url, () => {
//                 // --- ON AUDIO END ---
//                 if (activeSlideRef.current !== index) return; // Ignore if user switched

//                 if (progressFrameRef.current) cancelAnimationFrame(progressFrameRef.current);
//                 setPlaybackProgress(1);

//                 // Stop Video Logic
//                 if (videoRef.current) videoRef.current.pause();

//                 if (!slide.isLastSlide) {
//                     // Slide Khatam -> Wait Mode (Video Stopped)
//                     setCurrentState(STATES.QUESTION_WAIT);

//                     // Show Popup automatically
//                     timerRef.current = setTimeout(() => {
//                         if (activeSlideRef.current === index) {
//                             setIsQuestionPopupOpen(true);
//                         }
//                     }, 500); // Small delay before popup
//                 } else {
//                     setCurrentState(STATES.IDLE);
//                     if (isRecording) stopRecording();
//                 }
//             }) || { duration: 0 };

//             if (activeSlideRef.current === index) {
//                 setSlideDuration(duration || 0);
//             }
//         }
//     }, [lectureData, audioContext, isRecording, stopRecording]);


//     // ------------------------------------------------
//     // Logic for YES/NO Question
//     // ------------------------------------------------
//     const handleQuestionResponse = useCallback((response) => {
//         setIsQuestionPopupOpen(false);

//         const slide = lectureData[currentSlideIndex];

//         if (response === 'YES') {
//             // 1. Chatbot Open Karo
//             setCurrentState(STATES.CHATBOT_ACTIVE);
//             setIsChatOpen(true);
//             if (audioManagerRef.current) audioManagerRef.current.pauseSlideAudio();

//             // 2. Question Auto-send karo Chatbot ko
//             if (slide && slide.question) {
//                 const questionText = slide.question;

//                 // UI update
//                 setMessages(prev => [...prev, { id: Date.now(), text: questionText, sender: "user" }]);

//                 // Backend call
//                 if (socketRef.current?.connected) {
//                     socketRef.current.emit("lecture:chat", {
//                         lecture_id: location.state?.lectureId?.toString(),
//                         question: questionText
//                     });
//                 }
//             }

//         } else {
//             // NO clicked: Move to Next Slide
//             const nextIndex = currentSlideIndex + 1;
//             if (nextIndex < lectureData.length) {
//                 playSlide(nextIndex);
//             } else {
//                 setCurrentState(STATES.IDLE);
//                 if (isRecording) stopRecording();
//             }
//         }
//     }, [currentState, currentSlideIndex, lectureData, playSlide, isRecording, stopRecording, location.state]);

//     // Start Recording Logic
//     const startRecording = useCallback(async () => {
//         try {
//             const canvas = document.getElementById('lecture-canvas');
//             const canvasStream = canvas ? canvas.captureStream(30) : null; // Logic assumes canvas exists somewhere or is irrelevant

//             // NOTE: Recording logic kept as is from original, assuming canvas setup exists elsewhere in DOM
//             // If strictly audio recording is needed, modify here. 
//             // For now, keeping your original recording flow.

//             // ... (Keeping original recording setup for brevity, assuming it works for you)
//             const audioDestination = audioContext.createMediaStreamDestination();
//             if (currentAudioSource) currentAudioSource.connect(audioDestination);

//             // Mock stream if canvas missing for this snippet context
//             const stream = canvasStream || audioDestination.stream;

//             const recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9,opus' });

//             recorder.ondataavailable = (e) => {
//                 if (e.data.size > 0) recordedChunksRef.current.push(e.data);
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
//             playSlide(0);
//         } catch (error) {
//             console.error("Recording error", error);
//         }
//     }, [audioContext, currentAudioSource, playSlide]);

//     const currentSlide = lectureData[currentSlideIndex];

//     if (isLoading) return <div className="fixed inset-0 bg-white flex items-center justify-center">Loading...</div>;
//     if (pageError) return <div className="fixed inset-0 bg-white flex items-center justify-center">{pageError}</div>;

//     return (
//         <div className="fixed inset-0 bg-white overflow-hidden">
//             <AudioManager
//                 ref={audioManagerRef}
//                 audioContext={audioContext}
//                 analyserNode={analyserNode}
//                 onAudioSourceChange={setCurrentAudioSource}
//             />

//             {/* --- Main Content Area --- */}
//             <div className="absolute inset-0 flex flex-col items-center justify-between px-8 py-6">
//                 <div className="flex flex-col items-center justify-center gap-8">
//                     <img src="/inai-logo-light.png" alt="INAI" className="w-32 h-auto" />
//                 </div>

//                 <div className="w-full h-full flex flex-1 items-center justify-center relative">
//                     <div className="flex-1 relative w-full h-full">
//                         {currentSlide && (
//                             <div className="absolute inset-0 flex items-center justify-center">
//                                 {/* Slide Text Content */}
//                                 <div className="w-full h-4/5 overflow-y-auto p-8">
//                                     {currentSlide.title && <h2 className="text-2xl font-bold mb-6">{currentSlide.title}</h2>}
//                                     {currentSlide.bullets.length > 0 ? (
//                                         <ul className="space-y-3">
//                                             {currentSlide.bullets.map((bullet, i) => (
//                                                 <li key={i} className="text-lg">
//                                                     • <TypingEffect
//                                                         text={bullet}
//                                                         progress={playbackProgress}
//                                                         isTyping={currentState === STATES.SLIDE_PLAYING}
//                                                     />
//                                                 </li>
//                                             ))}
//                                         </ul>
//                                     ) : (
//                                         <TypingEffect text={currentSlide.narration} progress={playbackProgress} isTyping={currentState === STATES.SLIDE_PLAYING} />
//                                     )}
//                                 </div>
//                             </div>
//                         )}
//                     </div>

//                     {/* Visual Content (Image/Video) */}
//                     <div className="flex-1 w-full h-full flex items-center justify-center p-4">
//                         {currentSlide?.video_url ? (
//                             <video ref={videoRef} src={currentSlide.video_url} className="rounded-lg shadow-lg" muted playsInline />
//                         ) : (
//                             <img src={localImagesMap[currentSlideIndex + 1] || currentSlide?.content_url} className="rounded-lg shadow-lg max-h-full" alt="Slide" />
//                         )}
//                     </div>
//                 </div>
//             </div>

//             {/* --- Controls --- */}
//             <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-6 z-50">
//                 {/* <button
//                     onClick={() => {
//                         // STRICT PLAY LOGIC:
//                         // User manually slide change nahi kar sakta (No `playSlide(index+1)` here).
//                         // Sirf Play/Pause allowed hai current slide ke liye.

//                         if (currentState === STATES.IDLE) {
//                             playSlide(0); // Start from beginning
//                         } else if (currentState === STATES.SLIDE_PLAYING) {
//                             audioManagerRef.current?.pauseSlideAudio();
//                             setCurrentState(STATES.SLIDE_PAUSED);
//                         } else if (currentState === STATES.SLIDE_PAUSED) {
//                             audioManagerRef.current?.resumeSlideAudio();
//                             setCurrentState(STATES.SLIDE_PLAYING);
//                         }
//                     }}
//                     // Disable button if waiting for Question Answer
//                     disabled={currentState === STATES.QUESTION_WAIT}
//                     className={`w-16 h-16 flex items-center justify-center rounded-full border-2 border-gray-900 ${currentState === STATES.QUESTION_WAIT ? 'opacity-50 cursor-not-allowed bg-gray-400' : 'bg-gray-800 hover:bg-gray-700'}`}
//                 >
//                     {currentState === STATES.SLIDE_PLAYING ? <Pause className="w-6 h-6 text-white" /> : <Play className="w-6 h-6 text-white ml-1" />}
//                 </button> */}

//                 <button
//                     onClick={() => {
//                         if (currentState === STATES.SLIDE_PLAYING) {
//                             audioManagerRef.current?.pauseSlideAudio();
//                             setCurrentState(STATES.SLIDE_PAUSED);
//                             setIsQuestionPopupOpen(true);
//                         } else {
//                             if (currentState === STATES.SLIDE_PAUSED) {
//                                 audioManagerRef.current?.resumeSlideAudio();
//                                 setCurrentState(STATES.SLIDE_PLAYING);
//                             }
//                             else if (playbackProgress >= 1 && currentSlideIndex < lectureData.length - 1) {
//                                 playSlide(currentSlideIndex + 1);
//                             }
//                             else {
//                                 playSlide(currentSlideIndex);
//                             }
//                         }
//                     }}
//                     disabled={(currentState === STATES.IDLE && lectureData.length === 0) || (currentState === STATES.SLIDE_PLAYING && slideDuration === 0)}
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
//             </div>

//             {/* Progress Bar */}
//             {lectureData.length > 0 && (
//                 <div className="absolute bottom-26 left-0 right-0 px-6 z-20">
//                     <div className="max-w-2xl mx-auto">
//                         <div className="w-full h-2 bg-gray-200 rounded-full">
//                             <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${((currentSlideIndex + 1) / lectureData.length) * 100}%` }} />
//                         </div>
//                     </div>
//                 </div>
//             )}

//             <QuestionPopup
//                 isOpen={isQuestionPopupOpen}
//                 onResponse={handleQuestionResponse}
//                 onClose={() => handleQuestionResponse('NO')}
//             />

//             {isChatOpen && (
//                 <Chatbot
//                     messages={messages}
//                     onSendMessage={(text) => {
//                         setMessages(prev => [...prev, { id: Date.now(), text, sender: "user" }]);
//                         socketRef.current?.emit("lecture:chat", {
//                             lecture_id: location.state?.lectureId?.toString(),
//                             question: text
//                         });
//                     }}
//                     onClose={() => {
//                         setIsChatOpen(false);
//                         // User ke question pure hone ke baad, Next slide play karni hai
//                         const nextIndex = currentSlideIndex + 1;
//                         if (nextIndex < lectureData.length) {
//                             playSlide(nextIndex);
//                         } else {
//                             setCurrentState(STATES.IDLE);
//                         }
//                     }}
//                 />
//             )}
//         </div>
//     );
// }

// export default LectureVideo;



















// import React, { useEffect, useState, useRef, useCallback } from "react";
// import { io } from "socket.io-client";
// import { useLocation, useNavigate } from "react-router-dom";
// import { X, ChevronLeft, Pause, Play, MessageCircle, Mic, MicOff, SendHorizontal, Download } from "lucide-react";
// import axios from "axios";
// import { BACKEND_API_URL, handleerror, handlesuccess } from "../../../utils/assets.js";
// // import Avatar from "./components/Avatar";
// import Chatbot from "./components/Chatbot";
// import QuestionPopup from "./components/QuestionPopup";
// import AudioManager from "./components/AudioManager"; // Keeping original import
// import TypingEffect from "./components/TypingEffect";

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
//     const [playbackProgress, setPlaybackProgress] = useState(0);
//     const [slideDuration, setSlideDuration] = useState(0);
//     const progressFrameRef = useRef(null);
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
//                         content_url: slide.content_url || slide.visual_url || slide.image_url || "",
//                         video_url: slide.video_url || "", // Map video_url from backend
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

//     // Progress Tracking Loop
//     useEffect(() => {
//         let animationFrameId;

//         const animateProgress = () => {
//             if (currentState === STATES.SLIDE_PLAYING && slideDuration > 0 && audioManagerRef.current && lectureData[currentSlideIndex]) {
//                 const elapsed = audioManagerRef.current.getSlideElapsed();

//                 // Calculate Total Typing Duration based on char count
//                 const slide = lectureData[currentSlideIndex];
//                 const titleLen = slide.title?.length || 0;
//                 const bulletsLen = slide.bullets.reduce((acc, b) => acc + b.length, 0);
//                 const narrationLen = slide.narration?.length || 0;
//                 const totalChars = titleLen + bulletsLen + narrationLen;

//                 // Fixed speed: 40ms per char, min 2s duration
//                 const typingDuration = Math.max(2, totalChars * 0.04);

//                 const prog = Math.min(elapsed / typingDuration, 1);
//                 setPlaybackProgress(prog);

//                 // Continue loop until AUDIO finishes (elapsed < slideDuration)
//                 if (elapsed < slideDuration) {
//                     animationFrameId = requestAnimationFrame(animateProgress);
//                 } else {
//                     setPlaybackProgress(1); // Ensure final state is 1 on completion
//                 }
//             }
//         };

//         if (currentState === STATES.SLIDE_PLAYING && slideDuration > 0) {
//             animationFrameId = requestAnimationFrame(animateProgress);
//         }

//         return () => {
//             if (animationFrameId) cancelAnimationFrame(animationFrameId);
//         };
//     }, [currentState, slideDuration, currentSlideIndex, lectureData]);

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

//     // Stop Recording (Moved up due to dependency in playSlide)
//     const stopRecording = useCallback(() => {
//         if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
//             mediaRecorderRef.current.stop();
//             setIsRecording(false);
//         }
//     }, []);

//     // Play Slide (Depends on stopRecording)
//     const playSlide = useCallback(async (index) => {
//         if (!lectureData[index] || !audioContext) return;

//         setCurrentSlideIndex(index);
//         setCurrentState(STATES.SLIDE_PLAYING);
//         setPlaybackProgress(0); // Reset progress
//         setSlideDuration(0); // Reset duration to prevent flash of content

//         const slide = lectureData[index];
//         if (audioManagerRef.current) {
//             const { duration } = await audioManagerRef.current.playSlideAudio(slide.audio_url, () => {
//                 // Slide finished
//                 if (progressFrameRef.current) cancelAnimationFrame(progressFrameRef.current);
//                 setPlaybackProgress(1); // Ensure it completes visually

//                 if (!slide.isLastSlide) {
//                     setCurrentState(STATES.QUESTION_WAIT);
//                     setTimeout(() => {
//                         setIsQuestionPopupOpen(true);
//                     }, 1500);
//                 } else {
//                     setCurrentState(STATES.IDLE);
//                     if (isRecording) stopRecording();
//                 }
//             }) || { duration: 0 };

//             setSlideDuration(duration || 0);
//         }
//     }, [lectureData, audioContext, isRecording, stopRecording, currentState]);

//     // Handle Question Response
//     const handleQuestionResponse = useCallback((response) => {
//         // 1. Just close the popup
//         setIsQuestionPopupOpen(false);

//         // 2. Only do something if the answer is YES
//         if (response === 'YES') {
//             setCurrentState(STATES.CHATBOT_ACTIVE);
//             setIsChatOpen(true);
//             if (audioManagerRef.current) {
//                 audioManagerRef.current.pauseSlideAudio();
//             }
//         } else {
//             // 3. User said NO or Timeout
//             if (currentState === STATES.SLIDE_PAUSED) {
//                 // If we were paused manually, RESUME
//                 audioManagerRef.current?.resumeSlideAudio();
//                 setCurrentState(STATES.SLIDE_PLAYING);
//             } else {
//                 // Normal end-of-slide Question -> Auto-advance to next slide
//                 if (currentSlideIndex < lectureData.length - 1) {
//                     playSlide(currentSlideIndex + 1);
//                 } else {
//                     // Last slide finished
//                     setCurrentState(STATES.IDLE);
//                     if (isRecording) stopRecording();
//                 }
//             }
//         }
//     }, [currentState, currentSlideIndex, lectureData.length, playSlide, isRecording, stopRecording]);

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
//             {/* <canvas
//                 id="lecture-canvas"
//                 className="absolute inset-0 w-full h-full"
//                 style={{ display: 'none' }}
//             /> */}

//             {/* Top Bar */}
//             {/* <div className="absolute top-0 left-0 right-0 z-30 bg-white border-b border-gray-200">
//                 <div className="px-6 py-4 flex items-center justify-between">
//                     <div className="flex items-center gap-3">
//                         <button onClick={() => navigate(-1)} className="p-2 rounded-full bg-gray-100 hover:bg-gray-200">
//                             <ChevronLeft size={20} />
//                         </button>
//                         <div>
//                             <h1 className="text-gray-900 text-base font-semibold">{location.state?.title || "Lecture"}</h1>
//                             <p className="text-gray-600 text-sm">{location.state?.subject || ""}</p>
//                         </div>
//                     </div>
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
//             </div> */}

//             {/* Main Content */}
//             <div className="absolute inset-0 flex flex-col items-center justify-between px-8 py-6">
//                 {/* Left: Avatar & Logo */}
//                 <div className="flex flex-col items-center justify-center gap-8">
//                     <img src="/inai-logo-light.png" alt="INAI" className="w-32 h-auto" />
//                     {/* <Avatar analyserNode={analyserNode} isPlaying={currentState === STATES.SLIDE_PLAYING || currentState === STATES.CHATBOT_ACTIVE} /> */}
//                 </div>

//                 {/* Right: Whiteboard */}
//                 <div
//                     className="w-full h-full flex flex-1 items-center justify-center relative"
//                     onClick={(e) => e.stopPropagation()}
//                 >
//                     <div className="flex-1 relative w-full h-full">
//                         {/* <img src="/backgrounds/board.png" alt="Board" className="w-full h-5/6 object-contain" style={{ filter: 'drop-shadow(0 8px 30px rgba(0,0,0,0.2))' }} /> */}

//                         {currentSlide && (
//                             <div className="absolute inset-0 flex items-center justify-center">
//                                 <div className="w-full h-4/5 overflow-y-auto p-8">
//                                     {currentSlide.title && (
//                                         <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-3 border-b-2 border-gray-800 text-center">
//                                             {currentSlide.title}
//                                         </h2>
//                                     )}

//                                     {currentSlide.bullets.length > 0 ? (
//                                         <ul className="space-y-3">
//                                             {currentSlide.bullets.map((bullet, i) => {
//                                                 const totalBullets = currentSlide.bullets.length;
//                                                 const step = 1 / totalBullets;
//                                                 const start = i * step;
//                                                 // Calculate local progress for this specific bullet
//                                                 // If global progress is before this bullet, it's 0.
//                                                 // If after, it's 1.
//                                                 // If inside, it scales 0->1.
//                                                 const localProgress = Math.max(0, Math.min(1, (playbackProgress - start) / step));

//                                                 return (
//                                                     <li key={i} className="relative pl-6 text-gray-800 text-base">
//                                                         <span className="absolute left-0 text-xl font-bold">•</span>
//                                                         <TypingEffect
//                                                             text={bullet}
//                                                             progress={localProgress}
//                                                             isTyping={currentState === STATES.SLIDE_PLAYING && localProgress < 1 && localProgress > 0}
//                                                         />
//                                                     </li>
//                                                 );
//                                             })}
//                                         </ul>
//                                     ) : currentSlide.narration && (
//                                         <div className="text-gray-800 text-base leading-relaxed">
//                                             <TypingEffect
//                                                 text={currentSlide.narration}
//                                                 progress={playbackProgress}
//                                                 isTyping={currentState === STATES.SLIDE_PLAYING}
//                                             />
//                                         </div>
//                                     )}
//                                 </div>
//                             </div>
//                         )}
//                     </div>
//                     {currentSlide?.video_url ? (
//                         <div className="flex-1 w-full h-full flex items-center justify-center p-4">
//                             <video
//                                 src={currentSlide.video_url}
//                                 className="max-w-full max-h-full rounded-lg shadow-lg"
//                                 controls
//                                 autoPlay
//                                 playsInline
//                             >
//                                 Your browser does not support the video tag.
//                             </video>
//                         </div>
//                     ) : currentSlide?.content_url ? (
//                         <div className="flex-1 w-full h-full flex items-center justify-center p-4">
//                             {/* Check if it's an image based on extension */}
//                             {currentSlide.content_url.match(/\.(jpeg|jpg|gif|png|webp)$/i) ? (
//                                 <img
//                                     src={currentSlide.content_url}
//                                     alt="Slide Content"
//                                     className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
//                                 />
//                             ) : (
//                                 /* Fallback for non-image URLs (e.g. YouTube, PDFs) - using iframe */
//                                 <iframe
//                                     src={currentSlide.content_url}
//                                     className="w-full h-full border-0 rounded-lg shadow-lg"
//                                     title="Slide Content"
//                                     allowFullScreen
//                                 />
//                             )}
//                         </div>
//                     ) : (
//                         <div className="flex-1 flex items-center justify-center text-gray-400 font-medium text-lg italic">
//                             No visual content
//                         </div>
//                     )}
//                 </div>
//             </div>

//             {/* Controls */}
//             <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-6 z-50">
//                 <button
//                     onClick={() => {
//                         // removed debugger as it is not needed
//                         if (currentState === STATES.SLIDE_PLAYING) {
//                             audioManagerRef.current?.pauseSlideAudio();
//                             setCurrentState(STATES.SLIDE_PAUSED);
//                             setIsQuestionPopupOpen(true);
//                         } else {
//                             // If Slide is Paused -> Resume
//                             if (currentState === STATES.SLIDE_PAUSED) {
//                                 audioManagerRef.current?.resumeSlideAudio();
//                                 setCurrentState(STATES.SLIDE_PLAYING);
//                             }
//                             // If Slide Finished -> Next
//                             else if (playbackProgress >= 1 && currentSlideIndex < lectureData.length - 1) {
//                                 playSlide(currentSlideIndex + 1);
//                             }
//                             // Otherwise -> Start/Replay
//                             else {
//                                 playSlide(currentSlideIndex);
//                             }
//                         }
//                     }}
//                     disabled={(currentState === STATES.IDLE && lectureData.length === 0) || (currentState === STATES.SLIDE_PLAYING && slideDuration === 0)}
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
//                 <div className="absolute bottom-26 left-0 right-0 px-6 z-20">
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





















// import React, { useEffect, useState, useRef, useCallback } from "react";
// import { io } from "socket.io-client";
// import { useLocation, useNavigate } from "react-router-dom";
// import { X, ChevronLeft, Pause, Play, MessageCircle, Mic, MicOff, SendHorizontal, Download } from "lucide-react";
// import axios from "axios";
// import { BACKEND_API_URL, handleerror, handlesuccess } from "../../../utils/assets.js";
// // import Avatar from "./components/Avatar";
// import Chatbot from "./components/Chatbot";
// import QuestionPopup from "./components/QuestionPopup";
// import AudioManager from "./components/AudioManager"; // Keeping original import
// import TypingEffect from "./components/TypingEffect";

// // --- ADDED LOGIC START: Local Image Loading ---
// // Load local slide images dynamically
// const localSlideImages = import.meta.glob('../../../assets/Slide*.*', { eager: true });
// const localImagesMap = {};

// Object.keys(localSlideImages).forEach(path => {
//     // Match "SlideX." pattern
//     const match = path.match(/Slide(\d+)\./i);
//     if (match && match[1]) {
//         const index = parseInt(match[1], 10);
//         localImagesMap[index] = localSlideImages[path].default;
//     }
// });
// // --- ADDED LOGIC END ---

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
//     const [playbackProgress, setPlaybackProgress] = useState(0);
//     const [slideDuration, setSlideDuration] = useState(0);
//     const progressFrameRef = useRef(null);
//     const audioManagerRef = useRef(null);

//     // Video Ref (Added ref for video control)
//     const videoRef = useRef(null);

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
//                         content_url: slide.content_url || slide.visual_url || slide.image_url || "",
//                         video_url: slide.video_url || "", // Map video_url from backend
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

//     // Progress Tracking Loop
//     useEffect(() => {
//         let animationFrameId;

//         const animateProgress = () => {
//             if (currentState === STATES.SLIDE_PLAYING && slideDuration > 0 && audioManagerRef.current && lectureData[currentSlideIndex]) {
//                 const elapsed = audioManagerRef.current.getSlideElapsed();

//                 // Calculate Total Typing Duration based on char count
//                 const slide = lectureData[currentSlideIndex];
//                 const titleLen = slide.title?.length || 0;
//                 const bulletsLen = slide.bullets.reduce((acc, b) => acc + b.length, 0);
//                 const narrationLen = slide.narration?.length || 0;
//                 const totalChars = titleLen + bulletsLen + narrationLen;

//                 // Fixed speed: 40ms per char, min 2s duration
//                 const typingDuration = Math.max(2, totalChars * 0.04);

//                 const prog = Math.min(elapsed / typingDuration, 1);
//                 setPlaybackProgress(prog);

//                 // Continue loop until AUDIO finishes (elapsed < slideDuration)
//                 if (elapsed < slideDuration) {
//                     animationFrameId = requestAnimationFrame(animateProgress);
//                 } else {
//                     setPlaybackProgress(1); // Ensure final state is 1 on completion
//                 }
//             }
//         };

//         if (currentState === STATES.SLIDE_PLAYING && slideDuration > 0) {
//             animationFrameId = requestAnimationFrame(animateProgress);
//         }

//         return () => {
//             if (animationFrameId) cancelAnimationFrame(animationFrameId);
//         };
//     }, [currentState, slideDuration, currentSlideIndex, lectureData]);

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

//     // Stop Recording (Moved up due to dependency in playSlide)
//     const stopRecording = useCallback(() => {
//         if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
//             mediaRecorderRef.current.stop();
//             setIsRecording(false);
//         }
//     }, []);

//     // Play Slide (Depends on stopRecording)
//     const playSlide = useCallback(async (index) => {
//         if (!lectureData[index] || !audioContext) return;

//         setCurrentSlideIndex(index);
//         setCurrentState(STATES.SLIDE_PLAYING);
//         setPlaybackProgress(0); // Reset progress
//         setSlideDuration(0); // Reset duration to prevent flash of content

//         const slide = lectureData[index];
//         if (audioManagerRef.current) {
//             const { duration } = await audioManagerRef.current.playSlideAudio(slide.audio_url, () => {
//                 // Slide finished
//                 if (progressFrameRef.current) cancelAnimationFrame(progressFrameRef.current);
//                 setPlaybackProgress(1); // Ensure it completes visually

//                 if (!slide.isLastSlide) {
//                     setCurrentState(STATES.QUESTION_WAIT);
//                     setTimeout(() => {
//                         setIsQuestionPopupOpen(true);
//                     }, 1500);
//                 } else {
//                     setCurrentState(STATES.IDLE);
//                     if (isRecording) stopRecording();
//                 }
//             }) || { duration: 0 };

//             setSlideDuration(duration || 0);
//         }
//     }, [lectureData, audioContext, isRecording, stopRecording, currentState]);

//     // Handle Question Response
//     const handleQuestionResponse = useCallback((response) => {
//         // 1. Just close the popup
//         setIsQuestionPopupOpen(false);

//         // 2. Only do something if the answer is YES
//         if (response === 'YES') {
//             setCurrentState(STATES.CHATBOT_ACTIVE);
//             setIsChatOpen(true);
//             if (audioManagerRef.current) {
//                 audioManagerRef.current.pauseSlideAudio();
//             }
//         } else {
//             // 3. User said NO or Timeout
//             if (currentState === STATES.SLIDE_PAUSED) {
//                 // If we were paused manually, RESUME
//                 audioManagerRef.current?.resumeSlideAudio();
//                 setCurrentState(STATES.SLIDE_PLAYING);
//             } else {
//                 // Normal end-of-slide Question -> Auto-advance to next slide
//                 if (currentSlideIndex < lectureData.length - 1) {
//                     playSlide(currentSlideIndex + 1);
//                 } else {
//                     // Last slide finished
//                     setCurrentState(STATES.IDLE);
//                     if (isRecording) stopRecording();
//                 }
//             }
//         }
//     }, [currentState, currentSlideIndex, lectureData.length, playSlide, isRecording, stopRecording]);

//     // Start Recording
//     const startRecording = useCallback(async () => {
//         try {
//             const canvas = document.getElementById('lecture-canvas');
//             // Check if canvas exists before capturing stream
//             if (!canvas) {
//                 handleerror("Canvas element not found");
//                 return;
//             }
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

//     return (
//         <div className="fixed inset-0 bg-white overflow-hidden">

//             {/* Audio Manager */}
//             <AudioManager
//                 ref={audioManagerRef}
//                 audioContext={audioContext}
//                 analyserNode={analyserNode}
//                 onAudioSourceChange={setCurrentAudioSource}
//             />

//             {/* Main Content */}
//             <div className="absolute inset-0 flex flex-col items-center justify-between px-8 py-6">
//                 {/* Left: Avatar & Logo */}
//                 <div className="flex flex-col items-center justify-center gap-8">
//                     <img src="/inai-logo-light.png" alt="INAI" className="w-32 h-auto" />
//                 </div>

//                 {/* Right: Whiteboard */}
//                 <div
//                     className="w-full h-full flex flex-1 items-center justify-center relative"
//                     onClick={(e) => e.stopPropagation()}
//                 >
//                     <div className="flex-1 relative w-full h-full">

//                         {currentSlide && (
//                             <div className="absolute inset-0 flex items-center justify-center">
//                                 <div className="w-full h-4/5 overflow-y-auto p-8">
//                                     {currentSlide.title && (
//                                         <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-3 border-b-2 border-gray-800 text-center">
//                                             {currentSlide.title}
//                                         </h2>
//                                     )}

//                                     {currentSlide.bullets.length > 0 ? (
//                                         <ul className="space-y-3">
//                                             {currentSlide.bullets.map((bullet, i) => {
//                                                 const totalBullets = currentSlide.bullets.length;
//                                                 const step = 1 / totalBullets;
//                                                 const start = i * step;
//                                                 const localProgress = Math.max(0, Math.min(1, (playbackProgress - start) / step));

//                                                 return (
//                                                     <li key={i} className="relative pl-6 text-gray-800 text-base">
//                                                         <span className="absolute left-0 text-xl font-bold">•</span>
//                                                         <TypingEffect
//                                                             text={bullet}
//                                                             progress={localProgress}
//                                                             isTyping={currentState === STATES.SLIDE_PLAYING && localProgress < 1 && localProgress > 0}
//                                                         />
//                                                     </li>
//                                                 );
//                                             })}
//                                         </ul>
//                                     ) : currentSlide.narration && (
//                                         <div className="text-gray-800 text-base leading-relaxed">
//                                             <TypingEffect
//                                                 text={currentSlide.narration}
//                                                 progress={playbackProgress}
//                                                 isTyping={currentState === STATES.SLIDE_PLAYING}
//                                             />
//                                         </div>
//                                     )}
//                                 </div>
//                             </div>
//                         )}
//                     </div>

//                     {/* --- CHANGED LOGIC START: Video/Image Implementation with Local Map --- */}
//                     {currentSlide?.video_url ? (
//                         <div className="flex-1 w-full h-full flex items-center justify-center p-4">
//                             <video
//                                 ref={videoRef}
//                                 src={currentSlide.video_url}
//                                 className="max-w-full max-h-full rounded-lg shadow-lg"
//                                 controls={false}
//                                 muted={true}
//                                 playsInline
//                             >
//                                 Your browser does not support the video tag.
//                             </video>
//                         </div>
//                     ) : (localImagesMap[currentSlideIndex + 1] || currentSlide?.content_url) ? (
//                         <div className={`flex-1 w-full h-full flex items-center justify-center transition-opacity duration-700 ${currentState === STATES.SLIDE_PLAYING || playbackProgress > 0 ? 'opacity-100' : 'opacity-0'}`}>
//                             {/* Priority: Local Image -> Remote Image -> Remote Iframe */}
//                             {(localImagesMap[currentSlideIndex + 1] || currentSlide.content_url).match(/\.(jpeg|jpg|gif|png|webp)($|\?)/i) ? (
//                                 <img
//                                     src={localImagesMap[currentSlideIndex + 1] || currentSlide.content_url}
//                                     alt="Slide Content"
//                                     className="w-full h-min rounded-lg shadow-lg"
//                                 />
//                             ) : (
//                                 <iframe
//                                     src={currentSlide.content_url}
//                                     className="w-full h-full border-0 rounded-lg shadow-lg"
//                                     title="Slide Content"
//                                     allowFullScreen
//                                 />
//                             )}
//                         </div>
//                     ) : (
//                         <div className="flex-1 flex items-center justify-center text-gray-400 font-medium text-lg italic">
//                         </div>
//                     )}
//                     {/* --- CHANGED LOGIC END --- */}

//                 </div>
//             </div>

//             {/* Controls */}
//             <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-6 z-50">
//                 <button
//                     onClick={() => {
//                         if (currentState === STATES.SLIDE_PLAYING) {
//                             audioManagerRef.current?.pauseSlideAudio();
//                             setCurrentState(STATES.SLIDE_PAUSED);
//                             setIsQuestionPopupOpen(true);
//                         } else {
//                             if (currentState === STATES.SLIDE_PAUSED) {
//                                 audioManagerRef.current?.resumeSlideAudio();
//                                 setCurrentState(STATES.SLIDE_PLAYING);
//                             }
//                             else if (playbackProgress >= 1 && currentSlideIndex < lectureData.length - 1) {
//                                 playSlide(currentSlideIndex + 1);
//                             }
//                             else {
//                                 playSlide(currentSlideIndex);
//                             }
//                         }
//                     }}
//                     disabled={(currentState === STATES.IDLE && lectureData.length === 0) || (currentState === STATES.SLIDE_PLAYING && slideDuration === 0)}
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
//                 <div className="absolute bottom-26 left-0 right-0 px-6 z-20">
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


















// import React, { useEffect, useState, useRef, useCallback } from "react";
// import { io } from "socket.io-client";
// import { useLocation, useNavigate } from "react-router-dom";
// import { X, ChevronLeft, Pause, Play, MessageCircle, Mic, MicOff, SendHorizontal, Download } from "lucide-react";
// import axios from "axios";
// import { BACKEND_API_URL, handleerror, handlesuccess } from "../../../utils/assets.js";
// // import Avatar from "./components/Avatar";
// import Chatbot from "./components/Chatbot";
// import QuestionPopup from "./components/QuestionPopup";
// import AudioManager from "./components/AudioManager";
// import TypingEffect from "./components/TypingEffect";

// // ✅ FIX 1: Move Local Image Loading OUTSIDE the component
// // This ensures it runs only once, not on every render.
// const localSlideImages = import.meta.glob('../../../assets/Slide*.*', { eager: true });
// const localImagesMap = {};

// Object.keys(localSlideImages).forEach(path => {
//     // Match "SlideX." pattern
//     const match = path.match(/Slide(\d+)\./i);
//     if (match && match[1]) {
//         const index = parseInt(match[1], 10);
//         localImagesMap[index] = localSlideImages[path].default;
//     }
// });

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
//     const [playbackProgress, setPlaybackProgress] = useState(0);
//     const [slideDuration, setSlideDuration] = useState(0);
//     const progressFrameRef = useRef(null);
//     const audioManagerRef = useRef(null);

//     // Video Ref
//     const videoRef = useRef(null);

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
//     // ✅ FIX 2: Ref to track and clear timeouts to prevent double popups
//     const popupTimeoutRef = useRef(null);

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
//             // Cleanup timeout on unmount
//             if (popupTimeoutRef.current) clearTimeout(popupTimeoutRef.current);
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
//                         content_url: slide.content_url || slide.visual_url || slide.image_url || "",
//                         video_url: slide.video_url || "",
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

//     // Progress Tracking Loop
//     useEffect(() => {
//         let animationFrameId;

//         const animateProgress = () => {
//             if (currentState === STATES.SLIDE_PLAYING && slideDuration > 0 && audioManagerRef.current && lectureData[currentSlideIndex]) {
//                 const elapsed = audioManagerRef.current.getSlideElapsed();

//                 // Calculate Total Typing Duration based on char count
//                 const slide = lectureData[currentSlideIndex];
//                 const titleLen = slide.title?.length || 0;
//                 const bulletsLen = slide.bullets.reduce((acc, b) => acc + b.length, 0);
//                 const narrationLen = slide.narration?.length || 0;
//                 const totalChars = titleLen + bulletsLen + narrationLen;

//                 // Fixed speed: 40ms per char, min 2s duration
//                 const typingDuration = Math.max(2, totalChars * 0.04);

//                 const prog = Math.min(elapsed / typingDuration, 1);
//                 setPlaybackProgress(prog);

//                 // Continue loop until AUDIO finishes (elapsed < slideDuration)
//                 if (elapsed < slideDuration) {
//                     animationFrameId = requestAnimationFrame(animateProgress);
//                 } else {
//                     setPlaybackProgress(1);
//                 }
//             }
//         };

//         if (currentState === STATES.SLIDE_PLAYING && slideDuration > 0) {
//             animationFrameId = requestAnimationFrame(animateProgress);
//         }

//         return () => {
//             if (animationFrameId) cancelAnimationFrame(animationFrameId);
//         };
//     }, [currentState, slideDuration, currentSlideIndex, lectureData]);

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

//     // Stop Recording
//     const stopRecording = useCallback(() => {
//         if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
//             mediaRecorderRef.current.stop();
//             setIsRecording(false);
//         }
//     }, []);

//     // Play Slide
//     const playSlide = useCallback(async (index) => {
//         if (!lectureData[index] || !audioContext) return;

//         // ✅ Clean up any pending popups from previous slides
//         if (popupTimeoutRef.current) {
//             clearTimeout(popupTimeoutRef.current);
//             popupTimeoutRef.current = null;
//         }
//         setIsQuestionPopupOpen(false);

//         setCurrentSlideIndex(index);
//         setCurrentState(STATES.SLIDE_PLAYING);
//         setPlaybackProgress(0);
//         setSlideDuration(0);

//         const slide = lectureData[index];
//         if (audioManagerRef.current) {
//             const { duration } = await audioManagerRef.current.playSlideAudio(slide.audio_url, () => {
//                 // Slide finished
//                 if (progressFrameRef.current) cancelAnimationFrame(progressFrameRef.current);
//                 setPlaybackProgress(1);

//                 if (!slide.isLastSlide) {
//                     setCurrentState(STATES.QUESTION_WAIT);
//                     // ✅ Store timeout in Ref so we can clear it if needed
//                     popupTimeoutRef.current = setTimeout(() => {
//                         setIsQuestionPopupOpen(true);
//                     }, 1500);
//                 } else {
//                     setCurrentState(STATES.IDLE);
//                     if (isRecording) stopRecording();
//                 }
//             }) || { duration: 0 };

//             setSlideDuration(duration || 0);
//         }
//     }, [lectureData, audioContext, isRecording, stopRecording, currentState]);

//     // Handle Question Response
//     const handleQuestionResponse = useCallback((response) => {
//         setIsQuestionPopupOpen(false);

//         if (response === 'YES') {
//             setCurrentState(STATES.CHATBOT_ACTIVE);
//             setIsChatOpen(true);
//             if (audioManagerRef.current) {
//                 audioManagerRef.current.pauseSlideAudio();
//             }
//         } else {
//             // User said NO or Timeout
//             if (currentState === STATES.SLIDE_PAUSED) {
//                 audioManagerRef.current?.resumeSlideAudio();
//                 setCurrentState(STATES.SLIDE_PLAYING);
//             } else {
//                 if (currentSlideIndex < lectureData.length - 1) {
//                     playSlide(currentSlideIndex + 1);
//                 } else {
//                     setCurrentState(STATES.IDLE);
//                     if (isRecording) stopRecording();
//                 }
//             }
//         }
//     }, [currentState, currentSlideIndex, lectureData.length, playSlide, isRecording, stopRecording]);

//     // Start Recording
//     const startRecording = useCallback(async () => {
//         try {
//             const canvas = document.getElementById('lecture-canvas');
//             if (!canvas) {
//                 handleerror("Canvas element not found");
//                 return;
//             }
//             const canvasStream = canvas.captureStream(30);

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

//             playSlide(0);
//         } catch (error) {
//             console.error("Recording failed:", error);
//             handleerror("Failed to start recording");
//         }
//     }, [audioContext, currentAudioSource, playSlide]);

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

//     return (
//         <div className="fixed inset-0 bg-white overflow-hidden">

//             {/* Audio Manager */}
//             <AudioManager
//                 ref={audioManagerRef}
//                 audioContext={audioContext}
//                 analyserNode={analyserNode}
//                 onAudioSourceChange={setCurrentAudioSource}
//             />

//             {/* Main Content */}
//             <div className="absolute inset-0 flex flex-col items-center justify-between px-8 py-6">
//                 {/* Left: Avatar & Logo */}
//                 <div className="flex flex-col items-center justify-center gap-8">
//                     <img src="/inai-logo-light.png" alt="INAI" className="w-32 h-auto" />
//                 </div>

//                 {/* Right: Whiteboard */}
//                 <div
//                     className="w-full h-full flex flex-1 items-center justify-center relative"
//                     onClick={(e) => e.stopPropagation()}
//                 >
//                     <div className="flex-1 relative w-full h-full">

//                         {currentSlide && (
//                             <div className="absolute inset-0 flex items-center justify-center">
//                                 <div className="w-full h-4/5 overflow-y-auto p-8">
//                                     {currentSlide.title && (
//                                         <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-3 border-b-2 border-gray-800 text-center">
//                                             {currentSlide.title}
//                                         </h2>
//                                     )}

//                                     {currentSlide.bullets.length > 0 ? (
//                                         <ul className="space-y-3">
//                                             {currentSlide.bullets.map((bullet, i) => {
//                                                 const totalBullets = currentSlide.bullets.length;
//                                                 const step = 1 / totalBullets;
//                                                 const start = i * step;
//                                                 const localProgress = Math.max(0, Math.min(1, (playbackProgress - start) / step));

//                                                 return (
//                                                     <li key={i} className="relative pl-6 text-gray-800 text-base">
//                                                         <span className="absolute left-0 text-xl font-bold">•</span>
//                                                         <TypingEffect
//                                                             text={bullet}
//                                                             progress={localProgress}
//                                                             isTyping={currentState === STATES.SLIDE_PLAYING && localProgress < 1 && localProgress > 0}
//                                                         />
//                                                     </li>
//                                                 );
//                                             })}
//                                         </ul>
//                                     ) : currentSlide.narration && (
//                                         <div className="text-gray-800 text-base leading-relaxed">
//                                             <TypingEffect
//                                                 text={currentSlide.narration}
//                                                 progress={playbackProgress}
//                                                 isTyping={currentState === STATES.SLIDE_PLAYING}
//                                             />
//                                         </div>
//                                     )}
//                                 </div>
//                             </div>
//                         )}
//                     </div>

//                     {/* ✅ FIX: Use localImagesMap which is now stable */}
//                     {currentSlide?.video_url ? (
//                         <div className="flex-1 w-full h-full flex items-center justify-center p-4">
//                             <video
//                                 ref={videoRef}
//                                 src={currentSlide.video_url}
//                                 className="max-w-full max-h-full rounded-lg shadow-lg"
//                                 controls={false}
//                                 muted={true}
//                                 playsInline
//                             >
//                                 Your browser does not support the video tag.
//                             </video>
//                         </div>
//                     ) : (localImagesMap[currentSlideIndex + 1] || currentSlide?.content_url) ? (
//                         <div className={`flex-1 w-full h-full flex items-center justify-center transition-opacity duration-700 ${currentState === STATES.SLIDE_PLAYING || playbackProgress > 0 ? 'opacity-100' : 'opacity-0'}`}>
//                             {(localImagesMap[currentSlideIndex + 1] || currentSlide.content_url).match(/\.(jpeg|jpg|gif|png|webp)($|\?)/i) ? (
//                                 <img
//                                     src={localImagesMap[currentSlideIndex + 1] || currentSlide.content_url}
//                                     alt="Slide Content"
//                                     className="w-full h-min rounded-lg shadow-lg"
//                                 />
//                             ) : (
//                                 <iframe
//                                     src={currentSlide.content_url}
//                                     className="w-full h-full border-0 rounded-lg shadow-lg"
//                                     title="Slide Content"
//                                     allowFullScreen
//                                 />
//                             )}
//                         </div>
//                     ) : (
//                         <div className="flex-1 flex items-center justify-center text-gray-400 font-medium text-lg italic">
//                         </div>
//                     )}

//                 </div>
//             </div>

//             {/* Controls */}
//             <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-6 z-50">
//                 <button
//                     onClick={() => {
//                         if (currentState === STATES.SLIDE_PLAYING) {
//                             audioManagerRef.current?.pauseSlideAudio();
//                             setCurrentState(STATES.SLIDE_PAUSED);
//                             // Ensure popup is open when paused manually
//                             setIsQuestionPopupOpen(true);
//                         } else {
//                             if (currentState === STATES.SLIDE_PAUSED) {
//                                 audioManagerRef.current?.resumeSlideAudio();
//                                 setCurrentState(STATES.SLIDE_PLAYING);
//                                 // Ensure popup is closed when resuming
//                                 setIsQuestionPopupOpen(false);
//                             }
//                             else if (playbackProgress >= 1 && currentSlideIndex < lectureData.length - 1) {
//                                 playSlide(currentSlideIndex + 1);
//                             }
//                             else {
//                                 playSlide(currentSlideIndex);
//                             }
//                         }
//                     }}
//                     disabled={(currentState === STATES.IDLE && lectureData.length === 0) || (currentState === STATES.SLIDE_PLAYING && slideDuration === 0)}
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
//                 <div className="absolute bottom-26 left-0 right-0 px-6 z-20">
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








// import React, { useEffect, useState, useRef, useCallback } from "react";
// import { io } from "socket.io-client";
// import { useLocation, useNavigate } from "react-router-dom";
// import { X, ChevronLeft, Pause, Play, MessageCircle, Mic, MicOff, SendHorizontal, Download } from "lucide-react";
// import axios from "axios";
// import { BACKEND_API_URL, handleerror, handlesuccess } from "../../../utils/assets.js";
// // import Avatar from "./components/Avatar";
// import Chatbot from "./components/Chatbot";
// import QuestionPopup from "./components/QuestionPopup";
// import AudioManager from "./components/AudioManager";
// import TypingEffect from "./components/TypingEffect";

// // ✅ FIX 1: Move Local Image Loading OUTSIDE the component
// const localSlideImages = import.meta.glob('../../../assets/Slide*.*', { eager: true });
// const localImagesMap = {};

// Object.keys(localSlideImages).forEach(path => {
//     const match = path.match(/Slide(\d+)\./i);
//     if (match && match[1]) {
//         const index = parseInt(match[1], 10);
//         localImagesMap[index] = localSlideImages[path].default;
//     }
// });

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
//     const [playbackProgress, setPlaybackProgress] = useState(0);
//     const [slideDuration, setSlideDuration] = useState(0);
//     const progressFrameRef = useRef(null);
//     const audioManagerRef = useRef(null);

//     // Video Ref
//     const videoRef = useRef(null);

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
//     const popupTimeoutRef = useRef(null);

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
//             if (popupTimeoutRef.current) clearTimeout(popupTimeoutRef.current);
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
//                         content_url: slide.content_url || slide.visual_url || slide.image_url || "",
//                         video_url: slide.video_url || "",
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

//     // Progress Tracking Loop
//     useEffect(() => {
//         let animationFrameId;

//         const animateProgress = () => {
//             if (currentState === STATES.SLIDE_PLAYING && slideDuration > 0 && audioManagerRef.current && lectureData[currentSlideIndex]) {
//                 const elapsed = audioManagerRef.current.getSlideElapsed();

//                 const slide = lectureData[currentSlideIndex];
//                 const titleLen = slide.title?.length || 0;
//                 const bulletsLen = slide.bullets.reduce((acc, b) => acc + b.length, 0);
//                 const narrationLen = slide.narration?.length || 0;
//                 const totalChars = titleLen + bulletsLen + narrationLen;

//                 const typingDuration = Math.max(2, totalChars * 0.04);
//                 const prog = Math.min(elapsed / typingDuration, 1);
//                 setPlaybackProgress(prog);

//                 if (elapsed < slideDuration) {
//                     animationFrameId = requestAnimationFrame(animateProgress);
//                 } else {
//                     setPlaybackProgress(1);
//                 }
//             }
//         };

//         if (currentState === STATES.SLIDE_PLAYING && slideDuration > 0) {
//             animationFrameId = requestAnimationFrame(animateProgress);
//         }

//         return () => {
//             if (animationFrameId) cancelAnimationFrame(animationFrameId);
//         };
//     }, [currentState, slideDuration, currentSlideIndex, lectureData]);

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

//             if (data.audio_url && audioManagerRef.current) {
//                 audioManagerRef.current.playChatbotAudio(data.audio_url);
//             }
//         });

//         return () => {
//             if (socketRef.current) socketRef.current.disconnect();
//         };
//     }, []);

//     // Stop Recording
//     const stopRecording = useCallback(() => {
//         if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
//             mediaRecorderRef.current.stop();
//             setIsRecording(false);
//         }
//     }, []);

//     // Play Slide
//     const playSlide = useCallback(async (index) => {
//         if (!lectureData[index] || !audioContext) return;

//         if (popupTimeoutRef.current) {
//             clearTimeout(popupTimeoutRef.current);
//             popupTimeoutRef.current = null;
//         }
//         setIsQuestionPopupOpen(false);

//         setCurrentSlideIndex(index);
//         setCurrentState(STATES.SLIDE_PLAYING);
//         setPlaybackProgress(0);
//         setSlideDuration(0);

//         const slide = lectureData[index];
//         if (audioManagerRef.current) {
//             const { duration } = await audioManagerRef.current.playSlideAudio(slide.audio_url, () => {
//                 if (progressFrameRef.current) cancelAnimationFrame(progressFrameRef.current);
//                 setPlaybackProgress(1);

//                 if (!slide.isLastSlide) {
//                     setCurrentState(STATES.QUESTION_WAIT);
//                     popupTimeoutRef.current = setTimeout(() => {
//                         setIsQuestionPopupOpen(true);
//                     }, 1500);
//                 } else {
//                     setCurrentState(STATES.IDLE);
//                     if (isRecording) stopRecording();
//                 }
//             }) || { duration: 0 };

//             setSlideDuration(duration || 0);
//         }
//     }, [lectureData, audioContext, isRecording, stopRecording, currentState]);

//     // ---------------------------------------------------------
//     // ✅ MAIN LOGIC UPDATE: Handle Question Response with Text
//     // ---------------------------------------------------------
//     const handleQuestionResponse = useCallback((response) => {
//         setIsQuestionPopupOpen(false);

//         // Agar user ne 'NO' select kiya ya close kiya
//         if (response === 'NO') {
//             if (currentState === STATES.SLIDE_PAUSED) {
//                 audioManagerRef.current?.resumeSlideAudio();
//                 setCurrentState(STATES.SLIDE_PLAYING);
//             } else {
//                 if (currentSlideIndex < lectureData.length - 1) {
//                     playSlide(currentSlideIndex + 1);
//                 } else {
//                     setCurrentState(STATES.IDLE);
//                     if (isRecording) stopRecording();
//                 }
//             }
//         } else {
//             // ✅ SCENARIO: User sends a question (response holds the text or 'YES')
//             setCurrentState(STATES.CHATBOT_ACTIVE);
//             setIsChatOpen(true);
//             if (audioManagerRef.current) {
//                 audioManagerRef.current.pauseSlideAudio();
//             }

//             // Agar response ek proper question text hai (sirf 'YES' nahi), toh use chat me bhejo
//             if (response && response !== 'YES' && typeof response === 'string') {
//                 const questionText = response;

//                 // 1. User ka message Chatbot UI me add karo
//                 setMessages(prev => [...prev, { id: Date.now(), text: questionText, sender: "user" }]);

//                 // 2. Socket ke through backend ko bhejo taaki answer aaye
//                 if (socketRef.current?.connected) {
//                     socketRef.current.emit("lecture:chat", {
//                         lecture_id: location.state?.lectureId?.toString(),
//                         question: questionText
//                     });
//                 }
//             }
//         }
//     }, [currentState, currentSlideIndex, lectureData.length, playSlide, isRecording, stopRecording, location.state?.lectureId]);

//     // Start Recording
//     const startRecording = useCallback(async () => {
//         try {
//             const canvas = document.getElementById('lecture-canvas');
//             if (!canvas) {
//                 handleerror("Canvas element not found");
//                 return;
//             }
//             const canvasStream = canvas.captureStream(30);

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

//             playSlide(0);
//         } catch (error) {
//             console.error("Recording failed:", error);
//             handleerror("Failed to start recording");
//         }
//     }, [audioContext, currentAudioSource, playSlide]);

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

//     return (
//         <div className="fixed inset-0 bg-white overflow-hidden">

//             {/* Audio Manager */}
//             <AudioManager
//                 ref={audioManagerRef}
//                 audioContext={audioContext}
//                 analyserNode={analyserNode}
//                 onAudioSourceChange={setCurrentAudioSource}
//             />

//             {/* Main Content */}
//             <div className="absolute inset-0 flex flex-col items-center justify-between px-8 py-6">
//                 {/* Left: Avatar & Logo */}
//                 <div className="flex flex-col items-center justify-center gap-8">
//                     <img src="/inai-logo-light.png" alt="INAI" className="w-32 h-auto" />
//                 </div>

//                 {/* Right: Whiteboard */}
//                 <div
//                     className="w-full h-full flex flex-1 items-center justify-center relative"
//                     onClick={(e) => e.stopPropagation()}
//                 >
//                     <div className="flex-1 relative w-full h-full">

//                         {currentSlide && (
//                             <div className="absolute inset-0 flex items-center justify-center">
//                                 <div className="w-full h-4/5 overflow-y-auto p-8">
//                                     {currentSlide.title && (
//                                         <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-3 border-b-2 border-gray-800 text-center">
//                                             {currentSlide.title}
//                                         </h2>
//                                     )}

//                                     {currentSlide.bullets.length > 0 ? (
//                                         <ul className="space-y-3">
//                                             {currentSlide.bullets.map((bullet, i) => {
//                                                 const totalBullets = currentSlide.bullets.length;
//                                                 const step = 1 / totalBullets;
//                                                 const start = i * step;
//                                                 const localProgress = Math.max(0, Math.min(1, (playbackProgress - start) / step));

//                                                 return (
//                                                     <li key={i} className="relative pl-6 text-gray-800 text-base">
//                                                         <span className="absolute left-0 text-xl font-bold">•</span>
//                                                         <TypingEffect
//                                                             text={bullet}
//                                                             progress={localProgress}
//                                                             isTyping={currentState === STATES.SLIDE_PLAYING && localProgress < 1 && localProgress > 0}
//                                                         />
//                                                     </li>
//                                                 );
//                                             })}
//                                         </ul>
//                                     ) : currentSlide.narration && (
//                                         <div className="text-gray-800 text-base leading-relaxed">
//                                             <TypingEffect
//                                                 text={currentSlide.narration}
//                                                 progress={playbackProgress}
//                                                 isTyping={currentState === STATES.SLIDE_PLAYING}
//                                             />
//                                         </div>
//                                     )}
//                                 </div>
//                             </div>
//                         )}
//                     </div>

//                     {currentSlide?.video_url ? (
//                         <div className="flex-1 w-full h-full flex items-center justify-center p-4">
//                             <video
//                                 ref={videoRef}
//                                 src={currentSlide.video_url}
//                                 className="max-w-full max-h-full rounded-lg shadow-lg"
//                                 controls={false}
//                                 muted={true}
//                                 playsInline
//                             >
//                                 Your browser does not support the video tag.
//                             </video>
//                         </div>
//                     ) : (localImagesMap[currentSlideIndex + 1] || currentSlide?.content_url) ? (
//                         <div className={`flex-1 w-full h-full flex items-center justify-center transition-opacity duration-700 ${currentState === STATES.SLIDE_PLAYING || playbackProgress > 0 ? 'opacity-100' : 'opacity-0'}`}>
//                             {(localImagesMap[currentSlideIndex + 1] || currentSlide.content_url).match(/\.(jpeg|jpg|gif|png|webp)($|\?)/i) ? (
//                                 <img
//                                     src={localImagesMap[currentSlideIndex + 1] || currentSlide.content_url}
//                                     alt="Slide Content"
//                                     className="w-full h-min rounded-lg shadow-lg"
//                                 />
//                             ) : (
//                                 <iframe
//                                     src={currentSlide.content_url}
//                                     className="w-full h-full border-0 rounded-lg shadow-lg"
//                                     title="Slide Content"
//                                     allowFullScreen
//                                 />
//                             )}
//                         </div>
//                     ) : (
//                         <div className="flex-1 flex items-center justify-center text-gray-400 font-medium text-lg italic">
//                         </div>
//                     )}

//                 </div>
//             </div>

//             {/* Controls */}
//             <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-6 z-50">
//                 <button
//                     onClick={() => {
//                         if (currentState === STATES.SLIDE_PLAYING) {
//                             audioManagerRef.current?.pauseSlideAudio();
//                             setCurrentState(STATES.SLIDE_PAUSED);
//                             setIsQuestionPopupOpen(true);
//                         } else {
//                             if (currentState === STATES.SLIDE_PAUSED) {
//                                 audioManagerRef.current?.resumeSlideAudio();
//                                 setCurrentState(STATES.SLIDE_PLAYING);
//                                 setIsQuestionPopupOpen(false);
//                             }
//                             else if (playbackProgress >= 1 && currentSlideIndex < lectureData.length - 1) {
//                                 playSlide(currentSlideIndex + 1);
//                             }
//                             else {
//                                 playSlide(currentSlideIndex);
//                             }
//                         }
//                     }}
//                     disabled={(currentState === STATES.IDLE && lectureData.length === 0) || (currentState === STATES.SLIDE_PLAYING && slideDuration === 0)}
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
//                 <div className="absolute bottom-26 left-0 right-0 px-6 z-20">
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

//             {/* Question Popup - IMPORTANT NOTE: Ensure QuestionPopup passes the actual question text string to onResponse instead of just 'YES' */}
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

            {/* Controls */}
            {/* <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-6 z-50">
                <button
                    onClick={() => {
                        if (currentState === STATES.SLIDE_PLAYING) {
                            audioManagerRef.current?.pauseSlideAudio();
                            setCurrentState(STATES.SLIDE_PAUSED);
                            setIsQuestionPopupOpen(true);
                        } else {
                            if (currentState === STATES.SLIDE_PAUSED) {
                                audioManagerRef.current?.resumeSlideAudio();
                                setCurrentState(STATES.SLIDE_PLAYING);
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
                    disabled={(currentState === STATES.IDLE && lectureData.length === 0) || (currentState === STATES.SLIDE_PLAYING && slideDuration === 0)}
                    className="w-16 h-16 flex items-center justify-center rounded-full bg-gray-800 border-2 border-gray-900 hover:bg-gray-700 disabled:opacity-50"
                >
                    {currentState === STATES.SLIDE_PLAYING ? <Pause className="w-6 h-6 text-white" /> : <Play className="w-6 h-6 text-white ml-1" />}
                </button> */}
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
                    disabled={(currentState === STATES.IDLE && lectureData.length === 0) || (currentState === STATES.SLIDE_PLAYING && slideDuration === 0)}
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
                // <Chatbot
                //     messages={messages}
                //     onSendMessage={handleSendMessage} // ✅ Updated: Passing the unified handler
                //     onClose={() => {
                //         setIsChatOpen(false);
                //         setTimeout(() => {
                //             if (currentState === STATES.CHATBOT_ACTIVE) {
                //                 audioManagerRef.current?.resumeSlideAudio();
                //                 setCurrentState(STATES.SLIDE_PLAYING);
                //             }
                //         }, 3000);
                //     }}
                // />
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

























// import React, { useEffect, useState, useRef, useCallback } from "react";
// import { io } from "socket.io-client";
// import { useLocation, useNavigate } from "react-router-dom";
// import { X, ChevronLeft, Pause, Play, MessageCircle, Mic, MicOff, SendHorizontal, Download } from "lucide-react";
// import axios from "axios";
// import { BACKEND_API_URL, handleerror, handlesuccess } from "../../../utils/assets.js";
// // import Avatar from "./components/Avatar";
// import Chatbot from "./components/Chatbot";
// import QuestionPopup from "./components/QuestionPopup";
// import AudioManager from "./components/AudioManager";
// import TypingEffect from "./components/TypingEffect";

// // ✅ LOCAL IMAGES LOAD LOGIC (Outside Component for Performance)
// const localSlideImages = import.meta.glob('../../../assets/Slide*.*', { eager: true });
// const localImagesMap = {};

// Object.keys(localSlideImages).forEach(path => {
//     const match = path.match(/Slide(\d+)\./i);
//     if (match && match[1]) {
//         const index = parseInt(match[1], 10);
//         localImagesMap[index] = localSlideImages[path].default;
//     }
// });

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
//     const [playbackProgress, setPlaybackProgress] = useState(0);
//     const [slideDuration, setSlideDuration] = useState(0);
//     const progressFrameRef = useRef(null);
//     const audioManagerRef = useRef(null);

//     // Video Ref
//     const videoRef = useRef(null);

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
//     const popupTimeoutRef = useRef(null);

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
//             if (popupTimeoutRef.current) clearTimeout(popupTimeoutRef.current);
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
//                         content_url: slide.content_url || slide.visual_url || slide.image_url || "",
//                         video_url: slide.video_url || "",
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

//     // Progress Tracking Loop
//     useEffect(() => {
//         let animationFrameId;

//         const animateProgress = () => {
//             if (currentState === STATES.SLIDE_PLAYING && slideDuration > 0 && audioManagerRef.current && lectureData[currentSlideIndex]) {
//                 const elapsed = audioManagerRef.current.getSlideElapsed();

//                 const slide = lectureData[currentSlideIndex];
//                 const titleLen = slide.title?.length || 0;
//                 const bulletsLen = slide.bullets.reduce((acc, b) => acc + b.length, 0);
//                 const narrationLen = slide.narration?.length || 0;
//                 const totalChars = titleLen + bulletsLen + narrationLen;

//                 const typingDuration = Math.max(2, totalChars * 0.04);
//                 const prog = Math.min(elapsed / typingDuration, 1);
//                 setPlaybackProgress(prog);

//                 if (elapsed < slideDuration) {
//                     animationFrameId = requestAnimationFrame(animateProgress);
//                 } else {
//                     setPlaybackProgress(1);
//                 }
//             }
//         };

//         if (currentState === STATES.SLIDE_PLAYING && slideDuration > 0) {
//             animationFrameId = requestAnimationFrame(animateProgress);
//         }

//         return () => {
//             if (animationFrameId) cancelAnimationFrame(animationFrameId);
//         };
//     }, [currentState, slideDuration, currentSlideIndex, lectureData]);

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

//             if (data.audio_url && audioManagerRef.current) {
//                 audioManagerRef.current.playChatbotAudio(data.audio_url);
//             }
//         });

//         return () => {
//             if (socketRef.current) socketRef.current.disconnect();
//         };
//     }, []);

//     // Stop Recording
//     const stopRecording = useCallback(() => {
//         if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
//             mediaRecorderRef.current.stop();
//             setIsRecording(false);
//         }
//     }, []);

//     // Play Slide
//     const playSlide = useCallback(async (index) => {
//         if (!lectureData[index] || !audioContext) return;

//         if (popupTimeoutRef.current) {
//             clearTimeout(popupTimeoutRef.current);
//             popupTimeoutRef.current = null;
//         }
//         setIsQuestionPopupOpen(false);

//         setCurrentSlideIndex(index);
//         setCurrentState(STATES.SLIDE_PLAYING);
//         setPlaybackProgress(0);
//         setSlideDuration(0);

//         const slide = lectureData[index];
//         if (audioManagerRef.current) {
//             const { duration } = await audioManagerRef.current.playSlideAudio(slide.audio_url, () => {
//                 if (progressFrameRef.current) cancelAnimationFrame(progressFrameRef.current);
//                 setPlaybackProgress(1);

//                 if (!slide.isLastSlide) {
//                     setCurrentState(STATES.QUESTION_WAIT);
//                     popupTimeoutRef.current = setTimeout(() => {
//                         setIsQuestionPopupOpen(true);
//                     }, 1500);
//                 } else {
//                     setCurrentState(STATES.IDLE);
//                     if (isRecording) stopRecording();
//                 }
//             }) || { duration: 0 };

//             setSlideDuration(duration || 0);
//         }
//     }, [lectureData, audioContext, isRecording, stopRecording, currentState]);


//     // ---------------------------------------------------------
//     // ✅ HELPER FUNCTION: Handle Send Message (Unified)
//     // ---------------------------------------------------------
//     const handleSendMessage = useCallback((text) => {
//         if (!text || typeof text !== 'string' || !text.trim()) return;

//         setMessages(prev => [...prev, { id: Date.now(), text, sender: "user" }]);

//         if (socketRef.current?.connected) {
//             socketRef.current.emit("lecture:chat", {
//                 lecture_id: location.state?.lectureId?.toString(),
//                 question: text
//             });
//         }
//     }, [location.state?.lectureId]);


//     // ---------------------------------------------------------
//     // ✅ HANDLE QUESTION RESPONSE (From Popup)
//     // ---------------------------------------------------------
//     const handleQuestionResponse = useCallback((response) => {
//         setIsQuestionPopupOpen(false);

//         // Agar user ne 'NO' select kiya ya close kiya
//         if (response === 'NO') {
//             if (currentState === STATES.SLIDE_PAUSED) {
//                 audioManagerRef.current?.resumeSlideAudio();
//                 setCurrentState(STATES.SLIDE_PLAYING);
//             } else {
//                 if (currentSlideIndex < lectureData.length - 1) {
//                     playSlide(currentSlideIndex + 1);
//                 } else {
//                     setCurrentState(STATES.IDLE);
//                     if (isRecording) stopRecording();
//                 }
//             }
//         } else {
//             // ✅ SCENARIO: User ne question pucha
//             setCurrentState(STATES.CHATBOT_ACTIVE);
//             setIsChatOpen(true);

//             // Audio pause karo (agar chal raha tha)
//             if (audioManagerRef.current) {
//                 audioManagerRef.current.pauseSlideAudio();
//             }

//             // Question ko chatbot mein bhejo
//             if (response && response !== 'YES' && typeof response === 'string') {
//                 handleSendMessage(response);
//             }
//         }
//     }, [currentState, currentSlideIndex, lectureData.length, playSlide, isRecording, stopRecording, handleSendMessage]);

//     // Start Recording
//     const startRecording = useCallback(async () => {
//         try {
//             const canvas = document.getElementById('lecture-canvas');
//             if (!canvas) {
//                 handleerror("Canvas element not found");
//                 return;
//             }
//             const canvasStream = canvas.captureStream(30);

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

//             playSlide(0);
//         } catch (error) {
//             console.error("Recording failed:", error);
//             handleerror("Failed to start recording");
//         }
//     }, [audioContext, currentAudioSource, playSlide]);

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

//     return (
//         <div className="fixed inset-0 bg-white overflow-hidden">

//             {/* Audio Manager */}
//             <AudioManager
//                 ref={audioManagerRef}
//                 audioContext={audioContext}
//                 analyserNode={analyserNode}
//                 onAudioSourceChange={setCurrentAudioSource}
//             />

//             {/* Main Content */}
//             <div className="absolute inset-0 flex flex-col items-center justify-between px-8 py-6">
//                 {/* Left: Avatar & Logo */}
//                 <div className="flex flex-col items-center justify-center gap-8">
//                     <img src="/inai-logo-light.png" alt="INAI" className="w-32 h-auto" />
//                 </div>

//                 {/* Right: Whiteboard */}
//                 <div
//                     className="w-full h-full flex flex-1 items-center justify-center relative"
//                     onClick={(e) => e.stopPropagation()}
//                 >
//                     <div className="flex-1 relative w-full h-full">

//                         {currentSlide && (
//                             <div className="absolute inset-0 flex items-center justify-center">
//                                 <div className="w-full h-4/5 overflow-y-auto p-8">
//                                     {currentSlide.title && (
//                                         <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-3 border-b-2 border-gray-800 text-center">
//                                             {currentSlide.title}
//                                         </h2>
//                                     )}

//                                     {currentSlide.bullets.length > 0 ? (
//                                         <ul className="space-y-3">
//                                             {currentSlide.bullets.map((bullet, i) => {
//                                                 const totalBullets = currentSlide.bullets.length;
//                                                 const step = 1 / totalBullets;
//                                                 const start = i * step;
//                                                 const localProgress = Math.max(0, Math.min(1, (playbackProgress - start) / step));

//                                                 return (
//                                                     <li key={i} className="relative pl-6 text-gray-800 text-base">
//                                                         <span className="absolute left-0 text-xl font-bold">•</span>
//                                                         <TypingEffect
//                                                             text={bullet}
//                                                             progress={localProgress}
//                                                             isTyping={currentState === STATES.SLIDE_PLAYING && localProgress < 1 && localProgress > 0}
//                                                         />
//                                                     </li>
//                                                 );
//                                             })}
//                                         </ul>
//                                     ) : currentSlide.narration && (
//                                         <div className="text-gray-800 text-base leading-relaxed">
//                                             <TypingEffect
//                                                 text={currentSlide.narration}
//                                                 progress={playbackProgress}
//                                                 isTyping={currentState === STATES.SLIDE_PLAYING}
//                                             />
//                                         </div>
//                                     )}
//                                 </div>
//                             </div>
//                         )}
//                     </div>

//                     {currentSlide?.video_url ? (
//                         <div className="flex-1 w-full h-full flex items-center justify-center p-4">
//                             <video
//                                 ref={videoRef}
//                                 src={currentSlide.video_url}
//                                 className="max-w-full max-h-full rounded-lg shadow-lg"
//                                 controls={false}
//                                 muted={true}
//                                 playsInline
//                             >
//                                 Your browser does not support the video tag.
//                             </video>
//                         </div>
//                     ) : (localImagesMap[currentSlideIndex + 1] || currentSlide?.content_url) ? (
//                         <div className={`flex-1 w-full h-full flex items-center justify-center transition-opacity duration-700 ${currentState === STATES.SLIDE_PLAYING || playbackProgress > 0 ? 'opacity-100' : 'opacity-0'}`}>
//                             {(localImagesMap[currentSlideIndex + 1] || currentSlide.content_url).match(/\.(jpeg|jpg|gif|png|webp)($|\?)/i) ? (
//                                 <img
//                                     src={localImagesMap[currentSlideIndex + 1] || currentSlide.content_url}
//                                     alt="Slide Content"
//                                     className="w-full h-min rounded-lg shadow-lg"
//                                 />
//                             ) : (
//                                 <iframe
//                                     src={currentSlide.content_url}
//                                     className="w-full h-full border-0 rounded-lg shadow-lg"
//                                     title="Slide Content"
//                                     allowFullScreen
//                                 />
//                             )}
//                         </div>
//                     ) : (
//                         <div className="flex-1 flex items-center justify-center text-gray-400 font-medium text-lg italic">
//                         </div>
//                     )}

//                 </div>
//             </div>

//             {/* Controls */}
//             <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-6 z-50">
//                 <button
//                     onClick={() => {
//                         if (currentState === STATES.SLIDE_PLAYING) {
//                             audioManagerRef.current?.pauseSlideAudio();
//                             setCurrentState(STATES.SLIDE_PAUSED);
//                             setIsQuestionPopupOpen(true);
//                         } else {
//                             if (currentState === STATES.SLIDE_PAUSED) {
//                                 audioManagerRef.current?.resumeSlideAudio();
//                                 setCurrentState(STATES.SLIDE_PLAYING);
//                                 setIsQuestionPopupOpen(false);
//                             }
//                             else if (playbackProgress >= 1 && currentSlideIndex < lectureData.length - 1) {
//                                 playSlide(currentSlideIndex + 1);
//                             }
//                             else {
//                                 playSlide(currentSlideIndex);
//                             }
//                         }
//                     }}
//                     disabled={(currentState === STATES.IDLE && lectureData.length === 0) || (currentState === STATES.SLIDE_PLAYING && slideDuration === 0)}
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
//                 <div className="absolute bottom-26 left-0 right-0 px-6 z-20">
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

//             {/* Chatbot - ✅ UPDATED LOGIC TO RESUME OR NEXT */}
//             {isChatOpen && (
//                 <Chatbot
//                     messages={messages}
//                     onSendMessage={handleSendMessage}
//                     onClose={() => {
//                         setIsChatOpen(false);
//                         setTimeout(() => {
//                             if (currentState === STATES.CHATBOT_ACTIVE) {
//                                 // 1. Agar slide khatam ho chuki thi (Popup case) -> Next Slide
//                                 if (playbackProgress >= 0.99) {
//                                     if (currentSlideIndex < lectureData.length - 1) {
//                                         playSlide(currentSlideIndex + 1);
//                                     } else {
//                                         setCurrentState(STATES.IDLE);
//                                         if (isRecording) stopRecording();
//                                     }
//                                 }
//                                 // 2. Agar slide beech mein thi (Interruption case) -> Resume
//                                 else {
//                                     audioManagerRef.current?.resumeSlideAudio();
//                                     setCurrentState(STATES.SLIDE_PLAYING);
//                                 }
//                             }
//                         }, 3000);
//                     }}
//                 />
//             )}
//         </div>
//     );
// }

// export default LectureVideo;