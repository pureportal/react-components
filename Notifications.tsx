import { useEffect, useState } from 'react';
import { MdNotifications, MdClose } from 'react-icons/md';
import { Transition } from '@headlessui/react';
import { IonPopover } from '@ionic/react';
import classNames from 'classnames';
import axiosInstance, { Fetcher } from '@/helpers/shared/axios';
import useSWR from 'swr';
import { create } from 'zustand';
import { FaCheck, FaExclamation, FaInfo, FaQuestion, FaTimes } from 'react-icons/fa';

interface useNotificationStoreType {
    visible: boolean;
    showSuccessIcon: boolean;
    showInfoIcon: boolean;
    showWarningIcon: boolean;
    showErrorIcon: boolean;
    hide: () => void;
    show: () => void;
    setShowSuccessIcon: (value: boolean) => void;
    setShowInfoIcon: (value: boolean) => void;
    setShowWarningIcon: (value: boolean) => void;
    setShowErrorIcon: (value: boolean) => void;
}
const useNotificationStore = create<useNotificationStoreType>((set) => ({
    visible: false,
    showSuccessIcon: false,
    showInfoIcon: false,
    showWarningIcon: false,
    showErrorIcon: false,
    hide: () => { set({ visible: false }) },
    show: () => { set({ visible: true }) },
    setShowSuccessIcon: (value) => { set({ showSuccessIcon: value }) },
    setShowInfoIcon: (value) => { set({ showInfoIcon: value }) },
    setShowWarningIcon: (value) => { set({ showWarningIcon: value }) },
    setShowErrorIcon: (value) => { set({ showErrorIcon: value }) },
}));

// Subscribe and reset the icon effects
let resetSuccessIconTimeout: NodeJS.Timeout | null = null;
useNotificationStore.subscribe(
    (showSuccessIcon) => {
        if (resetSuccessIconTimeout) {
            clearTimeout(resetSuccessIconTimeout);
        }
        if (showSuccessIcon) {
            resetSuccessIconTimeout = setTimeout(() => useNotificationStore.setState({ showSuccessIcon: false }), 3000);
        }
    },
);
let resetInfoIconTimeout: NodeJS.Timeout | null = null;
useNotificationStore.subscribe(
    (showInfoIcon) => {
        if (resetInfoIconTimeout) {
            clearTimeout(resetInfoIconTimeout);
        }
        if (showInfoIcon) {
            setTimeout(() => useNotificationStore.setState({ showInfoIcon: false }), 3000);
        }
    },
);
let resetWarningIconTimeout: NodeJS.Timeout | null = null;
useNotificationStore.subscribe(
    (showWarningIcon) => {
        if (resetWarningIconTimeout) {
            clearTimeout(resetWarningIconTimeout);
        }
        if (showWarningIcon) {
            setTimeout(() => useNotificationStore.setState({ showWarningIcon: false }), 3000);
        }
    },
);
let resetErrorIconTimeout: NodeJS.Timeout | null = null;
useNotificationStore.subscribe(
    (showErrorIcon) => {
        if (resetErrorIconTimeout) {
            clearTimeout(resetErrorIconTimeout);
        }
        if (showErrorIcon) {
            setTimeout(() => useNotificationStore.setState({ showErrorIcon: false }), 3000);
        }
    },
);

function getWorstUnreadColor (notifications) {
    const filtered = notifications.filter((notification) => !notification.read);
    if (filtered.length === 0) return 'text-gray-200';
    if (filtered.some((notification) => notification.type === 'error')) return 'text-red-500';
    if (filtered.some((notification) => notification.type === 'warning')) return 'text-yellow-500';
    if (filtered.some((notification) => notification.type === 'info')) return 'text-blue-500';
    if (filtered.some((notification) => notification.type === 'success')) return 'text-green-500';
    return 'text-yellow-500';
}

// Hook to toggle icon effects
const iconEffect = (type: 'success' | 'info' | 'warning' | 'error') => {
    const { setShowSuccessIcon, setShowInfoIcon, setShowWarningIcon, setShowErrorIcon } = useNotificationStore.getState();

    // Unset all
    setShowSuccessIcon(false);
    setShowInfoIcon(false);
    setShowWarningIcon(false);
    setShowErrorIcon(false);

    switch (type) {
        case 'success':
            setTimeout(() => setShowSuccessIcon(true), 0);
            break;
        case 'info':
            setTimeout(() => setShowInfoIcon(true), 0);
            break;
        case 'warning':
            setTimeout(() => setShowWarningIcon(true), 0);
            break;
        case 'error':
            setTimeout(() => setShowErrorIcon(true), 0);
            break;
    }
}

const getFittingColour = (type: 'success' | 'info' | 'warning' | 'error') => {
    switch (type) {
        case 'success':
            return 'bg-green-500';
        case 'info':
            return 'bg-blue-500';
        case 'warning':
            return 'bg-yellow-500';
        case 'error':
            return 'bg-red-500';
    }
}

const NotificationsComponent = () => {
    // States
    const [ongoingMarkAllAsRead, setOngoingMarkAllAsRead] = useState(false);
    const [ongoingMarkAsRead, setOngoingMarkAsRead] = useState<string[]>([]);

    // Zustand
    const { visible, hide } = useNotificationStore();

    // SWR
    const { data: notifications, mutate } = useSWR(visible ? { url: 'notifications' } : null, Fetcher);

    // Functions
    const markAsRead = async (id) => {
        if (ongoingMarkAsRead.includes(id)) return;
        setOngoingMarkAsRead([...ongoingMarkAsRead, id]);
        try {
            await axiosInstance.post(`/notifications/${id}/read`);
            mutate();
        }
        finally {
            setOngoingMarkAsRead(ongoingMarkAsRead.filter((item) => item !== id));
        }
    };

    const markAllAsRead = async () => {
        if (ongoingMarkAllAsRead) return;
        setOngoingMarkAllAsRead(true);
        try {
            await axiosInstance.post(`/notifications/read-all`);
            mutate();
        }
        finally {
            setOngoingMarkAllAsRead(false);
        }
    };

    // Render
    return (
        <div
            className={classNames(
                'absolute top-0 right-0 bottom-0 left-0 z-50 flex justify-center items-center bg-gray-900 bg-opacity-50 transition-opacity duration-300',
                visible ? 'opacity-100 cursor-pointer' : 'opacity-0 pointer-events-none cursor-auto'
            )}
            onClick={(e) => { hide(); e.stopPropagation(); }}
        >
            {/* Notifications */}
            <div
                className="w-full bg-white rounded-md shadow-lg overflow-hidden z-20 p-2 flex flex-col max-w-full max-h-full m-12 cursor-default md:max-w-3xl lg:max-w-4xl h-80"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center px-4 py-2 text-sm text-gray-700 border-b border-gray-200">
                    <span className="font-medium">Notifications</span>
                    <div
                        className='flex flex-row items-center'
                    >
                        <button
                            onClick={markAllAsRead}
                            className="text-sm text-blue-500 hover:text-blue-600 disabled:opacity-50"
                            disabled={notifications?.length === 0 || ongoingMarkAllAsRead}
                        >
                            Mark all as read
                        </button>
                        <button
                            onClick={hide}
                            className="text-sm text-gray-500 hover:text-gray-600 ml-4"
                        >
                            <MdClose className="h-6 w-6" />
                        </button>
                    </div>
                </div>
                <div className="max-h-96 overflow-y-auto">
                    {(notifications?.length ?? 0) === 0 && (
                        <div className="flex items-center justify-center h-32 text-gray-500">
                            No notifications
                        </div>
                    )}
                    {notifications?.map((notification) => (
                        <div
                            key={notification.id}
                            className={classNames(
                                "flex flex-col items-center px-4 py-3 border-b border-gray-200 hover:bg-gray-50 cursor-pointer",
                                notification.read ? 'bg-gray-100' : 'hover:bg-gray-100',
                            )}
                            onClick={() => markAsRead(notification.id)}
                        >
                            <div
                                className='flex flex-row justify-between w-full items-center'
                            >
                                <div className="flex-shrink-0 text-center">
                                    {notification.type === 'success' && <FaCheck className="h-6 w-6 text-green-500" />}
                                    {notification.type === 'info' && <FaInfo className="h-6 w-6 text-blue-500" />}
                                    {notification.type === 'warning' && <FaExclamation className="h-6 w-6 text-yellow-500" />}
                                    {notification.type === 'error' && <FaTimes className="h-6 w-6 text-red-500" />}
                                </div>
                                <div className="ml-3 w-0 flex-1">
                                    <p className={classNames(
                                        "text-base font-semibold",
                                        notification.read ? 'text-gray-500' : 'text-gray-900',
                                    )}>
                                        {notification.title}
                                    </p>
                                    <p className="text-sm text-gray-500">{notification.body}</p>
                                </div>
                            </div>
                            {notification.message && (
                                <div className="flex items-center justify-between w-full mt-2">
                                    <span className="text-sm">{notification.message}</span>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const NotificationsIcon = () => {
    const { data: notifications, mutate } = useSWR({ url: 'notifications' }, Fetcher);
    const { show, showSuccessIcon, showInfoIcon, showWarningIcon, showErrorIcon } = useNotificationStore();

    return (
        <div
            className="relative"
        >
            {/* Notifications icon */}
            <MdNotifications
                className={classNames(
                    "h-8 w-8 cursor-pointer",
                    // Colorize the icon if there are unread notifications
                    notifications?.filter((notification) => !notification.read).length ? getWorstUnreadColor(notifications) : 'text-gray-400',
                    // Add shake animation if there are unread notifications
                    notifications?.filter((notification) => !notification.read).length ? 'shake' : ''
                )}
                onClick={show}
            />

            {showSuccessIcon && (
                <div
                    className="absolute left-0 top-0 bottom-0 right-0 move-from-center-to-left h-8 w-8 bg-green-500 text-white flex justify-center items-center rounded-full"
                >
                    <FaCheck className="h-6 w-6" />
                </div>
            )}
            {showInfoIcon && (
                <div
                    className="absolute left-0 top-0 bottom-0 right-0 move-from-center-to-left h-8 w-8 bg-blue-500 text-white flex justify-center items-center rounded-full"
                >
                    <FaQuestion className="h-6 w-6" />
                </div>
            )}
            {showWarningIcon && (
                <div
                    className="absolute left-0 top-0 bottom-0 right-0 move-from-center-to-left h-8 w-8 bg-yellow-500 text-white flex justify-center items-center rounded-full"
                >
                    <FaExclamation className="h-6 w-6" />
                </div>
            )}
            {showErrorIcon && (
                <div
                    className="absolute left-0 top-0 bottom-0 right-0 move-from-center-to-left h-8 w-8 bg-red-500 text-white flex justify-center items-center rounded-full"
                >
                    <FaTimes className="h-6 w-6" />
                </div>
            )}
        </div>
    );
};

export default NotificationsComponent;
export { useNotificationStore, NotificationsComponent, NotificationsIcon, iconEffect };
export type { useNotificationStoreType };