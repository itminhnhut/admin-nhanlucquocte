// TextNode mở rộng: giữ lại style inline (màu, cỡ, font) khi người dùng dán từ Word/Google Docs.
import { SerializedTextNode, TextNode, LexicalNode } from 'lexical';

export { ExtendedTextNode, patchStyleConversion };

function patchStyleConversion(originalDOMConverter?: (node: HTMLElement) => any) {
    return (node: HTMLElement) => {
        const original = originalDOMConverter?.(node);
        if (!original) return null;
        const originalOutput = original.conversion(node);
        if (!originalOutput) return originalOutput;
        return {
            ...originalOutput,
            forChild: (lexicalNode: LexicalNode, parent: LexicalNode | null) => {
                const result = originalOutput.forChild ? originalOutput.forChild(lexicalNode, parent) : lexicalNode;
                if (result instanceof TextNode) {
                    const styles = ['backgroundColor', 'color', 'fontFamily', 'fontSize'] as const;
                    const style = styles
                        .map((name) => (node.style[name] ? `${name.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}: ${node.style[name]}` : ''))
                        .filter(Boolean)
                        .join('; ');
                    if (style) return result.setStyle(style);
                }
                return result;
            },
        };
    };
}

class ExtendedTextNode extends TextNode {
    static getType() {
        return 'extended-text';
    }

    static clone(node: ExtendedTextNode) {
        return new ExtendedTextNode(node.__text, node.__key);
    }

    static importJSON(serializedNode: SerializedTextNode) {
        return new ExtendedTextNode(serializedNode.text).updateFromJSON(serializedNode);
    }

    static importDOM() {
        const importers = TextNode.importDOM();
        return {
            ...importers,
            code: () => ({ conversion: patchStyleConversion(importers?.code), priority: 1 as const }),
            em: () => ({ conversion: patchStyleConversion(importers?.em), priority: 1 as const }),
            span: () => ({ conversion: patchStyleConversion(importers?.span), priority: 1 as const }),
            strong: () => ({ conversion: patchStyleConversion(importers?.strong), priority: 1 as const }),
            sub: () => ({ conversion: patchStyleConversion(importers?.sub), priority: 1 as const }),
            sup: () => ({ conversion: patchStyleConversion(importers?.sup), priority: 1 as const }),
        };
    }
}
