// Danh sách khối có thể chèn. Dùng chung cho menu "/" khi gõ trong bài và cho
// menu hiện ra khi bấm tay kéo ⠿, để hai chỗ không bao giờ lệch nhau.
import { INSERT_CHECK_LIST_COMMAND, INSERT_ORDERED_LIST_COMMAND, INSERT_UNORDERED_LIST_COMMAND } from '@lexical/list';
import { INSERT_HORIZONTAL_RULE_COMMAND } from '@lexical/react/LexicalHorizontalRuleNode';
import { $createHeadingNode, $createQuoteNode } from '@lexical/rich-text';
import { $setBlocksType } from '@lexical/selection';
import { INSERT_TABLE_COMMAND } from '@lexical/table';
import { CodeNode } from '@lexical/code';
import { $createParagraphNode, $getSelection, $isRangeSelection, ElementNode, LexicalEditor } from 'lexical';
import { askTableSize, askUrl } from '../lib/dialogs';
import { $createVideoNode } from '../nodes/VideoNode';

export type BlockAction = {
    key: string;
    label: string;
    iconName: string;
    /** Từ khoá không dấu để lọc */
    keywords: readonly string[];
    run: (editor: LexicalEditor) => void;
};

/** Đổi kiểu khối đang đứng */
function setBlock(editor: LexicalEditor, create: () => ElementNode) {
    editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) $setBlocksType(selection, create);
    });
}

/** `openImagePicker` do nơi gọi cung cấp, vì mỗi nơi tự giữ ô chọn file riêng */
export function createBlockActions(openImagePicker: () => void): readonly BlockAction[] {
    return [
        { key: 'paragraph', label: 'Đoạn văn', iconName: 'paragraph', keywords: ['doan van', 'paragraph'], run: (ed) => setBlock(ed, () => $createParagraphNode()) },
        { key: 'h1', label: 'Tiêu đề lớn', iconName: 'h1', keywords: ['tieu de lon', 'heading 1', 'h1'], run: (ed) => setBlock(ed, () => $createHeadingNode('h1')) },
        { key: 'h2', label: 'Tiêu đề mục', iconName: 'h2', keywords: ['tieu de muc', 'heading 2', 'h2'], run: (ed) => setBlock(ed, () => $createHeadingNode('h2')) },
        { key: 'h3', label: 'Tiêu đề nhỏ', iconName: 'h3', keywords: ['tieu de nho', 'heading 3', 'h3'], run: (ed) => setBlock(ed, () => $createHeadingNode('h3')) },
        { key: 'bullet', label: 'Danh sách gạch đầu dòng', iconName: 'listBullet', keywords: ['danh sach', 'bullet list'], run: (ed) => ed.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined) },
        { key: 'number', label: 'Danh sách đánh số', iconName: 'listNumber', keywords: ['danh sach so', 'numbered list'], run: (ed) => ed.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined) },
        { key: 'check', label: 'Danh sách tích chọn', iconName: 'listCheck', keywords: ['tich chon', 'check list'], run: (ed) => ed.dispatchCommand(INSERT_CHECK_LIST_COMMAND, undefined) },
        { key: 'quote', label: 'Trích dẫn', iconName: 'quote', keywords: ['trich dan', 'quote'], run: (ed) => setBlock(ed, () => $createQuoteNode()) },
        {
            key: 'table',
            label: 'Bảng',
            iconName: 'table',
            keywords: ['bang', 'table'],
            run: async (ed) => {
                const size = await askTableSize();
                if (size) ed.dispatchCommand(INSERT_TABLE_COMMAND, size);
            },
        },
        { key: 'image', label: 'Ảnh', iconName: 'image', keywords: ['anh', 'hinh', 'image'], run: () => openImagePicker() },
        {
            key: 'video',
            label: 'Video',
            iconName: 'video',
            keywords: ['video', 'youtube'],
            run: async (ed) => {
                const url = await askUrl({ title: 'Chèn video', help: 'Dán đường dẫn YouTube hoặc link nhúng.' });
                if (!url) return;
                ed.update(() => {
                    const selection = $getSelection();
                    if ($isRangeSelection(selection)) selection.insertNodes([$createVideoNode(url)]);
                });
            },
        },
        { key: 'hr', label: 'Đường kẻ ngang', iconName: 'hr', keywords: ['duong ke ngang', 'divider'], run: (ed) => ed.dispatchCommand(INSERT_HORIZONTAL_RULE_COMMAND, undefined) },
        { key: 'code', label: 'Khối mã nguồn', iconName: 'code', keywords: ['ma nguon', 'code'], run: (ed) => setBlock(ed, () => new CodeNode()) },
    ];
}

const plain = (value: string) =>
    value
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '');

/** Lọc theo nhãn hoặc từ khoá, bỏ dấu nên gõ "tieu de" cũng ra */
export function filterBlockActions(actions: readonly BlockAction[], query: string | null) {
    if (!query) return actions;
    const keyword = plain(query);
    return actions.filter((action) => plain(action.label).includes(keyword) || action.keywords.some((word) => word.includes(keyword)));
}
