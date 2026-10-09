// Node video nhúng (iframe). Giữ nguyên type 'news-video' để không vỡ nội dung đã lưu.
import { DecoratorNode, NodeKey, SerializedLexicalNode, Spread } from 'lexical';
import { ReactNode } from 'react';

export { VideoNode, $createVideoNode };

type SerializedVideoNode = Spread<{ src: string; type: 'news-video'; version: 1 }, SerializedLexicalNode>;

class VideoNode extends DecoratorNode<ReactNode> {
    __src: string;

    static getType() {
        return 'news-video';
    }

    static clone(node: VideoNode) {
        return new VideoNode(node.__src, node.__key);
    }

    static importJSON(serializedNode: SerializedVideoNode) {
        return new VideoNode(serializedNode.src);
    }

    static importDOM() {
        return {
            iframe: (node: Node) => ({
                conversion: () => ({ node: $createVideoNode((node as HTMLIFrameElement).src) }),
                priority: 2 as const,
            }),
        };
    }

    constructor(src: string, key?: NodeKey) {
        super(key);
        this.__src = src;
    }

    createDOM() {
        return document.createElement('div');
    }

    updateDOM() {
        return false;
    }

    exportDOM() {
        const iframe = document.createElement('iframe');
        iframe.src = this.__src;
        iframe.className = 'news-video-embed';
        iframe.setAttribute('frameborder', '0');
        iframe.setAttribute('allowfullscreen', 'true');
        return { element: iframe };
    }

    exportJSON(): SerializedVideoNode {
        return { ...super.exportJSON(), src: this.__src, type: 'news-video', version: 1 };
    }

    decorate() {
        return <iframe className="lexical-video" src={this.__src} title="Video bài viết" allowFullScreen />;
    }
}

function $createVideoNode(src: string) {
    return new VideoNode(src);
}
