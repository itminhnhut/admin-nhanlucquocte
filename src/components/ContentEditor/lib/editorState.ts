// Nạp HTML vào editor. Dùng cho cả lúc mở bài có sẵn và lúc khôi phục bản nháp.
import { $generateNodesFromDOM } from '@lexical/html';
import { $createParagraphNode, $getRoot, $isElementNode, DecoratorNode, LexicalEditor, LexicalNode } from 'lexical';
import { sanitizeInitialHtml } from './html';

/** Gom các node inline rời rạc vào paragraph, nếu không Lexical sẽ bỏ chúng khỏi root */
export function $loadHtml(editor: LexicalEditor, html: string) {
    const dom = new DOMParser().parseFromString(sanitizeInitialHtml(html), 'text/html');
    const nodes = $generateNodesFromDOM(editor, dom);
    const rootNodes: LexicalNode[] = [];
    let inlineParagraph: ReturnType<typeof $createParagraphNode> | null = null;
    for (const node of nodes) {
        if ($isElementNode(node) || node instanceof DecoratorNode) {
            inlineParagraph = null;
            rootNodes.push(node);
        } else {
            if (!inlineParagraph) {
                inlineParagraph = $createParagraphNode();
                rootNodes.push(inlineParagraph);
            }
            inlineParagraph.append(node);
        }
    }
    const root = $getRoot();
    root.clear();
    root.append(...(rootNodes.length > 0 ? rootNodes : [$createParagraphNode()]));
}
