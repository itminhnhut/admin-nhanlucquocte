// Gõ "/" ngay trong bài là hiện danh sách khối để chèn, gõ tiếp để lọc.
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { LexicalTypeaheadMenuPlugin, MenuOption, useBasicTypeaheadTriggerMatch } from '@lexical/react/LexicalTypeaheadMenuPlugin';
import { useCallback, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Swal from 'sweetalert2';
import { uploadNewsImage } from '../lib/upload';
import Icon from '../ui/icons';
import { BlockAction, createBlockActions, filterBlockActions } from './blockOptions';
import { INSERT_IMAGE_COMMAND } from './ImagesPlugin';

class BlockMenuOption extends MenuOption {
    constructor(public action: BlockAction) {
        super(action.key);
    }
}

function BlockPickerPlugin() {
    const [editor] = useLexicalComposerContext();
    const [query, setQuery] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const triggerMatch = useBasicTypeaheadTriggerMatch('/', { minLength: 0 });

    const uploadAndInsert = useCallback(
        async (file: File) => {
            try {
                const url = await uploadNewsImage(file);
                editor.dispatchCommand(INSERT_IMAGE_COMMAND, { src: url, altText: file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ') });
            } catch (error) {
                Swal.fire({ icon: 'error', title: 'Lỗi', text: error instanceof Error ? error.message : 'Upload ảnh thất bại.' });
            } finally {
                if (fileInputRef.current) fileInputRef.current.value = '';
            }
        },
        [editor],
    );

    const actions = useMemo(() => createBlockActions(() => fileInputRef.current?.click()), []);
    const matching = useMemo(() => filterBlockActions(actions, query).map((action) => new BlockMenuOption(action)), [actions, query]);

    return (
        <>
            <input ref={fileInputRef} hidden type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={(event) => event.target.files?.[0] && uploadAndInsert(event.target.files[0])} />
            <LexicalTypeaheadMenuPlugin<BlockMenuOption>
                options={matching}
                onQueryChange={setQuery}
                triggerFn={triggerMatch}
                onSelectOption={(option, nodeToRemove, closeMenu) => {
                    editor.update(() => nodeToRemove?.remove());
                    closeMenu();
                    option.action.run(editor);
                }}
                menuRenderFn={(anchorRef, { selectedIndex, selectOptionAndCleanUp, setHighlightedIndex }) =>
                    anchorRef.current && matching.length > 0
                        ? createPortal(
                              <div className="lexical-block-picker">
                                  <div className="lexical-block-picker-hint">Gõ để lọc khối…</div>
                                  {matching.map((option, index) => (
                                      <button
                                          key={option.key}
                                          type="button"
                                          ref={(element) => option.setRefElement(element)}
                                          className={index === selectedIndex ? 'is-active' : ''}
                                          onMouseEnter={() => setHighlightedIndex(index)}
                                          onClick={() => {
                                              setHighlightedIndex(index);
                                              selectOptionAndCleanUp(option);
                                          }}
                                      >
                                          <Icon name={option.action.iconName} />
                                          <span>{option.action.label}</span>
                                      </button>
                                  ))}
                              </div>,
                              anchorRef.current,
                          )
                        : null
                }
            />
        </>
    );
}

export { BlockPickerPlugin };
