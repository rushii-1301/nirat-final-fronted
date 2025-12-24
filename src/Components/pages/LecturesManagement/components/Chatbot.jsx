// import React, { useState, useRef, useEffect } from 'react';
// import { X, Mic, MicOff, SendHorizontal, Bot } from 'lucide-react';

// function Chatbot({ messages, onSendMessage, onClose }) {
//     const [currentMessage, setCurrentMessage] = useState('');
//     const [micStatus, setMicStatus] = useState('idle');
//     const chatContainerRef = useRef(null);
//     const recognitionRef = useRef(null);

//     // Auto-scroll to bottom
//     useEffect(() => {
//         if (chatContainerRef.current) {
//             chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
//         }
//     }, [messages]);

//     const startVoiceRecognition = () => {
//         const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
//         if (!SpeechRecognition) {
//             alert('Speech recognition not supported');
//             return;
//         }

//         const recognition = new SpeechRecognition();
//         recognition.continuous = false;
//         recognition.interimResults = true;
//         recognition.lang = 'en-US';

//         recognition.onstart = () => {
//             setMicStatus('listening');
//             setCurrentMessage('');
//         };

//         recognition.onresult = (event) => {
//             const transcript = Array.from(event.results)
//                 .map(result => result[0].transcript)
//                 .join('');
//             setCurrentMessage(transcript);
//         };

//         recognition.onerror = (event) => {
//             console.error('Recognition error:', event.error);
//             setMicStatus('idle');
//         };

//         recognition.onend = () => {
//             setMicStatus('idle');
//             // Auto-send if we have text
//             if (currentMessage.trim()) {
//                 handleSend();
//             }
//         };

//         recognitionRef.current = recognition;
//         recognition.start();
//     };

//     const stopVoiceRecognition = () => {
//         if (recognitionRef.current) {
//             recognitionRef.current.stop();
//         }
//     };

//     const handleMicClick = () => {
//         if (micStatus === 'listening') {
//             stopVoiceRecognition();
//         } else {
//             startVoiceRecognition();
//         }
//     };

//     const handleSend = () => {
//         if (currentMessage.trim()) {
//             onSendMessage(currentMessage.trim());
//             setCurrentMessage('');
//         }
//     };

//     return (
//         <div className="fixed right-6 bottom-6 w-80 rounded-3xl border border-gray-200 shadow-2xl overflow-hidden flex flex-col z-50 bg-white">
//             {/* Header */}
//             <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
//                 <h3 className="font-semibold text-sm text-gray-900">AI Assistant</h3>
//                 <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-200 text-gray-600">
//                     <X size={18} />
//                 </button>
//             </div>

//             {/* Messages */}
//             {/* <div ref={chatContainerRef} className="p-4 space-y-4 max-h-96 overflow-y-auto flex-1">
//                 {messages.map((msg) => (
//                     <div key={msg.id} className={`flex items-end gap-3 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
//                         {msg.sender === 'system' && (
//                             <div className="shrink-0 w-8 h-8 rounded-full bg-gray-300"></div>
//                         )}

//                         <div className={`px-4 py-2 text-sm max-w-[80%] ${msg.sender === 'system'
//                             ? 'border rounded-2xl rounded-bl-none bg-gray-100 border-gray-200 text-gray-800'
//                             : 'rounded-2xl rounded-br-none font-medium bg-gray-800 text-white'
//                             }`}
//                         >
//                             {msg.text}
//                         </div>

//                         {msg.sender === 'user' && (
//                             <div className="w-8 h-8 rounded-full shrink-0 bg-gray-400"></div>
//                         )}
//                     </div>
//                 ))}
//             </div> */}

//             {/* Input */}
//             <div ref={chatContainerRef} className="p-4 space-y-4 max-h-96 overflow-y-auto flex-1 scrollbar-none">
//                 {messages.map((msg) => (
//                     <div key={msg.id} className={`flex items-end gap-3 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
//                         {msg.sender === 'system' && (
//                             <div className="shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center border border-gray-200">
//                                 <Bot size={18} className="text-gray-600" />
//                             </div>
//                         )}

//                         <div className={`px-4 py-2 text-sm max-w-[80%] ${msg.sender === 'system'
//                             ? 'border rounded-2xl rounded-bl-none bg-gray-100 border-gray-200 text-gray-800'
//                             : 'rounded-2xl rounded-br-none font-medium bg-gray-800 text-white'
//                             }`}>
//                             {msg.text}
//                         </div>

//                         {msg.sender === 'user' && (
//                             <div className="w-8 h-8 rounded-full shrink-0 bg-gray-400"></div>
//                         )}
//                     </div>
//                 ))}
//             </div>

//             {/* Input */}
//             <div className="p-3 border-t border-gray-200 bg-white">
//                 <div className="flex items-center gap-2">
//                     <button
//                         onClick={handleMicClick}
//                         className={`w-10 h-10 shrink-0 flex items-center justify-center rounded-full transition-all ${micStatus === 'listening'
//                             ? 'bg-red-500 hover:bg-red-600 animate-pulse text-white'
//                             : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
//                             }`}
//                     >
//                         {micStatus === 'listening' ? <Mic size={20} /> : <Mic size={20} />}
//                     </button>

//                     <div className="relative flex-1">
//                         <input
//                             type="text"
//                             value={currentMessage}
//                             onChange={(e) => setCurrentMessage(e.target.value)}
//                             onKeyDown={(e) => e.key === 'Enter' && handleSend()}
//                             placeholder="Send your message..."
//                             className="w-full pl-4 pr-12 py-3 rounded-full text-sm outline-none border border-gray-200 focus:border-gray-400 bg-gray-50"
//                         />
//                         <button
//                             onClick={handleSend}
//                             className="absolute right-1.5 w-9 h-9 rounded-full flex items-center justify-center bg-gray-800 text-white hover:bg-gray-700"
//                         >
//                             <SendHorizontal size={16} className="ml-0.5" />
//                         </button>
//                     </div>
//                 </div>
//             </div>
//         </div>
//     );
// }

// export default Chatbot;



















import React, { useState, useRef, useEffect } from 'react';
import { X, Mic, MicOff, SendHorizontal, Bot } from 'lucide-react';

function Chatbot({ messages, onSendMessage, onClose }) {
    const [currentMessage, setCurrentMessage] = useState('');
    const [micStatus, setMicStatus] = useState('idle');
    const chatContainerRef = useRef(null);
    const recognitionRef = useRef(null);

    // Auto-scroll to bottom
    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages]);

    const startVoiceRecognition = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert('Speech recognition not supported');
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
            setMicStatus('listening');
            setCurrentMessage('');
        };

        recognition.onresult = (event) => {
            const transcript = Array.from(event.results)
                .map(result => result[0].transcript)
                .join('');
            setCurrentMessage(transcript);
        };

        recognition.onerror = (event) => {
            console.error('Recognition error:', event.error);
            setMicStatus('idle');
        };

        recognition.onend = () => {
            setMicStatus('idle');
            // Auto-send if we have text
            if (currentMessage.trim()) {
                handleSend();
            }
        };

        recognitionRef.current = recognition;
        recognition.start();
    };

    const stopVoiceRecognition = () => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
    };

    const handleMicClick = () => {
        if (micStatus === 'listening') {
            stopVoiceRecognition();
        } else {
            startVoiceRecognition();
        }
    };

    const handleSend = () => {
        if (currentMessage.trim()) {
            onSendMessage(currentMessage.trim());
            setCurrentMessage('');
        }
    };

    return (
        <div className="fixed right-6 bottom-6 w-80 rounded-3xl border border-gray-200 shadow-2xl overflow-hidden flex flex-col z-50 bg-white">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
                <h3 className="font-semibold text-sm text-gray-900">AI Assistant</h3>
                <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-200 text-gray-600">
                    <X size={18} />
                </button>
            </div>

            {/* Messages */}
            <div ref={chatContainerRef} className="p-4 space-y-4 max-h-96 overflow-y-auto flex-1 scrollbar-none">
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex items-end gap-3 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
                        {msg.sender === 'system' && (
                            <div className="shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center border border-gray-200">
                                <Bot size={18} className="text-gray-600" />
                            </div>
                        )}

                        <div className={`px-4 py-2 text-sm max-w-[80%] ${msg.sender === 'system'
                            ? 'border rounded-2xl rounded-bl-none bg-gray-100 border-gray-200 text-gray-800'
                            : 'rounded-2xl rounded-br-none font-medium bg-gray-800 text-white'
                            }`}>
                            {msg.text}
                        </div>

                        {msg.sender === 'user' && (
                            <div className="w-8 h-8 rounded-full shrink-0 bg-gray-400"></div>
                        )}
                    </div>
                ))}
            </div>

            {/* Input */}
            <div className="p-3 border-t border-gray-200 bg-white">
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleMicClick}
                        className={`w-10 h-10 shrink-0 flex items-center justify-center rounded-full transition-all ${micStatus === 'listening'
                            ? 'bg-red-500 hover:bg-red-600 animate-pulse text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                    >
                        {micStatus === 'listening' ? <Mic size={20} /> : <Mic size={20} />}
                    </button>

                    <div className="relative flex-1">
                        <input
                            type="text"
                            value={currentMessage}
                            onChange={(e) => setCurrentMessage(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            placeholder="Send your message..."
                            className="w-full pl-4 py-3 rounded-full text-sm outline-none border border-gray-200 focus:border-gray-400 bg-gray-50"
                        />
                    </div>
                    <button
                        onClick={handleSend}
                        className="w-9 h-9 rounded-full flex items-center justify-center bg-gray-800 text-white hover:bg-gray-700"
                    >
                        <SendHorizontal size={16} className="ml-0.5" />
                    </button>
                </div>
            </div>
        </div>
    );
}

export default Chatbot;
