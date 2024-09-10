import classNames from "classnames";
import { useRef } from "react";

interface LongPressProps extends React.ComponentPropsWithoutRef<"div"> {
    onLongPress?: () => void;
}
const LongPress: React.FC<LongPressProps> = ({ onLongPress, children, ...props }) => {

    // Ref
    const containerRef = useRef<HTMLDivElement>(null);
    const pressStart = useRef<number | null>(null);
    const longPressTimeout = useRef<any>(null);

    // State
    async function handlePress (e: React.MouseEvent | React.TouchEvent) {

        // Prevent default
        e.preventDefault();
        e.stopPropagation();
        e.nativeEvent.stopImmediatePropagation();

        // Add animation
        //containerRef.current?.classList.remove('long-press-animation-0');
        containerRef.current?.classList.add('long-press-animation-1');

        // Set timeout
        pressStart.current = Date.now();
        longPressTimeout.current = setTimeout(() => {
            // Check if pressStart is still the same
            if (pressStart.current) {
                clearTimeout(longPressTimeout.current);
                pressStart.current = null;
                containerRef.current?.classList.remove('long-press-animation-1');
                onLongPress && onLongPress();
            }
        }, 1000);
    }

    async function handleRelease (e?: React.MouseEvent | React.TouchEvent | React.UIEvent) {
        // Prevent default
        if (e) {
            e.preventDefault();
            e.stopPropagation();
            e.nativeEvent.stopImmediatePropagation();
        }

        // Clear timeout
        clearTimeout(longPressTimeout.current);

        if (!pressStart) return;

        // Remove animation
        containerRef.current?.classList.remove('long-press-animation-1');

        // Reset
        pressStart.current = null;
    }

    return (
        <div
            ref={containerRef}
            className={classNames(
                "relative overflow-hidden",
                props.className
            )}
            onTouchStart={(e) => { handlePress(e); props.onTouchStart && props.onTouchStart(e); }}
            onTouchEnd={(e) => { handleRelease(e); props.onTouchEnd && props.onTouchEnd(e); }}
            onMouseDown={(e) => { handlePress(e); props.onMouseDown && props.onMouseDown(e); }}
            onMouseUp={(e) => { handleRelease(e); props.onMouseUp && props.onMouseUp(e); }}
            onMouseLeave={(e) => { handleRelease(e); props.onMouseLeave && props.onMouseLeave(e); }}
            onTouchMove={(e) => { handleRelease(e); props.onTouchMove && props.onTouchMove(e); }}
            onScroll={(e) => { handleRelease(e); props.onScroll && props.onScroll(e); }}

            onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                e.nativeEvent.stopImmediatePropagation();
                props.onClick && props.onClick(e);
            }}
            {...props}
        >
            {children}
        </div>
    );
}

export default LongPress;
export { LongPress }
export type { LongPressProps }