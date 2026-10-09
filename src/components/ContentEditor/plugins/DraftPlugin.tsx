// Tự lưu nháp vào máy người dùng. Đóng nhầm tab hay mất điện thì mở lại vẫn còn bài.
// Nháp nằm trong localStorage của trình duyệt, KHÔNG gửi lên server.
import { $generateHtmlFromNodes } from '@lexical/html';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useEffect, useRef, useState } from 'react';
import { $loadHtml } from '../lib/editorState';
import { normalizeExportedHtml } from '../lib/html';

const PREFIX = 'content-editor-draft:';
const SAVE_DELAY = 1500;

type Draft = { html: string; at: number };

/** Xoá nháp sau khi bài đã lưu lên server thành công */
export function clearEditorDraft(draftKey: string) {
    try {
        localStorage.removeItem(PREFIX + draftKey);
    } catch (error) {
        console.warn('Không xoá được bản nháp:', error);
    }
}

function formatTime(at: number) {
    return new Date(at).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' });
}

function DraftPlugin({ draftKey, initialHtml }: { draftKey?: string; initialHtml: string }) {
    const [editor] = useLexicalComposerContext();
    const [draft, setDraft] = useState<Draft | null>(null);
    const initialRef = useRef(initialHtml);

    // Có nháp cũ khác với nội dung đang mở → mời khôi phục
    useEffect(() => {
        if (!draftKey) return;
        try {
            const raw = localStorage.getItem(PREFIX + draftKey);
            if (!raw) return;
            const saved = JSON.parse(raw) as Draft;
            if (saved?.html && saved.html !== initialRef.current) setDraft(saved);
        } catch (error) {
            console.warn('Không đọc được bản nháp:', error);
        }
    }, [draftKey]);

    useEffect(() => {
        if (!draftKey) return;
        let timer: ReturnType<typeof setTimeout>;
        const unregister = editor.registerUpdateListener(({ dirtyElements, dirtyLeaves }) => {
            if (dirtyElements.size === 0 && dirtyLeaves.size === 0) return;
            clearTimeout(timer);
            timer = setTimeout(() => {
                editor.getEditorState().read(() => {
                    const html = normalizeExportedHtml($generateHtmlFromNodes(editor, null));
                    try {
                        localStorage.setItem(PREFIX + draftKey, JSON.stringify({ html, at: Date.now() }));
                    } catch (error) {
                        console.warn('Không lưu được bản nháp:', error);
                    }
                });
            }, SAVE_DELAY);
        });
        return () => {
            clearTimeout(timer);
            unregister();
        };
    }, [editor, draftKey]);

    if (!draft) return null;

    return (
        <div className="lexical-draft-bar" role="status">
            <span>
                Có bản nháp chưa lưu lúc <strong>{formatTime(draft.at)}</strong> trên máy này.
            </span>
            <button
                type="button"
                className="is-primary"
                onClick={() => {
                    editor.update(() => $loadHtml(editor, draft.html));
                    setDraft(null);
                }}
            >
                Khôi phục bản nháp
            </button>
            <button
                type="button"
                onClick={() => {
                    if (draftKey) clearEditorDraft(draftKey);
                    setDraft(null);
                }}
            >
                Bỏ nháp
            </button>
        </div>
    );
}

export { DraftPlugin };
