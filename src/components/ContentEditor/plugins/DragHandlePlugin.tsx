// Tay kéo ⠿ bên trái mỗi đoạn:
//  - Giữ và KÉO để đổi chỗ cả đoạn hoặc cả ảnh.
//  - BẤM để mở menu: thêm đoạn trên/dưới, nhân đôi, xoá đoạn.
// Plugin gốc canh tay kéo theo cả khối nên với tiêu đề nhiều dòng nhìn bị lệch,
// ở đây canh lại theo DÒNG ĐẦU của khối.
import { DraggableBlockPlugin_EXPERIMENTAL } from '@lexical/react/LexicalDraggableBlockPlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getNearestNodeFromDOMNode, $isElementNode } from 'lexical';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Swal from 'sweetalert2';
import { uploadNewsImage } from '../lib/upload';
import Icon from '../ui/icons';
import { createBlockActions, filterBlockActions } from './blockOptions';
import { INSERT_IMAGE_COMMAND } from './ImagesPlugin';

const HANDLE_CLASS = 'lexical-drag-handle';
const MENU_CLASS = 'lexical-block-picker';
const LEFT_OFFSET = 4;

function DragHandlePlugin({ anchorElem }: { anchorElem: HTMLElement | null }) {
    const [editor] = useLexicalComposerContext();
    const menuRef = useRef<HTMLDivElement>(null);
    const targetLineRef = useRef<HTMLDivElement>(null);
    const blockRef = useRef<HTMLElement | null>(null);
    const [handleEl, setHandleEl] = useState<HTMLDivElement | null>(null);
    const [isWideScreen, setIsWideScreen] = useState(() => (typeof window === 'undefined' ? true : window.matchMedia('(min-width: 768px)').matches));
    const [menuOpen, setMenuOpen] = useState(false);
    const [filter, setFilter] = useState('');
    // Toạ độ + chiều cao menu, chốt lúc mở. Menu tự co theo chỗ trống còn lại trên
    // màn hình (danh sách bên trong cuộn), nên không bao giờ tràn ra ngoài màn hình.
    const [menuBox, setMenuBox] = useState({ top: 0, left: 4, maxHeight: 360 });
    const menuOpenRef = useRef(false);
    const menuBlockRef = useRef<HTMLElement | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const actions = useMemo(() => createBlockActions(() => fileInputRef.current?.click()), []);
    const matching = useMemo(() => filterBlockActions(actions, filter), [actions, filter]);

    const attachHandle = useCallback((element: HTMLDivElement | null) => {
        menuRef.current = element;
        setHandleEl(element);
    }, []);

    /** Toạ độ canh giữa DÒNG ĐẦU của khối, không phải giữa cả khối */
    const transformFor = useCallback(
        (block: HTMLElement | null, handle: HTMLElement | null) => {
            if (!block || !handle || !anchorElem) return null;
            const blockBox = block.getBoundingClientRect();
            const anchorBox = anchorElem.getBoundingClientRect();
            const lineHeight = Number.parseFloat(getComputedStyle(block).lineHeight) || blockBox.height;
            const firstLineCenter = blockBox.top + Math.min(lineHeight, blockBox.height) / 2;
            const top = firstLineCenter - anchorBox.top + anchorElem.scrollTop - handle.offsetHeight / 2;
            return `translate(${LEFT_OFFSET}px, ${Math.round(top)}px)`;
        },
        [anchorElem],
    );

    // Plugin gốc đặt lại vị trí mỗi lần rê chuột, nên phải canh lại sau mỗi lần nó ghi style
    useEffect(() => {
        if (!handleEl) return;
        let correcting = false;
        const correct = () => {
            if (correcting) return;
            const wanted = transformFor(blockRef.current, handleEl);
            if (!wanted || handleEl.style.transform === wanted) return;
            correcting = true;
            handleEl.style.transform = wanted;
            correcting = false;
        };
        const observer = new MutationObserver(correct);
        observer.observe(handleEl, { attributes: true, attributeFilter: ['style'] });
        correct();
        return () => observer.disconnect();
    }, [handleEl, transformFor]);

    useEffect(() => {
        const query = window.matchMedia('(min-width: 768px)');
        const sync = () => setIsWideScreen(query.matches);
        query.addEventListener('change', sync);
        return () => query.removeEventListener('change', sync);
    }, []);

    useEffect(() => {
        menuOpenRef.current = menuOpen;
    }, [menuOpen]);

    useEffect(() => {
        if (!menuOpen) return;
        const close = (event: PointerEvent) => {
            if (!(event.target as HTMLElement)?.closest(`.${MENU_CLASS}, .${HANDLE_CLASS}`)) setMenuOpen(false);
        };
        document.addEventListener('pointerdown', close);
        return () => document.removeEventListener('pointerdown', close);
    }, [menuOpen]);

    /** Đặt con trỏ vào đúng khối đang trỏ tay kéo, rồi mới áp dụng lựa chọn */
    const focusBlock = () => {
        const block = menuBlockRef.current ?? blockRef.current;
        if (!block) return;
        editor.update(() => {
            const node = $getNearestNodeFromDOMNode(block)?.getTopLevelElement();
            if ($isElementNode(node)) node.selectEnd();
        });
    };

    const uploadAndInsert = async (file: File) => {
        try {
            const url = await uploadNewsImage(file);
            editor.dispatchCommand(INSERT_IMAGE_COMMAND, { src: url, altText: file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ') });
        } catch (error) {
            Swal.fire({ icon: 'error', title: 'Lỗi', text: error instanceof Error ? error.message : 'Upload ảnh thất bại.' });
        } finally {
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const removeBlock = () => {
        const block = menuBlockRef.current ?? blockRef.current;
        setMenuOpen(false);
        if (!block) return;
        editor.update(() => $getNearestNodeFromDOMNode(block)?.getTopLevelElement()?.remove());
    };

    // Tay kéo dựa vào rê chuột và kéo thả, điện thoại không dùng được.
    // Bày ra chỉ chật chỗ và bấm không ăn, nên ẩn hẳn dưới 768px.
    if (!anchorElem || !isWideScreen) return null;

    return (
        <>
            <DraggableBlockPlugin_EXPERIMENTAL
                anchorElem={anchorElem}
                menuRef={menuRef}
                targetLineRef={targetLineRef}
                isOnMenu={(element) => Boolean(element.closest(`.${HANDLE_CLASS}`) || element.closest(`.${MENU_CLASS}`))}
                onElementChanged={(element) => {
                    // Menu đang mở thì giữ nguyên khối đang thao tác, kệ chuột rê đi đâu
                    if (menuOpenRef.current) return;
                    blockRef.current = element;
                }}
                menuComponent={
                    <div
                        ref={attachHandle}
                        className={HANDLE_CLASS}
                        role="button"
                        tabIndex={0}
                        aria-label="Kéo để đổi chỗ, bấm để mở menu đoạn"
                        title="Giữ và kéo để đổi chỗ · Bấm để mở menu"
                        onClick={() => {
                            setFilter('');
                            setMenuOpen((open) => {
                                if (!open && handleEl && anchorElem) {
                                    const GAP = 6;
                                    const MIN_HEIGHT = 180;
                                    const MAX_HEIGHT = 380;
                                    const handleBox = handleEl.getBoundingClientRect();
                                    const anchorBox = anchorElem.getBoundingClientRect();
                                    const spaceBelow = window.innerHeight - handleBox.bottom - GAP * 2;
                                    const spaceAbove = handleBox.top - GAP * 2;
                                    const placeBelow = spaceBelow >= MIN_HEIGHT || spaceBelow >= spaceAbove;
                                    const maxHeight = Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, placeBelow ? spaceBelow : spaceAbove));
                                    setMenuBox({
                                        top: placeBelow
                                            ? handleBox.bottom - anchorBox.top + GAP
                                            : handleBox.top - anchorBox.top - maxHeight - GAP,
                                        left: 4,
                                        maxHeight,
                                    });
                                    menuBlockRef.current = blockRef.current;
                                }
                                return !open;
                            });
                        }}
                    >
                        <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
                            {[4, 8, 12].map((y) => [5, 11].map((x) => <circle key={`${x}-${y}`} cx={x} cy={y} r="1.4" fill="currentColor" />))}
                        </svg>
                    </div>
                }
                targetLineComponent={<div ref={targetLineRef} className="lexical-drag-line" />}
            />
            <input ref={fileInputRef} hidden type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={(event) => event.target.files?.[0] && uploadAndInsert(event.target.files[0])} />
            {menuOpen &&
                handleEl &&
                // Phải đưa vào cùng khung với tay kéo, nếu không toạ độ transform sẽ tính theo khung khác
                createPortal(
                    <div className="lexical-block-picker is-handle-menu" style={{ top: menuBox.top, left: menuBox.left, maxHeight: menuBox.maxHeight }} onMouseDown={(event) => event.preventDefault()}>
                        <input
                            className="lexical-block-picker-filter"
                            autoFocus
                            placeholder="Lọc khối…"
                            value={filter}
                            onChange={(event) => setFilter(event.target.value)}
                            onKeyDown={(event) => {
                                if (event.key === 'Escape') setMenuOpen(false);
                                if (event.key === 'Enter' && matching[0]) {
                                    event.preventDefault();
                                    setMenuOpen(false);
                                    focusBlock();
                                    matching[0].run(editor);
                                }
                            }}
                        />
                        <div className="lexical-block-picker-list">
                            {matching.length === 0 && <p className="lexical-block-picker-empty">Không có khối nào khớp.</p>}
                            {matching.map((action) => (
                                <button
                                    key={action.key}
                                    type="button"
                                    onClick={() => {
                                        setMenuOpen(false);
                                        focusBlock();
                                        action.run(editor);
                                    }}
                                >
                                    <Icon name={action.iconName} />
                                    <span>{action.label}</span>
                                </button>
                            ))}
                        </div>
                        <button type="button" className="lexical-block-picker-remove" onClick={removeBlock}>
                            <Icon name="close" />
                            <span>Xoá đoạn này</span>
                        </button>
                    </div>,
                    anchorElem,
                )}
        </>
    );
}

export { DragHandlePlugin };
