// Đặt con trỏ vào một liên kết là hiện ngay ô nhỏ cho xem địa chỉ, mở thử, sửa hoặc bỏ.
// Trước đây muốn sửa link phải bôi đen lại rồi chèn đè.
import { $isLinkNode, TOGGLE_LINK_COMMAND } from '@lexical/link';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { mergeRegister } from '@lexical/utils';
import { $getSelection, $isRangeSelection, COMMAND_PRIORITY_LOW, SELECTION_CHANGE_COMMAND } from 'lexical';
import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { askUrl } from '../lib/dialogs';
import Icon from '../ui/icons';

const BAR_HEIGHT = 40;
const GAP = 8;

function FloatingLinkEditor({ anchorElem }: { anchorElem: HTMLElement | null }) {
    const [editor] = useLexicalComposerContext();
    const [link, setLink] = useState<{ url: string; top: number; left: number } | null>(null);

    const update = useCallback(() => {
        if (!anchorElem) return;
        const selection = $getSelection();
        if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
            setLink(null);
            return;
        }
        const node = selection.anchor.getNode();
        const parent = node.getParent();
        const linkNode = $isLinkNode(node) ? node : $isLinkNode(parent) ? parent : null;
        if (!linkNode) {
            setLink(null);
            return;
        }
        const element = editor.getElementByKey(linkNode.getKey());
        if (!element) {
            setLink(null);
            return;
        }
        const linkBox = element.getBoundingClientRect();
        const anchorBox = anchorElem.getBoundingClientRect();
        const above = linkBox.top - anchorBox.top - BAR_HEIGHT - GAP;
        setLink({
            url: linkNode.getURL(),
            top: above > 0 ? above : linkBox.bottom - anchorBox.top + GAP,
            left: Math.max(4, linkBox.left - anchorBox.left),
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

    if (!anchorElem || !link) return null;

    return createPortal(
        <div className="lexical-link-bar" style={{ top: link.top, left: link.left }} onMouseDown={(event) => event.preventDefault()}>
            <Icon name="link" />
            <span className="lexical-link-url" title={link.url}>
                {link.url}
            </span>
            <a href={link.url} target="_blank" rel="noopener noreferrer" title="Mở thử liên kết trong tab mới">
                Mở
            </a>
            <button
                type="button"
                title="Sửa địa chỉ liên kết"
                onClick={async () => {
                    const url = await askUrl({ title: 'Sửa liên kết', help: 'Đổi địa chỉ mà đoạn chữ này trỏ tới.', initial: link.url });
                    if (url) editor.dispatchCommand(TOGGLE_LINK_COMMAND, url);
                }}
            >
                Sửa
            </button>
            <button type="button" className="is-danger" title="Bỏ liên kết, giữ nguyên chữ" onClick={() => editor.dispatchCommand(TOGGLE_LINK_COMMAND, null)}>
                Bỏ liên kết
            </button>
        </div>,
        anchorElem,
    );
}

export { FloatingLinkEditor };
