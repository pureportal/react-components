import React, { forwardRef, useEffect, useImperativeHandle, useRef, useReducer, useMemo, useCallback, useState } from "react";
import { default as defaultAxiosInstance } from '@/helpers/base/axios';
import missingImage from "@/assets/missing-image.svg";
import classNames from "classnames";
import { AxiosInstance } from "axios";
import { Buffer } from 'buffer';
import { useInViewport, useOnScreen } from "@/helpers/base/helpers";

const imageCache = new Map();
const loadPromises = {};
const CACHE_DURATION = 1000 * 60 * 15; // 15 minutes

interface ImageProps extends React.ComponentPropsWithoutRef<"img"> {
    uniqueKey?: string;
    checkHash?: boolean;
    fallback?: string;
    fallbackElement?: React.ReactNode;
    axiosInstance?: AxiosInstance;
    problemHandling?: "fallback" | "hide" | "error";
    hideWhenNotVisible?: boolean;
    onImageReady?: () => void;
    onImageError?: () => void;
}
interface CachedImageRef {
    refresh: () => void;
}
const CachedImage = forwardRef<CachedImageRef, ImageProps>(({
    checkHash = true,
    fallback = missingImage,
    axiosInstance = defaultAxiosInstance,
    fallbackElement,
    problemHandling = "fallback",
    hideWhenNotVisible = false,
    onImageReady,
    onImageError,
    ...props
}, ref) => {

    const [isTabVisible, setIsTabVisible] = useState(true);
    const [imageSrc, setImageSrc] = React.useState<string | null>(null);
    const [imageHash, setImageHash] = React.useState<string | null>(null);
    const [loading, setLoading] = React.useState<boolean>(true);

    const { isInViewport, ref: me } = useInViewport();

    const handleVisibilityChange = useCallback(() => {
        setIsTabVisible(document.visibilityState === 'visible');
      }, []);

    useEffect(() => {
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => {
          document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, []);

    useEffect(() => {
        let isMounted = true;

        const load = async (force = false) => {

            // Check if tab is visible
            if (!isTabVisible || !isInViewport) {
                return;
            }

            if (!force && (imageCache.has(props.src) && (!checkHash || imageCache.get(props.src).hash === imageHash))) {
                const cachedData = imageCache.get(props.src);
                if (cachedData && Date.now() - cachedData.added < CACHE_DURATION) {
                    const { objectURL } = cachedData;

                    if (isMounted) {
                        setImageSrc(objectURL);
                        setLoading(false);
                    }
                    return;
                }
            }

            if (loadPromises[props.src]) {
                await loadPromises[props.src];
            } else {
                loadPromises[props.src] = new Promise<void>(async (resolve, reject) => {
                    try {
                        let hashFromServer = null;
                        if (checkHash) {
                            const response = await axiosInstance({
                                method: 'GET',
                                url: `${props.src}?hash`,
                            });
                            if(response.status === 200) {
                                hashFromServer = response.data.hash;
                                const cachedData = imageCache.get(props.src);
                                if(cachedData && hashFromServer === cachedData.hash) {
                                    resolve();
                                    return;
                                }
                            }
                        }

                        console.log(`[CachedImage] Fetching ${props.src}`);
                        const response = await axiosInstance({
                            method: 'GET',
                            url: `${props.src}`,
                            responseType: 'arraybuffer',
                        });
                        if(response.status !== 200) {
                            setLoading(false);
                            setImageSrc(null);
                            return
                        }
                        const blob = new Blob([Buffer.from(response.data)], { type: response.headers['content-type'] });
                        const objectURL = URL.createObjectURL(blob);

                        imageCache.set(props.src, { objectURL, hash: hashFromServer, added: Date.now() });
                        if (isMounted) {
                            setImageSrc(objectURL);
                            setLoading(false);
                        }
                        resolve();
                    } catch (error) {
                        console.error(`Failed to load image from ${props.src}`, error);
                        reject(error);
                        if (isMounted) {
                            setLoading(false);
                        }
                    } finally {
                        delete loadPromises[props.src];
                    }
                });

                await loadPromises[props.src];
            }

            if (isMounted) {
                const { objectURL } = imageCache.get(props.src);
                setImageSrc(objectURL);
                setLoading(false);
            }
        };

        load();
        const timer = setInterval(() => {
            load(true);
        }, 2000);

        return () => {
            isMounted = false;
            clearInterval(timer);
        };
    }, [props.src, imageHash, checkHash, axiosInstance, isTabVisible, isInViewport]);

    useEffect(() => {
        // Check for new image - hash is different
        const interval = setInterval(async () => {
            const cachedData = imageCache.get(props.src);
            if (cachedData && cachedData.hash !== imageHash) {
                setImageSrc(cachedData.objectURL);
                setLoading(false);
            }
        }, 500);

        return () => clearInterval(interval);
    }, [props.src, imageHash]);

    useImperativeHandle(ref, () => ({
        refresh: () => {
            setImageSrc(null);
            setLoading(true);
        }
    }));

    const renderImage = () => {
        if (imageSrc !== null) {
            return <img {...props} src={imageSrc} alt={props.alt} loading="lazy" className={classNames("overflow-hidden", props.className)} />;
        } else if (loading) {
            return (
                <div className={classNames("relative flex justify-center items-center overflow-hidden", props.className)} aria-busy="true" role="img">
                    <div className="absolute top-0 left-0 w-full h-full bg-gray-300 animate-pulse"></div>
                </div>
            );
        } else {
            if (problemHandling === "hide") {
                return null;
            } else if (problemHandling === "error") {
                throw new Error("Image not found: " + props.src);
            } else {
                if (fallbackElement) {
                    return <div>{fallbackElement}</div>;
                }
                return <img {...props} src={fallback ?? missingImage} alt={props.alt} loading="lazy" className={classNames("overflow-hidden", props.className)} />;
            }
        }
    };

    try {
        return <>
            <div ref={me} className="relative" /> {/* Dot above the image to check if it's in viewport */}
            {hideWhenNotVisible && !isInViewport ? null : renderImage()}
        </>
    } catch (error) {
        console.error('Error rendering image:', error);
        onImageError?.();
        return null;
    }
});

CachedImage.displayName = 'CachedImage';

export default CachedImage;