import React, { useMemo } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

/**
 * MathTypingEffect Component
 * Renders text with typing animation while properly displaying LaTeX math expressions
 * 
 * Supports:
 * - Inline math: $...$ or \(...\)
 * - Block math: $$...$$ or \[...\]
 * - Step-by-step solutions with proper formatting
 */
const MathTypingEffect = ({ text, progress, isTyping = true }) => {
    // Parse text into segments: { type: 'text' | 'inline' | 'block', content: string }
    const segments = useMemo(() => {
        if (!text) return [];

        const result = [];
        let currentIndex = 0;

        // Regex to match all LaTeX patterns:
        // $$...$$ (block), $...$ (inline), \[...\] (block), \(...\) (inline)
        const mathRegex = /(\$\$[\s\S]+?\$\$|\$[^\$\n]+?\$|\\\[[\s\S]+?\\\]|\\\([\s\S]+?\\\))/g;
        let match;

        while ((match = mathRegex.exec(text)) !== null) {
            // Add text before math
            if (match.index > currentIndex) {
                result.push({
                    type: 'text',
                    content: text.slice(currentIndex, match.index),
                    startPos: currentIndex
                });
            }

            // Determine math type and extract content
            const mathContent = match[0];
            let type = 'inline';
            let content = '';

            if (mathContent.startsWith('$$') && mathContent.endsWith('$$')) {
                type = 'block';
                content = mathContent.slice(2, -2);
            } else if (mathContent.startsWith('$') && mathContent.endsWith('$')) {
                type = 'inline';
                content = mathContent.slice(1, -1);
            } else if (mathContent.startsWith('\\[') && mathContent.endsWith('\\]')) {
                type = 'block';
                content = mathContent.slice(2, -2);
            } else if (mathContent.startsWith('\\(') && mathContent.endsWith('\\)')) {
                type = 'inline';
                content = mathContent.slice(2, -2);
            }

            result.push({
                type,
                content,
                startPos: match.index,
                length: mathContent.length
            });

            currentIndex = match.index + mathContent.length;
        }

        // Add remaining text
        if (currentIndex < text.length) {
            result.push({
                type: 'text',
                content: text.slice(currentIndex),
                startPos: currentIndex
            });
        }

        // Calculate total length for progress calculation
        let totalLength = 0;
        result.forEach(seg => {
            if (seg.type === 'text') {
                totalLength += seg.content.length;
            } else {
                // Math expressions count as a single unit for typing
                totalLength += 1;
            }
        });

        // Add totalLength info to each segment
        let pos = 0;
        result.forEach(seg => {
            seg.progressStart = pos / totalLength;
            if (seg.type === 'text') {
                pos += seg.content.length;
            } else {
                pos += 1;
            }
            seg.progressEnd = pos / totalLength;
        });

        return result;
    }, [text]);

    // Render KaTeX safely
    const renderMath = (content, displayMode = false) => {
        try {
            const html = katex.renderToString(content, {
                displayMode,
                throwOnError: false,
                strict: false
            });
            return <span dangerouslySetInnerHTML={{ __html: html }} />;
        } catch (e) {
            // Fallback to plain text if KaTeX fails
            return <span>{content}</span>;
        }
    };

    // If fully complete, render all segments
    if (progress >= 1) {
        return (
            <span>
                {segments.map((seg, index) => {
                    if (seg.type === 'text') {
                        return <span key={index}>{seg.content}</span>;
                    } else if (seg.type === 'block') {
                        return (
                            <span key={index} className="block my-2">
                                {renderMath(seg.content, true)}
                            </span>
                        );
                    } else {
                        return <span key={index}>{renderMath(seg.content, false)}</span>;
                    }
                })}
            </span>
        );
    }

    // Render with progress-based visibility
    return (
        <span>
            {segments.map((seg, index) => {
                // Check if this segment should be visible
                if (progress < seg.progressStart) {
                    // Not visible yet
                    return null;
                }

                if (progress >= seg.progressEnd) {
                    // Fully visible
                    if (seg.type === 'text') {
                        return <span key={index}>{seg.content}</span>;
                    } else if (seg.type === 'block') {
                        return (
                            <span key={index} className="block my-2">
                                {renderMath(seg.content, true)}
                            </span>
                        );
                    } else {
                        return <span key={index}>{renderMath(seg.content, false)}</span>;
                    }
                }

                // Partially visible (only for text segments)
                if (seg.type === 'text') {
                    const segmentProgress = (progress - seg.progressStart) / (seg.progressEnd - seg.progressStart);
                    const visibleChars = Math.floor(segmentProgress * seg.content.length);
                    return <span key={index}>{seg.content.slice(0, visibleChars)}</span>;
                } else {
                    // Math expressions appear all at once when their turn comes
                    const segmentProgress = (progress - seg.progressStart) / (seg.progressEnd - seg.progressStart);
                    if (segmentProgress >= 0.5) {
                        if (seg.type === 'block') {
                            return (
                                <span key={index} className="block my-2">
                                    {renderMath(seg.content, true)}
                                </span>
                            );
                        } else {
                            return <span key={index}>{renderMath(seg.content, false)}</span>;
                        }
                    }
                    return null;
                }
            })}
            {/* Blinking cursor effect - only show if actively typing */}
            {isTyping && progress < 1 && (
                <span className="inline-block w-0.5 h-4 ml-0.5 bg-gray-800 animate-pulse align-middle"></span>
            )}
        </span>
    );
};

export default MathTypingEffect;
