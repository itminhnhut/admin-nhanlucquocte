// Ảnh hiển thị trong editor: chọn, canh lề, sửa chú thích, xoá, kéo đổi kích thước.
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useLexicalEditable } from '@lexical/react/useLexicalEditable';
import { useLexicalNodeSelection } from '@lexical/react/useLexicalNodeSelection';
import { mergeRegister } from '@lexical/utils';
import {
    $createParagraphNode,
    $getNodeByKey,
    $getSelection,
    $isNodeSelection,
    CLICK_COMMAND,
    COMMAND_PRIORITY_LOW,
    DRAGSTART_COMMAND,
    KEY_BACKSPACE_COMMAND,
    KEY_DELETE_COMMAND,
    KEY_ENTER_COMMAND,
    KEY_ESCAPE_COMMAND,
} from 'lexical';
import { useEffect, useRef } from 'react';
import { askText } from '../lib/dialogs';
import type { ImageAlignment } from '../lib/html';
import { $isImageNode } from '../nodes/ImageNode';
import ImageResizeHandles from './ImageResizeHandles';
import Icon from './icons';

export default SelectableImage;

function SelectableImage({
    nodeKey,
    src,
    altText,
    caption,
    alignment,
    width,
    height,
    maxWidth,
}: {
    nodeKey: string;
    src: string;
    altText: string;
    caption: string;
    alignment: ImageAlignment;
    width: number | 'inherit';
    height: number | 'inherit';
    maxWidth: number;
}) {
    const [editor] = useLexicalComposerContext();
    const [selected, setSelected, clearSelection] = useLexicalNodeSelection(nodeKey);
    const isEditable = useLexicalEditable();
    const imageRef = useRef<HTMLImageElement>(null);
    const selectedRef = useRef(selected);

    useEffect(() => {
        selectedRef.current = selected;
    }, [selected]);

    useEffect(() => {
        const removeSelectedImage = (event: KeyboardEvent | null) => {
            const selection = $getSelection();
            if (!$isNodeSelection(selection) || !selection.has(nodeKey)) return false;
            event?.preventDefault();
            $getNodeByKey(nodeKey)?.remove();
            return true;
        };

        return mergeRegister(
            editor.registerCommand(
                CLICK_COMMAND,
                (event) => {
                    if (event.target !== imageRef.current) return false;
                    if (!event.shiftKey) clearSelection();
                    setSelected(!event.shiftKey || !selectedRef.current);
                    return true;
                },
                COMMAND_PRIORITY_LOW,
            ),
            editor.registerCommand(KEY_DELETE_COMMAND, removeSelectedImage, COMMAND_PRIORITY_LOW),
            editor.registerCommand(KEY_BACKSPACE_COMMAND, removeSelectedImage, COMMAND_PRIORITY_LOW),
            editor.registerCommand(
                DRAGSTART_COMMAND,
                (event) => {
                    if (event.target !== imageRef.current) return false;
                    event.preventDefault();
                    return true;
                },
                COMMAND_PRIORITY_LOW,
            ),
            editor.registerCommand(
                KEY_ENTER_COMMAND,
                (event) => {
                    const selection = $getSelection();
                    if (!$isNodeSelection(selection) || !selection.has(nodeKey) || selection.getNodes().length !== 1) return false;
                    event?.preventDefault();
                    const node = $getNodeByKey(nodeKey);
                    const mediaBlock = node?.getTopLevelElement();
                    if (!mediaBlock) return false;
                    const paragraph = $createParagraphNode();
                    mediaBlock.insertAfter(paragraph);
                    paragraph.selectStart();
                    return true;
                },
                COMMAND_PRIORITY_LOW,
            ),
            editor.registerCommand(
                KEY_ESCAPE_COMMAND,
                (event) => {
                    const selection = $getSelection();
                    if (!$isNodeSelection(selection) || !selection.has(nodeKey)) return false;
                    event.preventDefault();
                    clearSelection();
                    editor.getRootElement()?.focus();
                    return true;
                },
                COMMAND_PRIORITY_LOW,
            ),
        );
    }, [clearSelection, editor, nodeKey, setSelected]);

    const updateImage = (action: ImageAlignment | 'delete') => {
        editor.update(() => {
            const node = $getNodeByKey(nodeKey);
            if (!$isImageNode(node)) return;
            if (action === 'delete') {
                node.remove();
                return;
            }
            node.setAlignment(action);
        });
    };

    const updateCaption = async () => {
        const nextCaption = await askText({
            title: 'Chú thích dưới ảnh',
            help: 'Dòng chữ nhỏ hiện ngay dưới ảnh trong bài. Để trống nếu không cần.',
            initial: caption,
            placeholder: 'Ví dụ: Lễ khai giảng khoá 32',
        });
        if (nextCaption === null) return;
        editor.update(() => {
            const node = $getNodeByKey(nodeKey);
            if ($isImageNode(node)) node.setCaption(nextCaption);
        });
    };

    const updateAltText = async () => {
        const nextAlt = await askText({
            title: 'Mô tả ảnh',
            help: 'Mô tả ảnh bằng một câu ngắn. Google đọc dòng này để hiểu ảnh, và người khiếm thị nghe được nó.',
            initial: altText,
            placeholder: 'Ví dụ: Học viên điều dưỡng thực hành tại phòng tiêm',
        });
        if (nextAlt === null) return;
        editor.update(() => {
            const node = $getNodeByKey(nodeKey);
            if ($isImageNode(node)) node.setAltText(nextAlt);
        });
    };

    return (
        <span className={`lexical-image-selection lexical-align-${alignment} ${selected ? 'is-selected' : ''}`}>
            <span className="lexical-image-stage">
                {selected && (
                    <span className="lexical-image-context-menu" contentEditable={false}>
                        <span>Canh ảnh</span>
                        <button className={alignment === 'left' ? 'is-active' : ''} type="button" title="Canh trái" onMouseDown={(event) => event.preventDefault()} onClick={() => updateImage('left')}><Icon name="alignLeft" /></button>
                        <button className={alignment === 'center' ? 'is-active' : ''} type="button" title="Canh giữa" onMouseDown={(event) => event.preventDefault()} onClick={() => updateImage('center')}><Icon name="alignCenter" /></button>
                        <button className={alignment === 'right' ? 'is-active' : ''} type="button" title="Canh phải" onMouseDown={(event) => event.preventDefault()} onClick={() => updateImage('right')}><Icon name="alignRight" /></button>
                        <span className="lexical-image-menu-divider" />
                        <button type="button" title="Thêm hoặc sửa chú thích dưới ảnh" onMouseDown={(event) => event.preventDefault()} onClick={updateCaption}>Chú thích</button>
                        <button type="button" title="Mô tả ảnh cho Google và người khiếm thị" onMouseDown={(event) => event.preventDefault()} onClick={updateAltText}>Mô tả ảnh</button>
                        <button className="is-danger" type="button" title="Xoá ảnh" onMouseDown={(event) => event.preventDefault()} onClick={() => updateImage('delete')}>Xoá</button>
                    </span>
                )}
                <img
                    ref={imageRef}
                    className="lexical-image"
                    src={src}
                    alt={altText}
                    draggable={false}
                    style={{
                        height: height === 'inherit' ? 'auto' : `${height}px`,
                        maxWidth: `${maxWidth}px`,
                        width: width === 'inherit' ? 'auto' : `${width}px`,
                    }}
                />
                {caption && <span className="lexical-image-caption" contentEditable={false}>{caption}</span>}
                {selected && isEditable && (
                    <ImageResizeHandles
                        editor={editor}
                        imageRef={imageRef}
                        nodeKey={nodeKey}
                        maxWidth={maxWidth}
                    />
                )}
            </span>
        </span>
    );
}
