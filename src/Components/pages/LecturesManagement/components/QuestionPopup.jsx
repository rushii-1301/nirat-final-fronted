import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';

function QuestionPopup({ isOpen, onResponse, onClose }) {
    const [transcript, setTranscript] = useState('');
    const [timeLeft, setTimeLeft] = useState(15);
    const recognitionRef = useRef(null);
    const timerRef = useRef(null);

    useEffect(() => {
        if (!isOpen) {
            setTranscript('');
            setTimeLeft(15);
            if (recognitionRef.current) {
                try {
                    recognitionRef.current.stop();
                } catch (e) { }
            }
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
            return;
        }

        // Start voice recognition
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            const recognition = new SpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = 'en-IN';

            recognition.onresult = (event) => {
                let text = '';
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    text += event.results[i][0].transcript;
                }
                text = text.toLowerCase().trim();
                setTranscript(text);

                if (event.results[event.results.length - 1].isFinal) {
                    const yesKeywords = ["yes", "ha", "haan", "haa", "yeah", "yep", "hmm"];
                    const noKeywords = ["no", "nahi", "na", "next", "nope"];

                    if (yesKeywords.some(kw => text.includes(kw))) {
                        onResponse('YES');
                    } else if (noKeywords.some(kw => text.includes(kw))) {
                        onResponse('NO');
                    }
                }
            };

            recognition.onerror = (event) => {
                console.error('Recognition error:', event.error);
            };

            try {
                recognition.start();
                recognitionRef.current = recognition;
            } catch (e) {
                console.error('Failed to start recognition:', e);
            }
        }

        // Start countdown timer
        timerRef.current = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timerRef.current);
                    onResponse('NO');
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => {
            if (recognitionRef.current) {
                try {
                    recognitionRef.current.stop();
                } catch (e) { }
            }
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, [isOpen, onResponse]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
                <div className="flex justify-between items-start mb-6">
                    <h3 className="text-xl font-bold text-gray-900">Do you have any questions?</h3>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
                        <X size={20} />
                    </button>
                </div>

                <div className="mb-6">
                    <div className="flex items-center justify-center mb-4">
                        <div className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center animate-pulse">
                            <div className="w-4 h-4 rounded-full bg-white"></div>
                        </div>
                    </div>

                    {transcript && (
                        <div className="p-4 bg-gray-100 rounded-lg mb-4">
                            <p className="text-gray-800 text-center">{transcript}</p>
                        </div>
                    )}

                    <p className="text-center text-gray-600 text-sm">
                        Say "Yes" or "No" • Time remaining: {timeLeft}s
                    </p>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={() => onResponse('NO')}
                        className="flex-1 px-6 py-3 bg-gray-200 text-gray-800 rounded-full font-semibold hover:bg-gray-300 transition-colors"
                    >
                        No
                    </button>
                    <button
                        onClick={() => onResponse('YES')}
                        className="flex-1 px-6 py-3 bg-gray-800 text-white rounded-full font-semibold hover:bg-gray-700 transition-colors"
                    >
                        Yes
                    </button>
                </div>
            </div>
        </div>
    );
}

export default QuestionPopup;
