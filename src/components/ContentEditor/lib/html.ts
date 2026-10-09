// Chuẩn hoá và làm sạch HTML: dùng cả khi nạp nội dung vào editor và khi xuất ra để lưu.
import { removeVietnameseTones } from '../../../utils/slug';

export type { ImageAlignment };
export { getImageAlignment, slugify, separateMediaBlocks, removeLegacyMediaSpacers, normalizeExportedHtml, sanitizeInitialHtml, isSafeHttpUrl };

type ImageAlignment = 'left' | 'center' | 'right';

function getImageAlignment(element: HTMLElement): ImageAlignment {
    const storedAlignment = element.dataset.imageAlignment;
    if (storedAlignment === 'center' || storedAlignment === 'right') return storedAlignment;
    const parentAlignment = (element.closest('p, div') as HTMLElement | null)?.style.textAlign;
    if (parentAlignment === 'center' || parentAlignment === 'right') return parentAlignment;
    if (element.style.marginLeft === 'auto' && element.style.marginRight === 'auto') return 'center';
    if (element.style.marginLeft === 'auto' && element.style.marginRight === '0px') return 'right';
    return 'left';
}

function slugify(value: string) {
    return removeVietnameseTones(value)
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-_]/g, '');
}

function separateMediaBlocks(documentNode: Document) {
    Array.from(documentNode.body.querySelectorAll<HTMLElement>('p, div')).forEach((block) => {
        const children = Array.from(block.childNodes);
        const hasDirectMedia = children.some((child) => child instanceof HTMLImageElement || child instanceof HTMLIFrameElement);
        const hasOtherContent = children.some(
            (child) =>
                !(child instanceof HTMLImageElement || child instanceof HTMLIFrameElement) &&
                (child.nodeType !== Node.TEXT_NODE || Boolean(child.textContent?.trim())),
        );
        if (!hasDirectMedia || !hasOtherContent) return;

        const replacements: HTMLElement[] = [];
        let textBlock: HTMLElement | null = null;
        children.forEach((child) => {
            if (child instanceof HTMLImageElement || child instanceof HTMLIFrameElement) {
                textBlock = null;
                const mediaBlock = block.cloneNode(false) as HTMLElement;
                mediaBlock.append(child);
                replacements.push(mediaBlock);
                return;
            }
            if (!textBlock) {
                textBlock = block.cloneNode(false) as HTMLElement;
                replacements.push(textBlock);
            }
            textBlock.append(child);
        });
        block.replaceWith(...replacements.filter((replacement) => replacement.textContent?.trim() || replacement.querySelector('img, iframe')));
    });
}

function removeLegacyMediaSpacers(documentNode: Document) {
    Array.from(documentNode.body.querySelectorAll<HTMLElement>('p, div')).forEach((block) => {
        const hasDirectMedia = Array.from(block.children).some((child) => child.matches('img, figure, iframe'));
        if (!hasDirectMedia) return;

        const nextBlock = block.nextElementSibling;
        if (
            nextBlock?.matches('p, div') &&
            !nextBlock.textContent?.trim() &&
            !nextBlock.querySelector('img, figure, iframe')
        ) {
            nextBlock.remove();
        }
    });
}

function normalizeExportedHtml(html: string) {
    const documentNode = new DOMParser().parseFromString(html, 'text/html');
    separateMediaBlocks(documentNode);
    const counters = new Map<string, number>();
    Array.from(documentNode.body.querySelectorAll('h1, h2, h3')).forEach((heading) => {
        const text = heading.textContent?.trim() || '';
        const base = slugify(text) || 'heading';
        const count = counters.get(base) || 0;
        counters.set(base, count + 1);
        const id = count ? `${base}-${count + 1}` : base;
        heading.id = id;
    });

    Array.from(documentNode.body.querySelectorAll<HTMLElement>('p, div')).forEach((block) => {
        block.querySelectorAll<HTMLElement>(':scope > img, :scope > figure').forEach((media) => {
            const alignment = getImageAlignment(media);
            media.dataset.imageAlignment = alignment;
            media.style.marginTop = '0';
            media.style.marginBottom = '0';
            if (alignment === 'center') {
                media.style.marginLeft = 'auto';
                media.style.marginRight = 'auto';
            } else if (alignment === 'right') {
                media.style.marginLeft = 'auto';
                media.style.marginRight = '0';
            } else {
                media.style.marginLeft = '0';
                media.style.marginRight = 'auto';
            }
        });
    });

    return sanitizeInitialHtml(documentNode.body.innerHTML);
}

function sanitizeInitialHtml(html: string) {
    const documentNode = new DOMParser().parseFromString(html, 'text/html');
    separateMediaBlocks(documentNode);
    removeLegacyMediaSpacers(documentNode);
    documentNode.body.querySelectorAll('script, style, object, embed').forEach((element) => element.remove());
    documentNode.body.querySelectorAll('*').forEach((element) => {
        Array.from(element.attributes).forEach((attribute) => {
            const name = attribute.name.toLowerCase();
            const value = attribute.value.trim().toLowerCase();
            if (name.startsWith('on') || ((name === 'href' || name === 'src') && value.startsWith('javascript:'))) {
                element.removeAttribute(attribute.name);
            }
            if (name === 'srcdoc') element.removeAttribute(attribute.name);
        });
        if (element.tagName === 'IFRAME') {
            const source = element.getAttribute('src') || '';
            if (!isSafeHttpUrl(source)) element.remove();
            else {
                element.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-presentation');
                element.setAttribute('loading', 'lazy');
            }
        }
    });
    return documentNode.body.innerHTML;
}

function isSafeHttpUrl(value: string) {
    try {
        const url = new URL(value, window.location.origin);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
        return false;
    }
}
