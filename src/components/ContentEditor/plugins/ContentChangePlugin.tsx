// Mỗi lần nội dung đổi: xuất HTML đã chuẩn hoá ra ngoài và đếm từ/ký tự.
import { $generateHtmlFromNodes } from '@lexical/html';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getRoot } from 'lexical';
import { useEffect, useRef } from 'react';
import { normalizeExportedHtml } from '../lib/html';

export { ContentChangePlugin };

function ContentChangePlugin({
    onChange,
    onStatisticsChange,
}: {
    onChange: (html: string) => void;
    onStatisticsChange: (statistics: { characters: number; words: number }) => void;
}) {
    const [editor] = useLexicalComposerContext();
    const onChangeRef = useRef(onChange);
    const onStatisticsChangeRef = useRef(onStatisticsChange);

    useEffect(() => {
        onChangeRef.current = onChange;
        onStatisticsChangeRef.current = onStatisticsChange;
    }, [onChange, onStatisticsChange]);

    useEffect(() => {
        const emit = () => {
            editor.getEditorState().read(() => {
                const text = $getRoot().getTextContent().trim();
                onStatisticsChangeRef.current({
                    characters: text.length,
                    words: text ? text.split(/\s+/).length : 0,
                });
                onChangeRef.current(normalizeExportedHtml($generateHtmlFromNodes(editor, null)));
            });
        };
        const unregister = editor.registerUpdateListener(({ dirtyElements, dirtyLeaves }) => {
            if (dirtyElements.size === 0 && dirtyLeaves.size === 0) return;
            emit();
        });
        return unregister;
    }, [editor]);

    return null;
}
