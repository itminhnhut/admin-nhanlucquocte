// Ảnh/video chèn vào thành một khối riêng. Nếu khối đó nằm ngay đầu hoặc cuối bài thì
// không còn chỗ nào đặt con trỏ để gõ chữ phía trên hay phía dưới nó.
// Plugin này luôn giữ sẵn một dòng trống ở hai đầu bài khi cần.
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $createParagraphNode, $getRoot, $isParagraphNode, LexicalNode } from 'lexical';
import { useEffect } from 'react';
import { $isImageNode } from '../nodes/ImageNode';
import { $isVideoNode } from '../nodes/VideoNode';

function holdsOnlyMedia(node: LexicalNode | null) {
    if (!$isParagraphNode(node)) return false;
    const children = node.getChildren();
    return children.length > 0 && children.every((child) => $isImageNode(child) || $isVideoNode(child));
}

function EdgeParagraphPlugin() {
    const [editor] = useLexicalComposerContext();

    useEffect(
        () =>
            editor.registerUpdateListener(({ dirtyElements, dirtyLeaves }) => {
                if (dirtyElements.size === 0 && dirtyLeaves.size === 0) return;

                // Kiểm tra trước bằng read, chỉ gọi update khi thật sự thiếu dòng trống,
                // nếu không sẽ tạo vòng lặp update vô tận.
                let needsTop = false;
                let needsBottom = false;
                editor.getEditorState().read(() => {
                    const root = $getRoot();
                    needsTop = holdsOnlyMedia(root.getFirstChild());
                    needsBottom = holdsOnlyMedia(root.getLastChild());
                });
                if (!needsTop && !needsBottom) return;

                editor.update(() => {
                    const root = $getRoot();
                    const first = root.getFirstChild();
                    if (holdsOnlyMedia(first)) first?.insertBefore($createParagraphNode());
                    const last = root.getLastChild();
                    if (holdsOnlyMedia(last)) last?.insertAfter($createParagraphNode());
                });
            }),
        [editor],
    );

    return null;
}

export { EdgeParagraphPlugin };
