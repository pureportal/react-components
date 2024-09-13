import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { default as defaultAxiosInstance } from '@/helpers/shared/axios';
import missingImage from "./ImageMissingImage.svg";
import classNames from "classnames";
import { AxiosInstance } from "axios";
import logger from "./Logger";

interface ImageProps extends React.ComponentPropsWithoutRef<"img"> {
    uniqueKey?: string;
    fallback?: string;
    axiosInstance?: AxiosInstance;
}
interface ImageRef {
    refresh: () => void;
}
const Image = forwardRef<ImageRef, ImageProps>(({fallback = missingImage, axiosInstance = defaultAxiosInstance, ...props}, ref) => {

    // Refs
    const refreshTimer = useRef<NodeJS.Timeout | null>(null);

    // States
    const [image, setImage] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    // Functions
    async function loadImage () {
        try {
            logger.debug('ce8c848f-2aa3-436a-8096-0c598354f797', 'Loading image:', props.src);

            const response = await axiosInstance({
                method: 'GET',
                url: props.src,
                responseType: 'arraybuffer',
            });
            if (response.status === 200) {
                const base64 = btoa(
                    new Uint8Array(response.data).reduce(
                        (data, byte) => data + String.fromCharCode(byte),
                        '',
                    ),
                );
                setImage('data:;base64,' + base64);
            }
            else if (response.status === 404) {
                setImage(null);
                logger.error('f1b618a8-78f9-40e2-9a5d-72a29d1f1ebc','Image not found:', props.src);
            }
            else {
                logger.error('b59e9aa7-f374-4c98-9b46-8c18af43f23e','An error occurred:', response);
            }
            setLoading(false);
        }
        catch (error) {
            logger.error('dcc13bfe-ecd7-4537-838e-742550281c92','An error occurred', error);
        }
    }

    // Effects
    useEffect(() => { // Initial load
        if (refreshTimer.current) {
            clearInterval(refreshTimer.current);
        }
        refreshTimer.current = setInterval(() => {
            loadImage();
        }, 5000);
        loadImage();
        return () => {
            if (refreshTimer.current) {
                clearInterval(refreshTimer.current);
            }
        }
    }, [props.src, props.alt, props.uniqueKey]);

    useEffect(() => { // Cleanup
        setImage(null);
    }, [props.src, props.uniqueKey]);

    // Imperative handle
    useImperativeHandle(ref, () => ({
        refresh: () => {
            loadImage();
        }
    }));

    // Render
    if (loading && image === null) {
        return <div className={classNames(
            "flex justify-center items-center",
            props.className
        )}>
            <div className="bg-gray-200 animate-pulse w-full h-full"></div>
        </div>
    }
    else if (image === null) {
        return <img {...props} src={fallback} alt={props.alt} />
    }
    else {
        return <img {...props} src={image} alt={props.alt} />
    }
});
export default Image;