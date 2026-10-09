// Mục lục tự sinh từ H1/H2/H3, bấm vào là cuộn tới tiêu đề đó.
import { TableOfContentsPlugin } from '@lexical/react/LexicalTableOfContentsPlugin';

export { OfficialTableOfContents };

function OfficialTableOfContents() {
    return (
        <TableOfContentsPlugin>
            {(entries, editor) => (
                <aside className="lexical-toc-panel">
                    <div className="lexical-toc-panel-header">
                        <div>
                            <strong>Mục lục bài viết</strong>
                            <span>Tự động lấy từ tiêu đề H1, H2 và H3</span>
                        </div>
                        <span className="lexical-toc-count">{entries.filter(([, , tag]) => tag === 'h1' || tag === 'h2' || tag === 'h3').length} mục</span>
                    </div>
                    {entries.some(([, , tag]) => tag === 'h1' || tag === 'h2' || tag === 'h3') ? (
                        <ol className="lexical-toc-panel-list">
                            {entries
                                .filter(([, , tag]) => tag === 'h1' || tag === 'h2' || tag === 'h3')
                                .map(([key, text, tag], index) => (
                                    <li key={key} className={tag === 'h3' ? 'is-subheading' : ''}>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                editor.getElementByKey(key)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                            }}
                                        >
                                            <span>{index + 1}</span>
                                            {text || 'Tiêu đề chưa có nội dung'}
                                        </button>
                                    </li>
                                ))}
                        </ol>
                    ) : (
                        <p className="lexical-toc-panel-empty">Thêm tiêu đề H1/H2/H3 để mục lục tự xuất hiện.</p>
                    )}
                </aside>
            )}
        </TableOfContentsPlugin>
    );
}
