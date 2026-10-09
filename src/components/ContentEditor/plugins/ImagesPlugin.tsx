// Nhận lệnh chèn ảnh: đặt ảnh thành một khối riêng rồi chọn sẵn để hiện thanh công cụ ảnh.
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $insertNodeToNearestRoot } from '@lexical/utils';
import {
    $createNodeSelection,
    $createParagraphNode,
    $getSelection,
    $isParagraphNode,
    $isRangeSelection,
    $setSelection,
    COMMAND_PRIORITY_EDITOR,
    createCommand,
    LexicalCommand,
} from 'lexical';
import { useEffect } from 'react';
import { $createImageNode, type ImagePayload } from '../nodes/ImageNode';

export { INSERT_IMAGE_COMMAND, ImagesPlugin };

const INSERT_IMAGE_COMMAND: LexicalCommand<ImagePayload> = createCommand('INSERT_IMAGE_COMMAND');

function ImagesPlugin() {
    const [editor] = useLexicalComposerContext();

    useEffect(
        () =>
            editor.registerCommand(
                INSERT_IMAGE_COMMAND,
                (payload) => {
                    const currentSelection = $getSelection();
                    const currentBlock = $isRangeSelection(currentSelection)
                        ? currentSelection.anchor.getNode().getTopLevelElement()
                        : null;
                    const imageNode = $createImageNode(payload);
                    const imageBlock = $createParagraphNode();
                    imageBlock.append(imageNode);
                    if (
                        $isParagraphNode(currentBlock) &&
                        currentBlock.getChildrenSize() === 0
                    ) {
                        currentBlock.replace(imageBlock);
                    } else {
                        $insertNodeToNearestRoot(imageBlock);
                    }
                    const selection = $createNodeSelection();
                    selection.add(imageNode.getKey());
                    $setSelection(selection);
                    return true;
                },
                COMMAND_PRIORITY_EDITOR,
            ),
        [editor],
    );

    return null;
}
