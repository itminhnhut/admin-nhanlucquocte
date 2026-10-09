// Thanh công cụ soạn bài. Bố cục theo Lexical playground: gom tính năng vào menu thả xuống
// có NHÃN CHỮ tiếng Việt, thay vì một hàng ký tự lạ. Giữ đủ tính năng, không ẩn sau nút "Thêm".
import { TOGGLE_LINK_COMMAND } from '@lexical/link';
import {
    $isListNode,
    INSERT_CHECK_LIST_COMMAND,
    INSERT_ORDERED_LIST_COMMAND,
    INSERT_UNORDERED_LIST_COMMAND,
    ListNode,
    REMOVE_LIST_COMMAND,
} from '@lexical/list';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $createHeadingNode, $createQuoteNode, HeadingNode } from '@lexical/rich-text';
import { $getSelectionStyleValueForProperty, $patchStyleText, $setBlocksType } from '@lexical/selection';
import { $insertNodeToNearestRoot, mergeRegister } from '@lexical/utils';
import { CodeNode } from '@lexical/code';
import { INSERT_TABLE_COMMAND } from '@lexical/table';
import {
    $createParagraphNode,
    $getSelection,
    $isElementNode,
    $isNodeSelection,
    $isRangeSelection,
    CAN_REDO_COMMAND,
    CAN_UNDO_COMMAND,
    COMMAND_PRIORITY_CRITICAL,
    DecoratorNode,
    FORMAT_TEXT_COMMAND,
    INDENT_CONTENT_COMMAND,
    OUTDENT_CONTENT_COMMAND,
    REDO_COMMAND,
    SELECTION_CHANGE_COMMAND,
    TextFormatType,
    UNDO_COMMAND,
} from 'lexical';
import { ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import Swal from 'sweetalert2';
import { askTableSize, askUrl } from '../lib/dialogs';
import { uploadNewsImage } from '../lib/upload';
import { $isImageNode } from '../nodes/ImageNode';
import { $createVideoNode } from '../nodes/VideoNode';
import Dropdown, { type DropdownItem } from '../ui/Dropdown';
import Icon from '../ui/icons';
import { INSERT_IMAGE_COMMAND } from './ImagesPlugin';

const BLOCK_ITEMS: readonly DropdownItem[] = [
    { value: 'paragraph', label: 'Đoạn văn', icon: 'paragraph' },
    { value: 'h1', label: 'Tiêu đề lớn', icon: 'h1', hint: 'H1 — dùng 1 lần cho tên bài' },
    { value: 'h2', label: 'Tiêu đề mục', icon: 'h2', hint: 'H2 — chia các phần chính' },
    { value: 'h3', label: 'Tiêu đề nhỏ', icon: 'h3', hint: 'H3 — mục con trong phần' },
    { value: 'bullet', label: 'Danh sách gạch đầu dòng', icon: 'listBullet' },
    { value: 'number', label: 'Danh sách đánh số', icon: 'listNumber' },
    { value: 'check', label: 'Danh sách tích chọn', icon: 'listCheck' },
    { value: 'quote', label: 'Trích dẫn', icon: 'quote' },
    { value: 'code', label: 'Khối mã nguồn', icon: 'code' },
];

const FONT_ITEMS: readonly DropdownItem[] = ['Arial', 'Georgia', 'Times New Roman', 'Courier New', 'Verdana'].map((font) => ({
    value: font,
    label: font,
}));

const ALIGN_ITEMS: readonly DropdownItem[] = [
    { value: 'left', label: 'Canh trái', icon: 'alignLeft' },
    { value: 'center', label: 'Canh giữa', icon: 'alignCenter' },
    { value: 'right', label: 'Canh phải', icon: 'alignRight' },
    { value: 'justify', label: 'Canh đều hai bên', icon: 'alignJustify' },
    { value: 'outdent', label: 'Giảm thụt lề', icon: 'outdent' },
    { value: 'indent', label: 'Tăng thụt lề', icon: 'indent' },
];

const INSERT_ITEMS: readonly DropdownItem[] = [
    { value: 'image', label: 'Ảnh', icon: 'image', hint: 'Tải ảnh từ máy lên' },
    { value: 'video', label: 'Video', icon: 'video', hint: 'Dán link YouTube hoặc iframe' },
    { value: 'table', label: 'Bảng', icon: 'table', hint: 'Chọn số dòng và số cột' },
];

const FORMAT_ITEMS: readonly DropdownItem[] = [
    { value: 'strikethrough', label: 'Gạch ngang chữ', icon: 'strikethrough' },
    { value: 'superscript', label: 'Chỉ số trên', icon: 'superscript', hint: 'Ví dụ: m²' },
    { value: 'subscript', label: 'Chỉ số dưới', icon: 'subscript', hint: 'Ví dụ: H₂O' },
    { value: 'clear', label: 'Xoá mọi định dạng', icon: 'clearFormat' },
];

function ToolbarPlugin({ uploading, setUploading }: { uploading: boolean; setUploading: (value: boolean) => void }) {
    const [editor] = useLexicalComposerContext();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [canUndo, setCanUndo] = useState(false);
    const [canRedo, setCanRedo] = useState(false);
    const [formats, setFormats] = useState({ bold: false, italic: false, underline: false, code: false });
    const [fontSize, setFontSize] = useState(16);
    const [blockType, setBlockType] = useState('paragraph');
    const [fontFamily, setFontFamily] = useState('Arial');
    const [alignment, setAlignment] = useState('left');

    const updateToolbar = useCallback(() => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) return;
        setFormats({
            bold: selection.hasFormat('bold'),
            italic: selection.hasFormat('italic'),
            underline: selection.hasFormat('underline'),
            code: selection.hasFormat('code'),
        });
        const topLevel = selection.anchor.getNode().getTopLevelElement();
        if (!topLevel) return;
        const type = topLevel.getType();
        if (type === 'heading') setBlockType((topLevel as HeadingNode).getTag());
        else if ($isListNode(topLevel)) setBlockType((topLevel as ListNode).getListType());
        else setBlockType(type === 'quote' || type === 'code' ? type : 'paragraph');
        const currentAlignment = topLevel.getFormatType();
        setAlignment(currentAlignment === 'center' || currentAlignment === 'right' || currentAlignment === 'justify' ? currentAlignment : 'left');
        const nextFontSize = Number.parseInt($getSelectionStyleValueForProperty(selection, 'font-size', '16px'), 10);
        setFontSize(Number.isFinite(nextFontSize) ? nextFontSize : 16);
        setFontFamily($getSelectionStyleValueForProperty(selection, 'font-family', 'Arial').replace(/^['"]|['"]$/g, ''));
    }, []);

    useEffect(
        () =>
            mergeRegister(
                editor.registerUpdateListener(({ editorState }) => {
                    editorState.read(updateToolbar);
                }),
                editor.registerCommand(
                    SELECTION_CHANGE_COMMAND,
                    () => {
                        updateToolbar();
                        return false;
                    },
                    COMMAND_PRIORITY_CRITICAL,
                ),
                editor.registerCommand(
                    CAN_UNDO_COMMAND,
                    (payload) => {
                        setCanUndo(payload);
                        return false;
                    },
                    COMMAND_PRIORITY_CRITICAL,
                ),
                editor.registerCommand(
                    CAN_REDO_COMMAND,
                    (payload) => {
                        setCanRedo(payload);
                        return false;
                    },
                    COMMAND_PRIORITY_CRITICAL,
                ),
            ),
        [editor, updateToolbar],
    );

    const applyTextStyle = (styles: Record<string, string | null>) => {
        editor.update(() => {
            const selection = $getSelection();
            if ($isRangeSelection(selection)) $patchStyleText(selection, styles);
        });
    };

    /** Danh sách và kiểu đoạn nằm chung một menu, nên phải bỏ danh sách trước khi đổi sang đoạn/tiêu đề */
    const applyBlock = (type: string) => {
        if (type === 'bullet' || type === 'number' || type === 'check') {
            if (blockType === type) {
                editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
                return;
            }
            const command =
                type === 'bullet' ? INSERT_UNORDERED_LIST_COMMAND : type === 'number' ? INSERT_ORDERED_LIST_COMMAND : INSERT_CHECK_LIST_COMMAND;
            editor.dispatchCommand(command, undefined);
            return;
        }
        if (blockType === 'bullet' || blockType === 'number' || blockType === 'check') {
            editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
        }
        editor.update(() => {
            const selection = $getSelection();
            if (!$isRangeSelection(selection)) return;
            $setBlocksType(selection, () => {
                if (type === 'h1' || type === 'h2' || type === 'h3') return $createHeadingNode(type);
                if (type === 'quote') return $createQuoteNode();
                if (type === 'code') return new CodeNode();
                return $createParagraphNode();
            });
        });
    };

    const applyAlignment = (value: string) => {
        if (value === 'indent' || value === 'outdent') {
            editor.dispatchCommand(value === 'indent' ? INDENT_CONTENT_COMMAND : OUTDENT_CONTENT_COMMAND, undefined);
            return;
        }
        const nextAlignment = value as 'left' | 'center' | 'right' | 'justify';
        editor.update(() => {
            const selection = $getSelection();
            if ($isRangeSelection(selection)) {
                const currentBlock = selection.anchor.getNode().getTopLevelElement();
                if ($isElementNode(currentBlock)) currentBlock.setFormat(nextAlignment);
                return;
            }
            if ($isNodeSelection(selection)) {
                selection.getNodes().forEach((node) => {
                    if ($isImageNode(node)) {
                        if (nextAlignment !== 'justify') node.setAlignment(nextAlignment);
                        return;
                    }
                    const block = node.getTopLevelElement();
                    if ($isElementNode(block)) block.setFormat(nextAlignment);
                });
            }
        });
    };

    const applyExtraFormat = (value: string) => {
        if (value !== 'clear') {
            editor.dispatchCommand(FORMAT_TEXT_COMMAND, value as TextFormatType);
            return;
        }
        applyTextStyle({ color: null, 'background-color': null, 'font-size': null, 'font-family': null });
        editor.update(() => {
            const selection = $getSelection();
            if (!$isRangeSelection(selection)) return;
            (['bold', 'italic', 'underline', 'strikethrough', 'code', 'subscript', 'superscript'] as const).forEach((format) => {
                if (selection.hasFormat(format)) editor.dispatchCommand(FORMAT_TEXT_COMMAND, format);
            });
        });
    };

    const changeFontSize = (nextSize: number) => {
        const safeSize = Math.min(72, Math.max(8, nextSize));
        setFontSize(safeSize);
        applyTextStyle({ 'font-size': `${safeSize}px` });
    };

    const insertDecorator = (createNode: () => DecoratorNode<ReactNode>) => {
        editor.update(() => {
            const node = createNode();
            const mediaBlock = $createParagraphNode();
            mediaBlock.append(node);
            const textParagraph = $createParagraphNode();
            $insertNodeToNearestRoot(mediaBlock);
            mediaBlock.insertAfter(textParagraph);
            textParagraph.selectStart();
        });
    };

    const uploadImage = async (file: File) => {
        setUploading(true);
        try {
            const url = await uploadNewsImage(file);
            const suggestedAlt = file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ');
            editor.dispatchCommand(INSERT_IMAGE_COMMAND, { src: url, altText: suggestedAlt });
        } catch (error) {
            Swal.fire({ icon: 'error', title: 'Lỗi', text: error?.message || 'Upload ảnh thất bại. Vui lòng thử lại.' });
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleInsert = async (value: string) => {
        if (value === 'image') {
            fileInputRef.current?.click();
            return;
        }
        if (value === 'table') {
            const size = await askTableSize();
            if (size) editor.dispatchCommand(INSERT_TABLE_COMMAND, size);
            return;
        }
        const url = await askUrl({
            title: 'Chèn video',
            help: 'Dán đường dẫn YouTube hoặc link nhúng (iframe src) vào đây.',
            placeholder: 'https://www.youtube.com/embed/...',
        });
        if (url) insertDecorator(() => $createVideoNode(url));
    };

    const insertLink = async () => {
        const url = await askUrl({
            title: 'Chèn liên kết',
            help: 'Chọn đoạn chữ trước rồi dán đường dẫn muốn liên kết tới.',
        });
        if (url) editor.dispatchCommand(TOGGLE_LINK_COMMAND, url);
    };

    return (
        <div className="lexical-toolbar">
            <div className="lexical-toolbar-group">
                <button type="button" title="Hoàn tác (Ctrl+Z)" disabled={!canUndo} onClick={() => editor.dispatchCommand(UNDO_COMMAND, undefined)}>
                    <Icon name="undo" />
                </button>
                <button type="button" title="Làm lại (Ctrl+Y)" disabled={!canRedo} onClick={() => editor.dispatchCommand(REDO_COMMAND, undefined)}>
                    <Icon name="redo" />
                </button>
            </div>

            <div className="lexical-toolbar-group lexical-block-group">
                <Dropdown label="Đoạn văn" title="Kiểu đoạn: tiêu đề, danh sách, trích dẫn" items={BLOCK_ITEMS} activeValue={blockType} onSelect={applyBlock} showActiveLabel />
            </div>

            <div className="lexical-toolbar-group">
                <Dropdown label="Phông chữ" title="Phông chữ" items={FONT_ITEMS} activeValue={fontFamily} onSelect={(font) => applyTextStyle({ 'font-family': font })} showActiveLabel />
                <div className="lexical-font-size">
                    <button type="button" title="Giảm cỡ chữ" onClick={() => changeFontSize(fontSize - 1)}>−</button>
                    <input type="number" min="8" max="72" value={fontSize} aria-label="Cỡ chữ" onChange={(event) => changeFontSize(Number(event.target.value) || 16)} />
                    <button type="button" title="Tăng cỡ chữ" onClick={() => changeFontSize(fontSize + 1)}>＋</button>
                </div>
            </div>

            <div className="lexical-toolbar-group">
                <button className={formats.bold ? 'is-active' : ''} type="button" title="In đậm (Ctrl+B)" onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold')}>
                    <Icon name="bold" />
                </button>
                <button className={formats.italic ? 'is-active' : ''} type="button" title="In nghiêng (Ctrl+I)" onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic')}>
                    <Icon name="italic" />
                </button>
                <button className={formats.underline ? 'is-active' : ''} type="button" title="Gạch chân (Ctrl+U)" onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline')}>
                    <Icon name="underline" />
                </button>
                <button className={formats.code ? 'is-active' : ''} type="button" title="Chữ dạng mã" onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'code')}>
                    <Icon name="code" />
                </button>
                <button type="button" title="Chèn liên kết" onClick={insertLink}>
                    <Icon name="link" />
                </button>
            </div>

            <div className="lexical-toolbar-group lexical-color-group">
                <label title="Màu chữ">
                    <Icon name="fontColor" />
                    <span>Màu chữ</span>
                    <input type="color" onChange={(event) => applyTextStyle({ color: event.target.value })} />
                </label>
                <label title="Màu nền chữ">
                    <Icon name="bgColor" />
                    <span>Màu nền</span>
                    <input type="color" defaultValue="#ffffff" onChange={(event) => applyTextStyle({ 'background-color': event.target.value })} />
                </label>
            </div>

            <div className="lexical-toolbar-group">
                <Dropdown label="Định dạng khác" title="Gạch ngang, chỉ số trên/dưới, xoá định dạng" items={FORMAT_ITEMS} onSelect={applyExtraFormat} />
            </div>

            <div className="lexical-toolbar-group">
                <input ref={fileInputRef} hidden type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={(event) => event.target.files?.[0] && uploadImage(event.target.files[0])} />
                <Dropdown label={uploading ? 'Đang tải ảnh…' : 'Chèn'} icon="image" title="Chèn ảnh hoặc video" items={INSERT_ITEMS} onSelect={handleInsert} />
            </div>

            <div className="lexical-toolbar-group lexical-align-group">
                <Dropdown label="Canh lề" title="Canh lề và thụt lề" items={ALIGN_ITEMS} activeValue={alignment} onSelect={applyAlignment} showActiveLabel />
            </div>
        </div>
    );
}

export { ToolbarPlugin };
