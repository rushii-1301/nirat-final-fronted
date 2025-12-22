import React, { useMemo } from 'react';

const TypingEffect = ({ text, progress, isBullet = false }) => {
    // Memoize the visible text calculation to avoid unnecessary recalculations
    const visibleText = useMemo(() => {
        if (!text) return '';
        const totalChars = text.length;
        const visibleCount = Math.floor(progress * totalChars);
        return text.slice(0, visibleCount);
    }, [text, progress]);

    // If fully complete, just return the text
    if (progress >= 1) {
        return <span>{text}</span>;
    }

    return (
        <span>
            {visibleText}
            {/* Blinking cursor effect */}
            <span className="inline-block w-0.5 h-4 ml-0.5 bg-gray-800 animate-pulse align-middle"></span>
        </span>
    );
};

export default TypingEffect;
