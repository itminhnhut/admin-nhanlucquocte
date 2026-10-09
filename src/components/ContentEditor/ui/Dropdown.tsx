// Menu thả xuống cho thanh công cụ: có nhãn chữ để người không quen icon vẫn đọc được.
// Đóng khi bấm ra ngoài hoặc nhấn Esc.
import { ReactNode, useEffect, useRef, useState } from 'react';
import Icon from './icons';

export type DropdownItem = {
    value: string;
    label: string;
    icon?: string;
    /** Mô tả ngắn hiện dưới nhãn, giúp người mới biết nút làm gì */
    hint?: string;
};

type DropdownProps = {
    /** Nhãn hiện trên nút khi không có mục nào đang chọn */
    label: string;
    icon?: string;
    title: string;
    items: readonly DropdownItem[];
    activeValue?: string;
    onSelect: (value: string) => void;
    /** Hiện nhãn của mục đang chọn thay cho `label` */
    showActiveLabel?: boolean;
    children?: ReactNode;
};

function Dropdown({ label, icon, title, items, activeValue, onSelect, showActiveLabel = false }: DropdownProps) {
    const [open, setOpen] = useState(false);
    // Gần đáy màn hình thì menu lật lên trên, không để bị cắt mất mục bên dưới
    const [dropUp, setDropUp] = useState(false);
    const rootRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
        const trigger = rootRef.current?.getBoundingClientRect();
        if (trigger) {
            const estimatedHeight = Math.min(items.length * 46 + 12, 420);
            const spaceBelow = window.innerHeight - trigger.bottom;
            setDropUp(spaceBelow < estimatedHeight && trigger.top > spaceBelow);
        }
        const onPointerDown = (event: PointerEvent) => {
            if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
        };
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') setOpen(false);
        };
        document.addEventListener('pointerdown', onPointerDown);
        document.addEventListener('keydown', onKeyDown);
        return () => {
            document.removeEventListener('pointerdown', onPointerDown);
            document.removeEventListener('keydown', onKeyDown);
        };
    }, [open, items.length]);

    const active = items.find((item) => item.value === activeValue);
    const buttonLabel = showActiveLabel && active ? active.label : label;

    return (
        <div className="lexical-dropdown" ref={rootRef}>
            <button
                type="button"
                className={`lexical-dropdown-trigger ${open ? 'is-open' : ''}`}
                title={title}
                aria-haspopup="menu"
                aria-expanded={open}
                onClick={() => setOpen((value) => !value)}
            >
                {(active?.icon || icon) && <Icon name={active?.icon || icon || ''} />}
                <span className="lexical-dropdown-label">{buttonLabel}</span>
                <Icon name="caret" className="lexical-dropdown-caret" />
            </button>
            {open && (
                <div className={`lexical-dropdown-menu ${dropUp ? 'is-up' : ''}`} role="menu">
                    {items.map((item) => (
                        <button
                            key={item.value}
                            type="button"
                            role="menuitem"
                            className={item.value === activeValue ? 'is-active' : ''}
                            onClick={() => {
                                onSelect(item.value);
                                setOpen(false);
                            }}
                        >
                            {item.icon && <Icon name={item.icon} />}
                            <span>
                                {item.label}
                                {item.hint && <small>{item.hint}</small>}
                            </span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

export default Dropdown;
