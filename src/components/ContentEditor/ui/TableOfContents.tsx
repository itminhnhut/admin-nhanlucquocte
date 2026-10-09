// Mục lục tự sinh từ H1/H2/H3, bấm vào là cuộn tới tiêu đề đó.
// Bài chưa có tiêu đề nào thì ẩn hẳn, không hiện khối rỗng cho rối mắt.
import { TableOfContentsPlugin } from '@lexical/react/LexicalTableOfContentsPlugin';

function OfficialTableOfContents() {
    return (
        <TableOfContentsPlugin>
            {(entries, editor) => {
                const headings = entries.filter(([, , tag]) => tag === 'h1' || tag === 'h2' || tag === 'h3');
                if (headings.length === 0) return <></>;

                return (
                    <aside className="lexical-toc-panel">
                        <div className="lexical-toc-panel-header">
                            <div>
                                <strong>Mục lục bài viết</strong>
                                <span>Tự động lấy từ tiêu đề H1, H2 và H3</span>
                            </div>
                            <span className="lexical-toc-count">{headings.length} mục</span>
                        </div>
                        <ol className="lexical-toc-panel-list">
                            {headings.map(([key, text, tag], index) => (
                                <li key={key} className={tag === 'h3' ? 'is-subheading' : ''}>
                                    <button type="button" onClick={() => editor.getElementByKey(key)?.scrollIntoView({ behavior: 'smooth', block: 'center' })}>
                                        <span>{index + 1}</span>
                                        {text || 'Tiêu đề chưa có nội dung'}
                                    </button>
                                </li>
                            ))}
                        </ol>
                    </aside>
                );
            }}
        </TableOfContentsPlugin>
    );
}

export { OfficialTableOfContents };
