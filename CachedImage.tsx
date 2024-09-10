import React, { forwardRef, useEffect, useImperativeHandle, useRef, useReducer, useMemo, useCallback, useState } from "react";
import { default as defaultAxiosInstance } from '@/helpers/base/axios';
import missingImage from "./ImageMissingImage.svg";
import classNames from "classnames";
import { AxiosInstance } from "axios";
import { Buffer } from 'buffer';
import logger from "./Logger";

// Constants
const CACHE_EXPIRY_TIME = 5 * 60 * 1000; // 5 minutes
const REFRESH_INTERVAL = 10000; // 10 seconds

// Types
interface CacheItem {
    src: string;
    data: string;
    hash: string | null;
    stillInUse: Date;
}

interface CacheState {
    cache: CacheItem[];
    ongoingLoads: string[];
    lastUpdate?: number;
}

type CacheAction =
    | { type: 'ADD_CACHE_ITEM'; payload: CacheItem }
    | { type: 'REMOVE_CACHE_ITEM'; payload: string }
    | { type: 'ADD_ONGOING_LOAD'; payload: string }
    | { type: 'REMOVE_ONGOING_LOAD'; payload: string }
    | { type: 'CLEANUP'; payload: number };

interface ImageProps extends React.ComponentPropsWithoutRef<"img"> {
    axiosInstance?: AxiosInstance;
    checkHash?: boolean;
    fallback?: string;
    fallbackElement?: React.ReactNode;
    onImageError?: () => void;
    onImageReady?: () => void;
    problemHandling?: "fallback" | "hide" | "error";
    uniqueKey?: string;
    notInViewHandling?: "show" | "hide" | "remove_from_cache";
}

interface CachedImageRef {
    refresh: () => void;
}

// Reducer
const cacheReducer = (state: CacheState, action: CacheAction): CacheState => {
    switch (action.type) {
        case 'ADD_CACHE_ITEM':
            return { ...state, cache: [...state.cache.filter(item => item.src !== action.payload.src), action.payload] };
        case 'REMOVE_CACHE_ITEM':
            return { 
                ...state, 
                cache: state.cache.filter(item => item.src !== action.payload),
                lastUpdate: Date.now()
            };
        case 'ADD_ONGOING_LOAD':
            return { ...state, ongoingLoads: [...state.ongoingLoads, action.payload] };
        case 'REMOVE_ONGOING_LOAD':
            return { ...state, ongoingLoads: state.ongoingLoads.filter(item => item !== action.payload) };
        case 'CLEANUP':
            return { ...state, cache: state.cache.filter(item => item.stillInUse.getTime() > action.payload) };
        default:
            return state;
    }
};

const CachedImage = forwardRef<CachedImageRef, ImageProps>(({
    axiosInstance = defaultAxiosInstance,
    checkHash = true,
    fallback = missingImage,
    fallbackElement,
    onImageError,
    onImageReady,
    problemHandling = "fallback",
    notInViewHandling = "show",
    ...props
}, ref) => {
    const [cacheState, dispatch] = useReducer(cacheReducer, { cache: [], ongoingLoads: [], lastUpdate: Date.now() });
    const refreshTimer = useRef<NodeJS.Timeout | null>(null);
    const imageRef = useRef<HTMLImageElement>(null);
    const [isInView, setIsInView] = useState(false);

    const loadImage = useCallback(async () => {
        if (typeof props.src !== "string" || props.src.length <= 0 || cacheState.ongoingLoads.includes(props.src) || !isInView) {
            return;
        }

        try {
            dispatch({ type: 'ADD_ONGOING_LOAD', payload: props.src });

            let image = cacheState.cache.find(item => item.src === props.src);

            if (image) {
                image.stillInUse = new Date();
            }

            if (!checkHash && image) {
                return;
            }

            let newHash = null;
            if (checkHash) {
                logger.debug('557a3144-b4f0-457d-b056-379c3a2d8b82', 'Checking hash for', props.src);
                const response = await axiosInstance({
                    method: 'GET',
                    url: `${props.src}?hash`,
                });
                if (response.status === 200) {
                    newHash = response.data.hash;
                    if (image && image.hash === newHash) {
                        return;
                    }
                } else if (response.status === 404) {
                    dispatch({ type: 'REMOVE_CACHE_ITEM', payload: props.src });
                    return;
                } else {
                    logger.error('0eae3593-11f2-410a-b767-e1f16d4b38af','An error occurred:', response);
                    onImageError?.();
                    return;
                }
            }

            logger.debug('70a9eb4f-86b7-430b-873d-ed7322867703', 'Loading image:', props.src);
            const response = await axiosInstance({
                method: 'GET',
                url: props.src,
                responseType: 'arraybuffer',
            });

            if (response.status === 200) {
                if(!isInView) {
                    logger.info('70450322-be48-4050-adf5-ebfb0cf22415', 'Not in view anymore:', props.src);
                    return;
                }
                const base64 = Buffer.from(response.data).toString('base64');
                dispatch({
                    type: 'ADD_CACHE_ITEM',
                    payload: {
                        src: props.src,
                        data: 'data:;base64,' + base64,
                        hash: newHash,
                        stillInUse: new Date(),
                    }
                });
                onImageReady?.();
            } else if (response.status === 404) {
                logger.warn('b73d912f-ef28-5a52-929a-6b18da7850e5', 'Image not found:', props.src);
                dispatch({ type: 'REMOVE_CACHE_ITEM', payload: props.src });
                onImageError?.();
            } else {
                logger.error('a966c2f5-c61f-402b-9fa1-9b98b5b8ad0c','An error occurred:', response);
                onImageError?.();
                // Retry after 10 seconds
                setTimeout(loadImage, 2000); // 2 seconds
            }
        } catch (error) {
            logger.error('5b753ddf-b235-489f-9973-c3933aba197f','An error occurred', error);
            onImageError?.();
        } finally {
            dispatch({ type: 'REMOVE_ONGOING_LOAD', payload: props.src });
        }
    }, [props.src, checkHash, axiosInstance, onImageReady, onImageError, isInView]);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsInView(true);
                } else {
                    setIsInView(false);
                    if(notInViewHandling === "remove_from_cache" && props.src) {
                        logger.debug('7d75758c-c31d-4b2a-ae02-5c426c80c95f', 'Removing from cache because not in view:', props.src);
                        //dispatch({ type: 'REMOVE_CACHE_ITEM', payload: props.src });
                    }
                }
            },
            { threshold: 0.1 }
        );

        if (imageRef.current) {
            observer.observe(imageRef.current);
        }

        return () => {
            if (imageRef.current) {
                observer.unobserve(imageRef.current);
            }
        };
    }, [notInViewHandling, props.src]);

    useEffect(() => {
        if (isInView) {
            refreshTimer.current = setInterval(loadImage, REFRESH_INTERVAL);
            loadImage();
        }
        return () => {
            if (refreshTimer.current) {
                clearInterval(refreshTimer.current);
            }
        };
    }, [loadImage, isInView]);

    useEffect(() => {
        dispatch({ type: 'CLEANUP', payload: Date.now() - CACHE_EXPIRY_TIME });
    }, []);

    useImperativeHandle(ref, () => ({
        refresh: loadImage
    }));

    const image = useMemo(() => cacheState.cache.find(item => item.src === props.src)?.data ?? null, [cacheState.cache, props.src, cacheState.lastUpdate]);

    const renderImage = () => {
        if (!isInView && notInViewHandling === "hide") {
            return <div ref={imageRef} style={{ height: '1px', width: '1px' }} />;
        }
        
        if (image !== null) {
            return <img ref={imageRef} {...props} src={image} alt={props.alt} loading="lazy" />;
        } else if (typeof props.src === "string" && cacheState.ongoingLoads.includes(props.src) && image === null) {
            return (
                <div ref={imageRef} className={classNames("flex justify-center items-center", props.className)} aria-busy="true" role="img">
                    <div className="absolute inset-0">
                        <div className="w-full h-full bg-gray-300 animate-pulse" />
                    </div>
                </div>
            );
        } else if (typeof props.src !== "string" || image === null) {
            if (problemHandling === "hide") {
                return null;
            } else if (problemHandling === "error") {
                throw new Error("Image not found: " + props.src);
            } else {
                if (fallbackElement) {
                    return React.cloneElement(fallbackElement as React.ReactElement, { ref: imageRef });
                }
                return <img ref={imageRef} {...props} src={fallback ?? missingImage} alt={props.alt} loading="lazy" />;
            }
        } else {
            return <img ref={imageRef} {...props} src={image} alt={props.alt} loading="lazy" />;
        }
    };

    try {
        return renderImage();
    } catch (error) {
        logger.error('0ebf9d75-d047-411b-a061-3fddea182fd9','Error rendering image:', error);
        onImageError?.();
        return null;
    }
});

CachedImage.displayName = 'CachedImage';

export default CachedImage;