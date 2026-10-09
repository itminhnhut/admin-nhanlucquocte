// Editor soạn nội dung dùng chung cho Tin tức và Ngành đào tạo.
import { AutoLinkNode, LinkNode } from '@lexical/link';
import { ListItemNode, ListNode } from '@lexical/list';
import { CodeNode } from '@lexical/code';
import { CheckListPlugin } from '@lexical/react/LexicalCheckListPlugin';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { LexicalEditor, TextNode } from 'lexical';
import { useCallback, useMemo, useRef, useState } from 'react';
import { $loadHtml } from './lib/editorState';
import { ExtendedTextNode } from './nodes/ExtendedTextNode';
import { ImageNode } from './nodes/ImageNode';
import { VideoNode } from './nodes/VideoNode';
import { ContentChangePlugin } from './plugins/ContentChangePlugin';
import { DraftPlugin } from './plugins/DraftPlugin';
import { ImagePastePlugin } from './plugins/ImagePastePlugin';
import { ImagesPlugin } from './plugins/ImagesPlugin';
import { ToolbarPlugin } from './plugins/ToolbarPlugin';
import { OfficialTableOfContents } from './ui/TableOfContents';
import './editor.css';

type ContentEditorProps = {
    initialHtml: string;
    /** Bật tự lưu nháp. Mỗi bài một khoá riêng, ví dụ `news-12` hay `news-new`. */
    draftKey?: string;
    onChange: (html: string) => void;
    onUploadingChange?: (uploading: boolean) => void;
};

export default function ContentEditor({ initialHtml, draftKey, onChange, onUploadingChange }: ContentEditorProps) {
    const [uploading, setUploadingState] = useState(false);
    const [statistics, setStatistics] = useState({ characters: 0, words: 0 });
    const initialHtmlRef = useRef(initialHtml);
    const setUploading = useCallback(
        (value: boolean) => {
            setUploadingState(value);
            onUploadingChange?.(value);
        },
        [onUploadingChange],
    );

    const config = useMemo(
        () => ({
            namespace: 'ContentEditor',
            nodes: [
                HeadingNode,
                QuoteNode,
                ListNode,
                ListItemNode,
                LinkNode,
                AutoLinkNode,
                CodeNode,
                ImageNode,
                VideoNode,
                ExtendedTextNode,
                {
                    replace: TextNode,
                    with: (node: TextNode) => new ExtendedTextNode(node.getTextContent()),
                    withKlass: ExtendedTextNode,
                },
            ],
            onError(error: Error) {
                console.error('Lexical editor error:', error);
            },
            editorState: initialHtmlRef.current ? (editor: LexicalEditor) => $loadHtml(editor, initialHtmlRef.current) : undefined,
            theme: {
                heading: { h1: 'lexical-h1', h2: 'lexical-h2', h3: 'lexical-h3' },
                link: 'lexical-link',
                list: {
                    listitem: 'lexical-list-item',
                    listitemChecked: 'lexical-list-item-checked',
                    listitemUnchecked: 'lexical-list-item-unchecked',
                    nested: { listitem: 'lexical-nested-list-item' },
                    ol: 'lexical-ol',
                    ul: 'lexical-ul',
                },
                paragraph: 'lexical-paragraph',
                quote: 'lexical-quote',
                text: { bold: 'font-bold', italic: 'italic', strikethrough: 'line-through', underline: 'underline' },
            },
        }),
        [],
    );

    return (
        <LexicalComposer initialConfig={config}>
            <div className="news-lexical-editor">
                <DraftPlugin draftKey={draftKey} initialHtml={initialHtmlRef.current} />
                <ToolbarPlugin uploading={uploading} setUploading={setUploading} />
                <div className="lexical-editor-shell">
                    <RichTextPlugin
                        contentEditable={
                            <ContentEditable
                                className="lexical-content-editable"
                                aria-placeholder="Soạn nội dung, dùng H1/H2/H3 cho tiêu đề bài viết..."
                                placeholder={<></>}
                            />
                        }
                        placeholder={<div className="lexical-placeholder">Soạn nội dung, dùng H1/H2/H3 cho tiêu đề bài viết...</div>}
                        ErrorBoundary={LexicalErrorBoundary}
                    />
                </div>
                <OfficialTableOfContents />
                <div className="lexical-editor-footer">
                    <span>{uploading ? 'Đang tải ảnh lên máy chủ…' : 'Nội dung được tự động định dạng thành HTML'}</span>
                    <span>{statistics.words} từ · {statistics.characters} ký tự</span>
                </div>
            </div>
            <HistoryPlugin />
            <ListPlugin />
            <CheckListPlugin />
            <LinkPlugin />
            <ImagesPlugin />
            <ImagePastePlugin setUploading={setUploading} />
            <ContentChangePlugin onChange={onChange} onStatisticsChange={setStatistics} />
        </LexicalComposer>
    );
}
