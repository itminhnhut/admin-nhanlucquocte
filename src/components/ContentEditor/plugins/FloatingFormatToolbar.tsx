// Bôi đen chữ là hiện ngay thanh định dạng nhỏ ngay trên chỗ bôi đen,
// khỏi phải đưa mắt lên thanh công cụ trên cùng.
import { $isLinkNode, TOGGLE_LINK_COMMAND } from '@lexical/link';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { mergeRegister } from '@lexical/utils';
import {
    $getSelection,
    $isRangeSelection,
    COMMAND_PRIORITY_LOW,
    FORMAT_TEXT_COMMAND,
    SELECTION_CHANGE_COMMAND,
    TextFormatType,
} from 'lexical';
import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { askUrl } from '../lib/dialogs';
import Icon from '../ui/icons';

const BUTTONS: readonly { format: TextFormatType; icon: string; title: string }[] = [
    { format: 'bold', icon: 'bold', title: 'In đậm (Ctrl+B)' },
    { format: 'italic', icon: 'italic', title: 'In nghiêng (Ctrl+I)' },
    { format: 'underline', icon: 'underline', title: 'Gạch chân (Ctrl+U)' },
    { format: 'strikethrough', icon: 'strikethrough', title: 'Gạch ngang chữ' },
];

const TOOLBAR_HEIGHT = 44;
const GAP = 10;

function FloatingFormatToolbar({ anchorElem }: { anchorElem: HTMLElement | null }) {
    const [editor] = useLexicalComposerContext();
    const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
    const [active, setActive] = useState<Record<string, boolean>>({});
    const [isLink, setIsLink] = useState(false);

    const update = useCallback(() => {
        if (!anchorElem) return;
        const selection = $getSelection();
        const nativeSelection = window.getSelection();

        if (
            !$isRangeSelection(selection) ||
            selection.isCollapsed() ||
            selection.getTextContent().trim() === '' ||
            !nativeSelection ||
            nativeSelection.rangeCount === 0 ||
            !editor.getRootElement()?.contains(nativeSelection.anchorNode)
        ) {
            setPosition(null);
            return;
        }

        setActive({
            bold: selection.hasFormat('bold'),
            italic: selection.hasFormat('italic'),
            underline: selection.hasFormat('underline'),
            strikethrough: selection.hasFormat('strikethrough'),
        });
        const node = selection.anchor.getNode();
        setIsLink($isLinkNode(node) || $isLinkNode(node.getParent()));

        const rangeBox = nativeSelection.getRangeAt(0).getBoundingClientRect();
        const anchorBox = anchorElem.getBoundingClientRect();
        // Sát mép trên thì lật xuống dưới vùng bôi đen cho khỏi bị khung cuộn cắt
        const above = rangeBox.top - anchorBox.top - TOOLBAR_HEIGHT - GAP;
        setPosition({
            top: above > 0 ? above : rangeBox.bottom - anchorBox.top + GAP,
            left: Math.max(4, rangeBox.left - anchorBox.left + rangeBox.width / 2),
        });
    }, [anchorElem, editor]);

    useEffect(
        () =>
            mergeRegister(
                editor.registerUpdateListener(({ editorState }) => editorState.read(update)),
                editor.registerCommand(
                    SELECTION_CHANGE_COMMAND,
                    () => {
                        update();
                        return false;
                    },
                    COMMAND_PRIORITY_LOW,
                ),
            ),
        [editor, update],
    );

    // Cuộn hoặc đổi cỡ cửa sổ thì vị trí cũ không còn đúng
    useEffect(() => {
        if (!position || !anchorElem) return;
        const recompute = () => editor.getEditorState().read(update);
        const scroller = anchorElem.querySelector('.lexical-content-editable');
        scroller?.addEventListener('scroll', recompute, { passive: true });
        window.addEventListener('resize', recompute);
        return () => {
            scroller?.removeEventListener('scroll', recompute);
            window.removeEventListener('resize', recompute);
        };
    }, [position, anchorElem, editor, update]);

    if (!anchorElem || !position) return null;

    return createPortal(
        <div className="lexical-floating-toolbar" style={{ top: position.top, left: position.left }} onMouseDown={(event) => event.preventDefault()}>
            {BUTTONS.map(({ format, icon, title }) => (
                <button
                    key={format}
                    type="button"
                    title={title}
                    className={active[format] ? 'is-active' : ''}
                    onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, format)}
                >
                    <Icon name={icon} />
                </button>
            ))}
            <span className="lexical-floating-divider" />
            <button
                type="button"
                title={isLink ? 'Bỏ liên kết' : 'Chèn liên kết'}
                className={isLink ? 'is-active' : ''}
                onClick={async () => {
                    if (isLink) {
                        editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
                        return;
                    }
                    const url = await askUrl({ title: 'Chèn liên kết', help: 'Dán đường dẫn muốn liên kết tới đoạn chữ đang chọn.' });
                    if (url) editor.dispatchCommand(TOGGLE_LINK_COMMAND, url);
                }}
            >
                <Icon name="link" />
            </button>
        </div>,
        anchorElem,
    );
}

export { FloatingFormatToolbar };
