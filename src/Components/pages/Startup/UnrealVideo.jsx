import { useState, useRef, useEffect } from "react";
import { Download, Circle, Volume2, VolumeX } from "lucide-react";
import { BACKEND_API_URL } from "../../../utils/assets.js";
import axios from "axios";

const STREAMPIXEL_VIDEO_URL = "https://share.streampixel.io/67375bc07d20a24b406e2e34";

const Typewriter = ({ text, speed = 20, onComplete, isPlaying }) => {
  const [displayedText, setDisplayedText] = useState("");
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (!isPlaying) return;

    setDisplayedText("");
    if (!text) {
      if (onCompleteRef.current) onCompleteRef.current();
      return;
    }
    const chars = Array.from(text);
    const textLength = chars.length;
    let i = 0;
    const timer = setInterval(() => {
      if (i < textLength) {
        setDisplayedText((prev) => prev + chars[i]);
        i++;
      } else {

        clearInterval(timer);
        if (onCompleteRef.current) {
          onCompleteRef.current();
        }
      }
    }, speed);
    return () => clearInterval(timer);
  }, [text, speed, isPlaying]);

  return <span>{displayedText}</span>;
};

// Audio-synced typewriter that matches audio narration timing
const AudioSyncedTypewriter = ({ text, audioDuration, onComplete, isPlaying }) => {
  const [displayedText, setDisplayedText] = useState("");
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (!isPlaying || !text) {
      if (!text && onCompleteRef.current) onCompleteRef.current();
      return;
    }

    setDisplayedText("");

    const chars = Array.from(text);
    const textLength = chars.length;

    const speed = audioDuration ? (audioDuration * 1000) / textLength : 15;

    let i = 0;
    const timer = setInterval(() => {
      if (i < textLength) {
        setDisplayedText((prev) => prev + chars[i]);
        i++;
      } else {

        clearInterval(timer);
        if (onCompleteRef.current) {
          onCompleteRef.current();
        }
      }
    }, speed);

    return () => clearInterval(timer);
  }, [text, audioDuration, isPlaying]);

  return <span>{displayedText}</span>;
};

export default function UnrealVideo({ fullScreen = true, lecturejson, handleStartClick, isRecording, setIsRecording, showControls, videoRef, isPlaying, setIsPlaying, recognizedText, speechError, onSlidesComplete }) {

  const recordingTimerRef = useRef(null);
  const transitionTimeoutRef = useRef(null);
  const [recordingTime, setRecordingTime] = useState(0);

  // Lecture Board State
  const [slidesData, setSlidesData] = useState([]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [animationStep, setAnimationStep] = useState(0);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [audioDuration, setAudioDuration] = useState(0);
  const audioRef = useRef(null);

  // Sync local recording state (for timer)
  useEffect(() => {
    if (isRecording) {
      setRecordingTime(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      setRecordingTime(0);
    }
    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    };
  }, [isRecording]);

  // Fetch lecture data
  useEffect(() => {
    if (lecturejson) {
      const fetchLecture = async () => {
        try {
          let url = lecturejson;
          url = url.replace('/chapter-materials', '');

          if (!url.startsWith('http')) {
            url = `${BACKEND_API_URL}${url.startsWith('/') ? '' : '/'}${url}`;
          }
          const res = await axios.get(url);
          if (res.data && res.data.slides) {
            setSlidesData(res.data.slides);
            setCurrentSlideIndex(0);
            setAnimationStep(0);
          }
        } catch (e) {
          console.error("Failed to fetch lecture json", e);
        }
      };
      fetchLecture();
    }
  }, [lecturejson]);

  // Helper to change slide safely
  const goToSlide = (index) => {
    setCurrentSlideIndex((prev) => {
      const max = slidesData.length - 1;
      if (max < 0) return 0;
      let next = index;
      if (typeof index !== "number") next = prev;
      if (next < 0) next = 0;
      if (next > max) next = max;
      return next;
    });
    setAnimationStep(0);
  };

  const nextSlide = () => goToSlide(currentSlideIndex + 1);
  const prevSlide = () => goToSlide(currentSlideIndex - 1);

  // Fixed 7-second timer to auto-advance slides while playing.
  // When the last slide finishes, notify parent so it can stop recording & show controls.
  useEffect(() => {
    if (!isPlaying || slidesData.length === 0) return;

    const isLastSlide = currentSlideIndex === slidesData.length - 1;

    const timer = setTimeout(() => {
      if (isLastSlide) {
        if (isRecording && typeof onSlidesComplete === 'function') {
          onSlidesComplete();
        }
      } else {
        setCurrentSlideIndex(prev => {
          const next = prev + 1;
          return next >= slidesData.length ? slidesData.length - 1 : next;
        });
      }
    }, 7000);

    return () => clearTimeout(timer);
  }, [currentSlideIndex, isPlaying, slidesData.length, isRecording, onSlidesComplete]);

  // Whenever slide changes (manual or auto), ensure we start animation from 0
  useEffect(() => {
    setAnimationStep(0);
  }, [currentSlideIndex]);

  // Keyboard controls for slide navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "ArrowRight") {
        nextSlide();
      } else if (e.key === "ArrowLeft") {
        prevSlide();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentSlideIndex, slidesData.length]);

  // Play slide audio when slide changes
  useEffect(() => {
    if (!slidesData.length) return;
    const slide = slidesData[currentSlideIndex];
    if (!slide) return;

    // stop previous audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    // Clear previous transition timeout
    if (transitionTimeoutRef.current) {
      clearTimeout(transitionTimeoutRef.current);
      transitionTimeoutRef.current = null;
    }

    setAudioPlaying(false);
    setAudioDuration(0);

    if (slide.audio_url) {
      let url = slide.audio_url;
      if (!url.startsWith('http')) {
        url = `${BACKEND_API_URL}${url.startsWith('/') ? url : '/' + url}`;
      }

      console.log('Loading audio from URL:', url);
      const audio = new Audio(url);
      audioRef.current = audio;

      audio.onloadedmetadata = () => {
        console.log('Audio duration:', audio.duration);
        setAudioDuration(audio.duration);
      };

      audio.onplay = () => {
        console.log('Audio started playing');
        setAudioPlaying(true);
      };

      audio.onpause = () => {
        console.log('Audio paused');
        setAudioPlaying(false);
      };

      audio.onerror = (e) => {
        console.error('Audio loading error:', e);
        console.error('Failed URL:', url);
        setAudioPlaying(false);
      };

      audio.onended = () => {
        console.log('Audio ended');
        setAudioPlaying(false);
      };

      if (isPlaying) {
        console.log('Attempting to play audio automatically');
        audio.play().catch((err) => {
          console.error("Audio autoplay blocked:", err);
        });
      }
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }
    };
  }, [currentSlideIndex, slidesData]);

  // Handle Play/Pause for Audio
  useEffect(() => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.play().catch(() => { });
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying]);

  // Toggle audio playback
  const toggleAudio = () => {
    if (!isRecording) return;

    if (!audioRef.current) return;

    if (audioPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch((err) => {
        console.log("Audio play error:", err);
      });
    }
  };

  // Auto-play video on mount
  useEffect(() => {
    if (videoRef.current && typeof videoRef.current.play === 'function') {
      videoRef.current.play().catch(() => { });
    }
  }, []);

  // Format recording time
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`${fullScreen ? "min-h-screen" : "w-full h-full"} bg-linear-to-br from-slate-950 via-blue-950 to-slate-950 overflow-hidden`}>
      {/* Background effects */}
      <div className={`${fullScreen ? "fixed" : "absolute"} inset-0 overflow-hidden pointer-events-none`}>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-600/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute inset-0 bg-[linear-gradient(0deg,transparent_24%,rgba(79,172,254,0.05)_25%,rgba(79,172,254,0.05)_26%,transparent_27%,transparent_74%,rgba(79,172,254,0.05)_75%,rgba(79,172,254,0.05)_76%,transparent_77%,transparent),linear-gradient(90deg,transparent_24%,rgba(79,172,254,0.05)_25%,rgba(79,172,254,0.05)_26%,transparent_27%,transparent_74%,rgba(79,172,254,0.05)_75%,rgba(79,172,254,0.05)_76%,transparent_77%,transparent)] bg-size-[60px_60px]"></div>
      </div>

      <div className={fullScreen ? "relative z-10 min-h-screen" : "relative z-10 w-full h-full"}>
        <div className={fullScreen ? "relative w-screen h-screen" : "relative w-full h-full"}>
          <div className="absolute inset-0 border-2 border-cyan-500/30 rounded-3xl pointer-events-none" style={{ boxShadow: '0 0 30px rgba(34, 211, 238, 0.2), inset 0 0 30px rgba(34, 211, 238, 0.1)' }}></div>

          {/* Video container */}
          <div className="absolute inset-0 flex items-center justify-center p-0">
            <div className="relative w-full h-full rounded-2xl overflow-hidden bg-black shadow-2xl">
              <iframe
                ref={videoRef}
                src={STREAMPIXEL_VIDEO_URL}
                className="w-full h-full"
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
                style={{ border: 'none' }}
              />

              {isPlaying && (
                <div className="absolute inset-0 bg-linear-to-r from-blue-500/20 to-cyan-500/20 animate-pulse pointer-events-none"></div>
              )}

              {/* Classroom Board Overlay */}
              {slidesData.length > 0 && slidesData[currentSlideIndex] && (
                <div className="absolute inset-0 bg-[#1a1a1a] border-12 border-[#5d4037] rounded-none p-8 shadow-2xl flex flex-col items-center justify-center"
                  style={{
                    fontFamily: '"Comic Sans MS", "Chalkboard SE", sans-serif',
                    zIndex: 20
                  }}>
                  <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/black-chalkboard.png')] opacity-30 pointer-events-none"></div>

                  {/* Audio Control Button */}
                  {slidesData[currentSlideIndex].audio_url && (
                    <button
                      onClick={toggleAudio}
                      className={`absolute cursor-pointer top-4 right-4 z-30 p-3 rounded-full transition-all duration-300 ${audioPlaying
                        ? 'bg-green-500/20 border-2 border-green-500 text-green-400 shadow-lg shadow-green-500/50'
                        : 'bg-cyan-500/10 border-2 border-cyan-500 text-cyan-400 hover:shadow-lg hover:shadow-cyan-500/50'
                        }`}
                      title={(isRecording && audioPlaying) ? "Pause Audio" : "Play Audio"}
                    >
                      {(isRecording && audioPlaying) ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                    </button>
                  )}

                  <div className="relative w-full max-w-5xl h-full flex flex-col justify-center">
                    <h3 className="text-white text-2xl md:text-4xl font-bold mb-6 md:mb-10 border-b-2 border-white/20 pb-4 tracking-wide text-center shrink-0">
                      {animationStep === 0 ? (
                        <Typewriter text={slidesData[currentSlideIndex].title} speed={30} onComplete={() => setAnimationStep(1)} isPlaying={isPlaying} />
                      ) : (
                        <span>{slidesData[currentSlideIndex].title}</span>
                      )}
                    </h3>

                    <ul className="space-y-4 md:space-y-6 px-4 md:px-8">
                      {slidesData[currentSlideIndex].bullets?.map((bullet, idx) => {
                        const bulletStep = 1 + idx;
                        const isVisible = animationStep >= bulletStep;
                        const isAnimating = animationStep === bulletStep;
                        return (
                          <li key={idx}
                            className={`transition-all duration-700 flex items-start gap-3 md:gap-4 text-lg md:text-2xl leading-relaxed text-white
                                      ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`}
                          >
                            <span className="mt-2.5 w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-white shrink-0"></span>
                            {isAnimating ? (
                              <Typewriter text={bullet} speed={20} onComplete={() => setAnimationStep(bulletStep + 1)} isPlaying={isPlaying} />
                            ) : (
                              <span>{bullet}</span>
                            )}
                          </li>
                        );
                      })}
                    </ul>

                    {slidesData[currentSlideIndex].narration && (() => {
                      const narrationStep = 1 + (slidesData[currentSlideIndex].bullets?.length || 0);
                      const isVisible = animationStep >= narrationStep;
                      const isAnimating = animationStep === narrationStep;
                      return (
                        <div className={`mt-6 px-4 md:px-8 text-sm md:text-base text-gray-100/90 leading-relaxed transition-all duration-700 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`}>
                          {isAnimating ? (
                            <AudioSyncedTypewriter
                              text={slidesData[currentSlideIndex].narration}
                              audioDuration={audioDuration}
                              onComplete={() => setAnimationStep(narrationStep + 1)}
                              isPlaying={isPlaying}
                            />
                          ) : (
                            <span>{slidesData[currentSlideIndex].narration}</span>
                          )}
                        </div>
                      );
                    })()}

                    {slidesData[currentSlideIndex].question && (() => {
                      const narrationStep = 1 + (slidesData[currentSlideIndex].bullets?.length || 0);
                      const questionStep = narrationStep + (slidesData[currentSlideIndex].narration ? 1 : 0);
                      const isVisible = animationStep >= questionStep;
                      const isAnimating = animationStep === questionStep;
                      return (
                        <div className={`mt-4 px-4 md:px-8 text-sm md:text-base text-emerald-300/90 font-medium italic transition-all duration-700 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`}>
                          {isAnimating ? (
                            <Typewriter text={slidesData[currentSlideIndex].question} speed={20} onComplete={() => setAnimationStep(questionStep + 1)} isPlaying={isPlaying} />
                          ) : (
                            <span>{slidesData[currentSlideIndex].question}</span>
                          )}
                        </div>
                      );
                    })()}

                    {/* Slide Counter */}
                    <div className="absolute bottom-2 right-4 text-white/30 text-sm md:text-base font-mono">
                      Slide {currentSlideIndex + 1} / {slidesData.length}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Recognized speech overlay */}
          {recognizedText && (
            <div className="absolute bottom-24 left-1/2 -translate-x-1/2 w-[90vw] max-w-3xl p-4 bg-linear-to-r from-green-900/40 to-emerald-900/40 backdrop-blur-md rounded-xl border border-green-500/50 text-center pointer-events-none">
              <p className="text-cyan-100 text-lg font-medium">{recognizedText}</p>
            </div>
          )}

          {/* Error overlay */}
          {speechError && (
            <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[90vw] max-w-2xl p-3 bg-linear-to-r from-red-900/50 to-orange-900/50 backdrop-blur-md rounded-lg border border-red-500/50 text-center pointer-events-none">
              <p className="text-red-200 text-sm">{speechError}</p>
            </div>
          )}

          <style>{`
              to {
                opacity: 1;
                transform: translateX(0);
              }
            }
            @keyframes slideInRight {
              from {
                opacity: 0;
                transform: translateX(50px);
              }
              to {
                opacity: 1;
                transform: translateX(0);
              }
            }
          `}</style>
        </div>
      </div>
    </div>
  );
}