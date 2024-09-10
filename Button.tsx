// Extend the button component

import classNames from "classnames";
import { useEffect, useState } from "react";

interface Props extends React.ComponentPropsWithoutRef<"button"> {
    flashing?: boolean;
    onLongPress?: () => void; // onClick will not be called if onLongPress is triggered
    longPressDuration?: number; // default: 500
}
const Button: React.FC<Props> = ({ flashing, onLongPress, onClick, longPressDuration, ...props }) => {
    const [timer, setTimer] = useState<NodeJS.Timeout | null>(null);
    const [longPressStart, setLongPressStart] = useState<number | null>(null); // Timestamp when long press started

    // Clear timer on unmount
    useEffect(() => {
        return () => {
            if (timer) {
                clearTimeout(timer);
            }
        }
    }, [timer]);

    // Clear timer when longPressDuration changes
    useEffect(() => {
        if (timer) {
            clearTimeout(timer);
        }
    }, [longPressDuration]);

    function clearTimer () {
        if (timer) {
            clearTimeout(timer);
            setTimer(null);
            setLongPressStart(null);
        }
    }

    function startTimer () {
        setLongPressStart(Date.now());
        if (onLongPress) {
            clearTimer()
            setTimer(setTimeout(() => {
                clearTimer();
                setLongPressStart(null);
                if (props.disabled) return;
                onLongPress();
            }, longPressDuration || 500));
        }
    }

    return (
        <>
            <button
                {...props}
                style={{
                    ...props.style,
                    position: 'relative',
                    overflow: 'hidden',
                }}
                onMouseDown={startTimer}
                onTouchStart={startTimer}
                onMouseUp={() => {
                    // Call if duration is less than longPressDuration
                    if (longPressStart && Date.now() - longPressStart < (longPressDuration || 500)) {
                        clearTimer()
                        if (!props.disabled && onClick) {
                            onClick({} as any);
                        }
                    }
                    clearTimer()
                    setLongPressStart(null);
                }}
                onTouchEnd={() => {
                    // Call if duration is less than longPressDuration
                    if (longPressStart && Date.now() - longPressStart < (longPressDuration || 500)) {
                        clearTimer()
                        if (!props.disabled && onClick) {
                            onClick({} as any);
                        }
                    }
                    clearTimer()
                    setLongPressStart(null);
                }}
                /*onClick={(e) => {
                    // Prevent onClick from being called if onLongPress is triggered
                    clearTimer()
                    if (!props.disabled && onClick) {
                        onClick(e);
                    }
                }}*/
                onMouseLeave={() => {
                    setLongPressStart(null);
                }}
            >
                <div
                    className={classNames(
                        'absolute top-0 right-0 bottom-0 left-0 opacity-50 z-0',
                        flashing ? 'bg-secondary-1 animate-ping' : 'transparent',
                    )}
                />
                {props.children}
                {/* Animate on long press -> Elipse filling the button from center */}
                {onLongPress &&
                    <div
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            height: '100%',
                            width: '100%',
                            overflow: 'hidden',
                            visibility: longPressStart ? 'visible' : 'hidden',
                            borderRadius: 9999,
                            backgroundColor: 'rgba(0,0,0,0.2)',
                            transform: longPressStart ? 'scale(1.5)' : 'scale(0)',
                            transformOrigin: 'center',
                            transition: longPressStart ? `transform ${longPressDuration || 500}ms ease-in` : 'none',
                        }}
                    />
                }
            </button>
        </>
    );
}

export default Button;