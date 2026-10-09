import { FC, useState } from 'react';

type TextWithCopyProps = {
    text?: string;
    className?: string; // optional: custom width nếu cần
};

const TextWithCopy: FC<TextWithCopyProps> = ({ text, className }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        if (!text) return;

        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(text);
            } else {
                const textarea = document.createElement('textarea');
                textarea.value = text;
                textarea.style.position = 'fixed';
                textarea.style.opacity = '0';
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand('copy');
                document.body.removeChild(textarea);
            }

            setCopied(true);
            setTimeout(() => setCopied(false), 1200);
        } catch (error) {
            console.error('Copy failed:', error);
        }
    };

    if (!text) {
        return <span>-</span>;
    }

    return (
        <div className="flex items-center gap-1">
            <span title={text} className={className}>
                {text}
            </span>
            <button type="button" onClick={handleCopy} className="text-primary hover:opacity-80 transition">
                {copied ? (
                    // Icon check
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                ) : (
                    // Icon copy
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h6a2 2 0 012 2v2m-4 12h6a2 2 0 002-2v-6a2 2 0 00-2-2h-6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                    </svg>
                )}
            </button>
        </div>
    );
};

export default TextWithCopy;
