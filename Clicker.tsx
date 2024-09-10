// Extend the button component

import { useEffect, useState } from "react";

interface Props extends React.ComponentPropsWithoutRef<"div"> {
    onLongPress?: () => void; // onClick will not be called if onLongPress is triggered
    longPressDuration?: number; // default: 500
    disabled?: boolean;
    stopPropagation?: boolean;
}
const Clicker: React.FC<Props> = ({ onLongPress, onClick, onDoubleClick, longPressDuration, stopPropagation, ...props }) => {
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

    function clearTimer() {
        if (timer) {
            clearTimeout(timer);
            setTimer(null);
            setLongPressStart(null);
        }
    }

    function startTimer() {
        if (onLongPress) {
            clearTimer()
            setLongPressStart(Date.now());
            setTimer(setTimeout(() => {
                clearTimer();
                if (props.disabled) return;
                onLongPress();
            }, longPressDuration || 500));
        }
    }

    return (
        <>
            <div
                {...props}
                style={{
                    ...props.style,
                    position: 'relative',
                    overflow: 'hidden',
                }}
                onMouseDown={(e) => {
                    if(stopPropagation) e.stopPropagation();
                    logger.error('c4e3b059-3c0e-487a-8ef3-5fc9def79ad5','Clicker key:', props);
                    startTimer();
                }}
                onTouchStart={(e) => {
                    if(stopPropagation) e.stopPropagation();
                    startTimer();
                }}
                onMouseUp={(e) => {
                    if(stopPropagation) e.stopPropagation();
                    clearTimer()
                    setLongPressStart(null);
                }}
                onTouchEnd={(e) => {
                    if(stopPropagation) e.stopPropagation();
                    clearTimer()
                    setLongPressStart(null);
                }}
                onClick={(e) => {
                    if(stopPropagation) e.stopPropagation();
                    clearTimer()
                    if (!props.disabled && onClick) {
                        onClick(e);
                    }
                }}
                onMouseLeave={(e) => {
                    if(stopPropagation) e.stopPropagation();
                    setLongPressStart(null);
                }}
                onDoubleClick={(e) => {
                    if(stopPropagation) e.stopPropagation();
                    clearTimer()
                    if (!props.disabled && onDoubleClick) {
                        onDoubleClick(e);
                    }
                }}
            >
                {props.children}
                {/* Animate on long press -> Elipse filling the button from center */}
                {onLongPress &&
                    <div
                        className="absolute top-0 bottom-0 left-0 right-0 overflow-hidden flex justify-center items-center"
                    >
                        <div
                            style={{
                                height: '100%',
                                aspectRatio: '1/1',
                                visibility: typeof onLongPress != 'undefined' ? 'visible' : 'hidden',
                                borderRadius: 9999,
                                backgroundColor: 'rgba(0,0,0,0.2)',
                                transform: longPressStart ? 'scale(10)' : 'scale(0)',
                                transformOrigin: 'center',
                                transition: `transform ${(longPressDuration || 500) - 100}ms ease-in`,
                                transitionDelay: '0.1s',
                            }}
                        />
                    </div>
                }
            </div>
        </>
    );
}

export default Clicker;