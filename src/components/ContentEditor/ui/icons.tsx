// Bộ icon SVG cho thanh công cụ soạn bài. Vẽ inline để không phụ thuộc thư viện icon nào.
import { memo } from 'react';

const PATHS: Record<string, string> = {
    undo: 'M9 14 4 9l5-5M4 9h7a6 6 0 1 1 0 12H8',
    redo: 'm15 14 5-5-5-5M20 9h-7a6 6 0 1 0 0 12h3',
    bold: 'M7 4h6a4 4 0 0 1 0 8H7zM7 12h7a4 4 0 0 1 0 8H7z',
    italic: 'M15 4h-5M14 20H9M15 4l-5 16',
    underline: 'M7 4v7a5 5 0 0 0 10 0V4M5 21h14',
    strikethrough: 'M7 7a3.5 3.5 0 0 1 3.5-3h3A3.5 3.5 0 0 1 17 7M17 17a3.5 3.5 0 0 1-3.5 3h-3A3.5 3.5 0 0 1 7 17M4 12h16',
    code: 'm9 16-4-4 4-4M15 8l4 4-4 4',
    link: 'M10 13a5 5 0 0 0 7 0l2-2a5 5 0 0 0-7-7l-1 1M14 11a5 5 0 0 0-7 0l-2 2a5 5 0 0 0 7 7l1-1',
    image: 'M3 5h18v14H3zM3 16l5-5 4 4 3-3 6 6',
    video: 'M3 6h12v12H3zM15 10l6-3v10l-6-3',
    paragraph: 'M8 4h9M11 4v16M8 4a4 4 0 0 0 0 8h3',
    h1: 'M4 6v12M12 6v12M4 12h8M17 18V9l-2.5 2',
    h2: 'M4 6v12M12 6v12M4 12h8M16 11a2 2 0 1 1 4 0c0 2-4 3-4 7h4',
    h3: 'M4 6v12M12 6v12M4 12h8M16 10a2 2 0 1 1 3.4 1.5A2 2 0 1 1 16 16',
    listBullet: 'M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01',
    listNumber: 'M10 6h10M10 12h10M10 18h10M4 7V4l-1 .8M3 12h2.5L3 16h2.5',
    listCheck: 'M10 6h10M10 12h10M10 18h10M3 6l1.5 1.5L7 5M3 12l1.5 1.5L7 11M3 18l1.5 1.5L7 17',
    quote: 'M7 7H4v4h3c0 3-1 4-3 4M17 7h-3v4h3c0 3-1 4-3 4',
    alignLeft: 'M4 6h16M4 12h10M4 18h13',
    alignCenter: 'M4 6h16M7 12h10M6 18h12',
    alignRight: 'M4 6h16M10 12h10M7 18h13',
    alignJustify: 'M4 6h16M4 12h16M4 18h16',
    indent: 'M11 6h9M11 12h9M11 18h9M4 9l3 3-3 3',
    outdent: 'M11 6h9M11 12h9M11 18h9M7 9l-3 3 3 3',
    superscript: 'M4 7l8 10M12 7L4 17M18 4h2a1.5 1.5 0 0 1 .6 2.4L18 9h3',
    subscript: 'M4 5l8 10M12 5l-8 10M18 15h2a1.5 1.5 0 0 1 .6 2.4L18 20h3',
    clearFormat: 'M7 5h12M11 5 8 19M5 19h7M15 13l5 5M20 13l-5 5',
    fontColor: 'M6 15 11 5l5 10M7.6 12h6.8M4 20h16',
    bgColor: 'M5 4h11v9H5zM3 20h18M8 8h5',
    hr: 'M4 12h16M7 7h10M7 17h10',
    table: 'M3 5h18v14H3zM3 10h18M3 15h18M9 5v14M15 5v14',
    caret: 'm6 9 6 6 6-6',
    close: 'M6 6l12 12M18 6 6 18',
};

type IconProps = { name: keyof typeof PATHS | string; className?: string };

/** Icon 18×18, dùng currentColor nên tự ăn màu chữ của nút */
const Icon = memo(({ name, className }: IconProps) => (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
        <path d={PATHS[name] ?? ''} />
    </svg>
));

Icon.displayName = 'Icon';

export default Icon;
