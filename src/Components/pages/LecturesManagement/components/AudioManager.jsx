import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react';

const AudioManager = forwardRef(({ audioContext, analyserNode, onAudioSourceChange }, ref) => {
    const slideAudioRef = useRef(null);
    const chatbotAudioRef = useRef(null);
    const slideSourceRef = useRef(null);
    const chatbotSourceRef = useRef(null);
    const [slideAudioBuffer, setSlideAudioBuffer] = useState(null);
    const slideStartTime = useRef(0);
    const slidePauseTime = useRef(0);

    useImperativeHandle(ref, () => ({
        getSlideElapsed() {
            if (audioContext) {
                return audioContext.currentTime - slideStartTime.current;
            }
            return 0;
        },

        async playSlideAudio(url, onEnded) {
            try {
                // Stop any existing audio
                if (slideSourceRef.current) {
                    slideSourceRef.current.stop();
                    slideSourceRef.current.disconnect();
                }
                if (chatbotSourceRef.current) {
                    chatbotSourceRef.current.stop();
                    chatbotSourceRef.current.disconnect();
                }

                // Fetch and decode audio
                const response = await fetch(url);
                const arrayBuffer = await response.arrayBuffer();
                const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

                setSlideAudioBuffer(audioBuffer);

                // Create source
                const source = audioContext.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(analyserNode);
                analyserNode.connect(audioContext.destination);

                slideSourceRef.current = source;
                onAudioSourceChange(source);

                source.onended = () => {
                    if (onEnded) onEnded();
                };

                // Resume context if suspended
                if (audioContext.state === 'suspended') {
                    await audioContext.resume();
                }

                source.start(0);
                slideStartTime.current = audioContext.currentTime;

                // Return duration so parent can handle progress
                return { duration: audioBuffer.duration };

            } catch (error) {
                console.error('Failed to play slide audio:', error);
                return { duration: 0 };
            }
        },

        pauseSlideAudio() {
            if (slideSourceRef.current && audioContext) {
                const elapsed = audioContext.currentTime - slideStartTime.current;
                slidePauseTime.current = elapsed;
                slideSourceRef.current.stop();
                slideSourceRef.current.disconnect();
                slideSourceRef.current = null;
            }
        },

        async resumeSlideAudio() {
            if (slideAudioBuffer && audioContext) {
                const source = audioContext.createBufferSource();
                source.buffer = slideAudioBuffer;
                source.connect(analyserNode);
                analyserNode.connect(audioContext.destination);

                slideSourceRef.current = source;
                onAudioSourceChange(source);

                if (audioContext.state === 'suspended') {
                    await audioContext.resume();
                }

                source.start(0, slidePauseTime.current);
                slideStartTime.current = audioContext.currentTime - slidePauseTime.current;
            }
        },

        async playChatbotAudio(url) {
            try {
                // Pause slide audio
                if (slideSourceRef.current) {
                    const elapsed = audioContext.currentTime - slideStartTime.current;
                    slidePauseTime.current = elapsed;
                    slideSourceRef.current.stop();
                    slideSourceRef.current.disconnect();
                }

                // Play chatbot audio
                const response = await fetch(url);
                const arrayBuffer = await response.arrayBuffer();
                const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

                const source = audioContext.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(analyserNode);
                analyserNode.connect(audioContext.destination);

                chatbotSourceRef.current = source;
                onAudioSourceChange(source);

                if (audioContext.state === 'suspended') {
                    await audioContext.resume();
                }

                source.start(0);

            } catch (error) {
                console.error('Failed to play chatbot audio:', error);
            }
        }
    }));

    return null;
});

AudioManager.displayName = 'AudioManager';

export default AudioManager;
