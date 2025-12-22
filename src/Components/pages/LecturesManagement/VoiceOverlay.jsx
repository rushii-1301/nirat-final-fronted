import React from 'react';
import { Mic } from 'lucide-react';

function VoiceOverlay({ isVoiceProcessing, currentMessage, isDark }) {
    if (!isVoiceProcessing) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-none">
            <div className={`max-w-md w-full mx-4 rounded-2xl shadow-2xl overflow-hidden pointer-events-auto ${isDark ? "bg-zinc-900 border border-zinc-800" : "bg-white border border-zinc-200"
                }`}>
                {/* Header */}
                <div className={`px-6 py-4 border-b ${isDark ? "border-zinc-800 bg-zinc-900/50" : "border-zinc-200 bg-zinc-50/50"}`}>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center animate-pulse">
                            <Mic className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className={`font-semibold text-sm ${isDark ? "text-white" : "text-zinc-900"}`}>Listening...</h3>
                            <p className={`text-xs ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>Speak now</p>
                        </div>
                    </div>
                </div>

                {/* Transcript Display */}
                <div className={`px-6 py-6 min-h-[100px] ${isDark ? "bg-zinc-900" : "bg-white"}`}>
                    {currentMessage ? (
                        <p className={`text-base leading-relaxed ${isDark ? "text-white" : "text-zinc-900"}`}>
                            "{currentMessage}"
                        </p>
                    ) : (
                        <p className={`text-sm italic ${isDark ? "text-zinc-500" : "text-zinc-400"}`}>
                            Waiting for input...
                        </p>
                    )}
                </div>

                {/* Footer Hint */}
                <div className={`px-6 py-3 border-t ${isDark ? "border-zinc-800 bg-zinc-900/50" : "border-zinc-200 bg-zinc-50/50"}`}>
                    <p className={`text-xs text-center ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>
                        Say "No" or "Next" to continue • Ask a question to open chat
                    </p>
                </div>
            </div>
        </div>
    );
}

export default VoiceOverlay;
