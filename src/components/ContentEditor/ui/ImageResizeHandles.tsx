// 8 tay kéo quanh ảnh để đổi kích thước bằng chuột.
import { calculateZoomLevel } from '@lexical/utils';
import { $getNodeByKey, LexicalEditor } from 'lexical';
import { useEffect, useRef } from 'react';
import { $isImageNode } from '../nodes/ImageNode';

export default ImageResizeHandles;

function ImageResizeHandles({
    editor,
    imageRef,
    nodeKey,
    maxWidth,
}: {
    editor: LexicalEditor;
    imageRef: React.RefObject<HTMLImageElement>;
    nodeKey: string;
    maxWidth: number;
}) {
    const cleanupResizeRef = useRef<(() => void) | null>(null);
    const resizeRef = useRef({
        direction: 0,
        height: 0,
        ratio: 1,
        startHeight: 0,
        startWidth: 0,
        startX: 0,
        startY: 0,
        width: 0,
    });

    useEffect(() => () => cleanupResizeRef.current?.(), []);

    const startResize = (event: React.PointerEvent, direction: number) => {
        const image = imageRef.current;
        if (!image) return;
        event.preventDefault();
        event.stopPropagation();

        const bounds = image.getBoundingClientRect();
        const zoom = calculateZoomLevel(image);
        const resize = resizeRef.current;
        resize.direction = direction;
        resize.startWidth = bounds.width;
        resize.startHeight = bounds.height;
        resize.ratio = bounds.height > 0 ? bounds.width / bounds.height : 1;
        resize.startX = event.clientX / zoom;
        resize.startY = event.clientY / zoom;
        resize.width = bounds.width;
        resize.height = bounds.height;

        document.body.style.userSelect = 'none';

        const onMove = (moveEvent: PointerEvent) => {
            const currentZoom = calculateZoomLevel(image);
            const east = direction & 1;
            const south = direction & 2;
            const west = direction & 4;
            const north = direction & 8;
            const horizontal = east || west;
            const vertical = north || south;
            const editorWidth = editor.getRootElement()?.getBoundingClientRect().width || maxWidth;
            const maxAvailableWidth = Math.max(100, Math.min(maxWidth, editorWidth - 32));

            if (horizontal && vertical) {
                const rawDelta = moveEvent.clientX / currentZoom - resize.startX;
                const delta = east ? rawDelta : -rawDelta;
                resize.width = Math.min(maxAvailableWidth, Math.max(100, resize.startWidth + delta));
                resize.height = resize.width / resize.ratio;
            } else if (horizontal) {
                const rawDelta = moveEvent.clientX / currentZoom - resize.startX;
                const delta = east ? rawDelta : -rawDelta;
                resize.width = Math.min(maxAvailableWidth, Math.max(100, resize.startWidth + delta));
            } else if (vertical) {
                const rawDelta = moveEvent.clientY / currentZoom - resize.startY;
                const delta = south ? rawDelta : -rawDelta;
                resize.height = Math.max(100, resize.startHeight + delta);
            }

            image.style.width = `${resize.width}px`;
            image.style.height = `${resize.height}px`;
        };

        const onEnd = () => {
            cleanupResizeRef.current?.();
            document.body.style.userSelect = '';
            editor.update(() => {
                const node = $getNodeByKey(nodeKey);
                if ($isImageNode(node)) {
                    node.setWidthAndHeight(Math.round(resize.width), Math.round(resize.height));
                }
            });
        };

        document.addEventListener('pointermove', onMove);
        document.addEventListener('pointerup', onEnd);
        document.addEventListener('pointercancel', onEnd);
        cleanupResizeRef.current = () => {
            document.removeEventListener('pointermove', onMove);
            document.removeEventListener('pointerup', onEnd);
            document.removeEventListener('pointercancel', onEnd);
            cleanupResizeRef.current = null;
        };
    };

    return (
        <div className="lexical-image-resizer" contentEditable={false}>
            <button type="button" className="resize-handle resize-n" aria-label="Resize ảnh phía trên" onPointerDown={(event) => startResize(event, 8)} />
            <button type="button" className="resize-handle resize-ne" aria-label="Resize ảnh góc trên phải" onPointerDown={(event) => startResize(event, 9)} />
            <button type="button" className="resize-handle resize-e" aria-label="Resize ảnh bên phải" onPointerDown={(event) => startResize(event, 1)} />
            <button type="button" className="resize-handle resize-se" aria-label="Resize ảnh góc dưới phải" onPointerDown={(event) => startResize(event, 3)} />
            <button type="button" className="resize-handle resize-s" aria-label="Resize ảnh phía dưới" onPointerDown={(event) => startResize(event, 2)} />
            <button type="button" className="resize-handle resize-sw" aria-label="Resize ảnh góc dưới trái" onPointerDown={(event) => startResize(event, 6)} />
            <button type="button" className="resize-handle resize-w" aria-label="Resize ảnh bên trái" onPointerDown={(event) => startResize(event, 4)} />
            <button type="button" className="resize-handle resize-nw" aria-label="Resize ảnh góc trên trái" onPointerDown={(event) => startResize(event, 12)} />
        </div>
    );
}
