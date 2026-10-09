// Dán ảnh trực tiếp từ clipboard: tự upload rồi chèn vào bài.
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { COMMAND_PRIORITY_HIGH, PASTE_COMMAND } from 'lexical';
import { useEffect } from 'react';
import Swal from 'sweetalert2';
import { uploadNewsImage } from '../lib/upload';
import { INSERT_IMAGE_COMMAND } from './ImagesPlugin';

export { ImagePastePlugin };

function ImagePastePlugin({ setUploading }: { setUploading: (value: boolean) => void }) {
    const [editor] = useLexicalComposerContext();

    useEffect(
        () =>
            editor.registerCommand(
                PASTE_COMMAND,
                (event) => {
                    if (!(event instanceof ClipboardEvent)) return false;
                    const files = Array.from(event.clipboardData?.items || [])
                        .filter((item) => item.kind === 'file' && item.type.startsWith('image/'))
                        .map((item) => item.getAsFile())
                        .filter((file): file is File => file !== null);
                    if (files.length === 0) return false;

                    event.preventDefault();
                    setUploading(true);
                    void (async () => {
                        try {
                            for (const file of files) {
                                const url = await uploadNewsImage(file);
                                const altText = file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ');
                                editor.dispatchCommand(INSERT_IMAGE_COMMAND, { src: url, altText });
                            }
                        } catch (error) {
                            Swal.fire({ icon: 'error', title: 'Lỗi', text: error?.message || 'Không thể paste ảnh. Vui lòng thử lại.' });
                        } finally {
                            setUploading(false);
                        }
                    })();
                    return true;
                },
                COMMAND_PRIORITY_HIGH,
            ),
        [editor, setUploading],
    );

    return null;
}
