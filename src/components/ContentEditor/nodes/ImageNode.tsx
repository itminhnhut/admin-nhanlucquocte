// Node ảnh trong bài: canh lề, chú thích, kích thước. Giữ nguyên type 'news-image'
// và class 'news-image' khi xuất HTML để nội dung đã lưu trên web không bị vỡ.
import { DecoratorNode, LexicalNode, NodeKey, SerializedLexicalNode, Spread } from 'lexical';
import { ReactNode, Suspense, lazy } from 'react';
import { getImageAlignment, type ImageAlignment } from '../lib/html';

// lazy: cắt vòng import (ImageNode render SelectableImage, SelectableImage cần ImageNode)
const SelectableImage = lazy(() => import('../ui/SelectableImage'));

export type { ImagePayload, SerializedImageNode };
export { ImageNode, $createImageNode };

export function $isImageNode(node: LexicalNode | null | undefined): node is ImageNode {
    return node instanceof ImageNode;
}

type SerializedImageNode = Spread<
    {
        alignment?: ImageAlignment;
        altText: string;
        caption?: string;
        height: number;
        maxWidth: number;
        src: string;
        type: 'news-image';
        version: 1;
        width: number;
    },
    SerializedLexicalNode
>;

class ImageNode extends DecoratorNode<ReactNode> {
    __src: string;
    __altText: string;
    __caption: string;
    __width: number | 'inherit';
    __height: number | 'inherit';
    __maxWidth: number;
    __alignment: ImageAlignment;

    static getType() {
        return 'news-image';
    }

    static clone(node: ImageNode) {
        return new ImageNode(node.__src, node.__altText, node.__caption, node.__maxWidth, node.__width, node.__height, node.__alignment, node.__key);
    }

    static importJSON(serializedNode: SerializedImageNode) {
        return new ImageNode(
            serializedNode.src,
            serializedNode.altText,
            serializedNode.caption || '',
            serializedNode.maxWidth,
            serializedNode.width || 'inherit',
            serializedNode.height || 'inherit',
            serializedNode.alignment || 'left',
        );
    }

    static importDOM() {
        return {
            figure: (node: Node) => ({
                conversion: () => {
                    const figure = node as HTMLElement;
                    const image = figure.querySelector('img');
                    if (!image || image.src.startsWith('data:image/')) return { node: null };
                    return {
                        node: $createImageNode({
                            altText: image.alt || '',
                            caption: figure.querySelector('figcaption')?.textContent?.trim() || '',
                            height: Number(image.getAttribute('height')) || 'inherit',
                            alignment: getImageAlignment(figure),
                            src: image.src,
                            width: Number(image.getAttribute('width')) || 'inherit',
                        }),
                    };
                },
                priority: 3 as const,
            }),
            figcaption: () => ({
                conversion: () => ({ node: null }),
                priority: 3 as const,
            }),
            img: (node: Node) => ({
                conversion: () => {
                    const image = node as HTMLImageElement;
                    if (image.closest('figure')) return { node: null };
                    if (image.src.startsWith('data:image/')) return { node: null };
                    return {
                        node: $createImageNode({
                            altText: image.alt || '',
                            caption: image.closest('figure')?.querySelector('figcaption')?.textContent?.trim() || '',
                            height: Number(image.getAttribute('height')) || 'inherit',
                            alignment: getImageAlignment(image),
                            src: image.src,
                            width: Number(image.getAttribute('width')) || 'inherit',
                        }),
                    };
                },
                priority: 2 as const,
            }),
        };
    }

    constructor(
        src: string,
        altText = '',
        caption = '',
        maxWidth = 720,
        width: number | 'inherit' = 'inherit',
        height: number | 'inherit' = 'inherit',
        alignment: ImageAlignment = 'left',
        key?: NodeKey,
    ) {
        super(key);
        this.__src = src;
        this.__altText = altText;
        this.__caption = caption;
        this.__maxWidth = maxWidth;
        this.__width = width;
        this.__height = height;
        this.__alignment = alignment;
    }

    createDOM() {
        const element = document.createElement('span');
        element.className = 'lexical-image-wrapper';
        return element;
    }

    updateDOM() {
        return false;
    }

    exportDOM() {
        const image = document.createElement('img');
        image.src = this.__src;
        image.alt = this.__altText;
        image.className = 'news-image';
        image.style.display = 'block';
        image.dataset.imageAlignment = this.__alignment;
        image.style.maxWidth = '100%';
        image.style.height = this.__height === 'inherit' ? 'auto' : `${this.__height}px`;
        if (this.__width !== 'inherit') {
            image.width = this.__width;
            image.style.width = `${this.__width}px`;
        }
        if (this.__height !== 'inherit') image.height = this.__height;
        if (!this.__caption) {
            image.style.marginLeft = this.__alignment === 'right' || this.__alignment === 'center' ? 'auto' : '0';
            image.style.marginRight = this.__alignment === 'center' ? 'auto' : this.__alignment === 'right' ? '0' : 'auto';
            return { element: image };
        }
        const figure = document.createElement('figure');
        figure.className = 'news-image-figure';
        figure.dataset.imageAlignment = this.__alignment;
        figure.style.marginLeft = this.__alignment === 'right' || this.__alignment === 'center' ? 'auto' : '0';
        figure.style.marginRight = this.__alignment === 'center' ? 'auto' : this.__alignment === 'right' ? '0' : 'auto';
        const caption = document.createElement('figcaption');
        caption.className = 'news-image-caption';
        caption.textContent = this.__caption;
        figure.append(image, caption);
        return { element: figure };
    }

    exportJSON(): SerializedImageNode {
        return {
            ...super.exportJSON(),
            alignment: this.__alignment,
            altText: this.__altText,
            caption: this.__caption,
            height: this.__height === 'inherit' ? 0 : this.__height,
            maxWidth: this.__maxWidth,
            src: this.__src,
            type: 'news-image',
            version: 1,
            width: this.__width === 'inherit' ? 0 : this.__width,
        };
    }

    setWidthAndHeight(width: number, height: number) {
        const writable = this.getWritable();
        writable.__width = width;
        writable.__height = height;
    }

    setAltText(altText: string) {
        const writable = this.getWritable();
        writable.__altText = altText;
    }

    setCaption(caption: string) {
        const writable = this.getWritable();
        writable.__caption = caption;
    }

    setAlignment(alignment: ImageAlignment) {
        const writable = this.getWritable();
        writable.__alignment = alignment;
    }

    decorate() {
        return (
            <SelectableImage
                nodeKey={this.getKey()}
                src={this.__src}
                altText={this.__altText}
                caption={this.__caption}
                alignment={this.__alignment}
                width={this.__width}
                height={this.__height}
                maxWidth={this.__maxWidth}
            />
        );
    }
}

type ImagePayload = {
    alignment?: ImageAlignment;
    altText?: string;
    caption?: string;
    height?: number | 'inherit';
    maxWidth?: number;
    src: string;
    width?: number | 'inherit';
};

function $createImageNode({ src, altText = '', caption = '', maxWidth = 720, width = 'inherit', height = 'inherit', alignment = 'left' }: ImagePayload) {
    return new ImageNode(src, altText, caption, maxWidth, width, height, alignment);
}
