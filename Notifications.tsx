import { useState } from 'react';
import { MdNotifications, MdClose } from 'react-icons/md';
import { Transition } from '@headlessui/react';
import { IonPopover } from '@ionic/react';
import classNames from 'classnames';
import axiosInstance, { Fetcher } from '@/helpers/shared/axios';
import useSWR from 'swr';
import { create } from 'zustand';

interface useNotificationStoreType {
    visible: boolean;
    hide: () => void;
    show: () => void;
}
const useNotificationStore = create<useNotificationStoreType>((set) => ({
    visible: false,
    hide: () => { set({ visible: false }) },
    show: () => { set({ visible: true }) },
}));

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
                'absolute top-0 right-0 bottom-0 left-0 z-10 flex justify-center items-center bg-gray-900 bg-opacity-50 transition-opacity duration-300',
                visible ? 'opacity-100 cursor-pointer' : 'opacity-0 pointer-events-none cursor-auto'
            )}
            onClick={(e) => { hide(); e.stopPropagation(); }}
        >
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
                                "flex flex-col items-center px-4 py-3 border-b border-gray-200 hover:bg-gray-50",
                                { "bg-primary-1 text-primary-1-text hover:bg-primary-1-hover": !notification.read }
                            )}
                        >
                            <div
                                className='flex flex-row justify-between w-full items-center cursor-pointer'
                                onClick={() => markAsRead(notification.id)}
                            >
                                <div className="flex-shrink-0">
                                    <MdNotifications className="h-6 w-6 text-gray-400" />
                                </div>
                                <div className="ml-3 w-0 flex-1">
                                    <p className="text-sm font-medium">
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

export default NotificationsComponent;
export { useNotificationStore, NotificationsComponent };
export type { useNotificationStoreType };