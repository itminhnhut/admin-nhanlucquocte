import { ForwardedRef, ReactNode, forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import type { Placement } from '@popperjs/core';
import { usePopper } from 'react-popper';

type DropdownProps = {
    button: ReactNode;
    children: ReactNode;
    btnClassName?: string;
    placement?: Placement;
    offset?: [number, number];
};

export type DropdownHandle = { close: () => void };

const Dropdown = (props: DropdownProps, forwardedRef: ForwardedRef<DropdownHandle>) => {
    const [visibility, setVisibility] = useState(false);

    const referenceRef = useRef<HTMLButtonElement>(null);
    const popperRef = useRef<HTMLDivElement>(null);

    const { styles, attributes } = usePopper(referenceRef.current, popperRef.current, {
        placement: props.placement || 'bottom-end',
        modifiers: [
            {
                name: 'offset',
                options: {
                    offset: props.offset ?? [0, 0],
                },
            },
        ],
    });

    const handleDocumentClick = (event: MouseEvent) => {
        const target = event.target as Node;
        if (referenceRef.current?.contains(target) || popperRef.current?.contains(target)) {
            return;
        }

        setVisibility(false);
    };

    useEffect(() => {
        document.addEventListener('mousedown', handleDocumentClick);
        return () => {
            document.removeEventListener('mousedown', handleDocumentClick);
        };
    }, []);

    useImperativeHandle(forwardedRef, () => ({
        close() {
            setVisibility(false);
        },
    }));

    return (
        <>
            <button
                ref={referenceRef}
                type="button"
                className={props.btnClassName}
                onClick={() => setVisibility(!visibility)}
            >
                {props.button}
            </button>

                <div
                ref={popperRef}
                style={styles.popper}
                {...attributes.popper}
                className="z-50"
                onClick={() => setVisibility(!visibility)}
                >
                    {visibility && props.children}
                </div>

        </>
    );
};

export default forwardRef(Dropdown);
