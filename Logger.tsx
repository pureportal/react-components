import classNames from "classnames";
import { useEffect, useState } from "react";
import { FaBug, FaCheck, FaInfo, FaTimes } from "react-icons/fa";
import { GiLogging } from "react-icons/gi";
import { v4 as uuidv4 } from "uuid";
import { create } from "zustand";
import moment from "moment";

interface logsType {
    key: string;
    id: string;
    level: string;
    message: any;
    timestamp: Date;
}
interface useLoggerStoreType {
    logs: logsType[];
    visible: boolean;
    hide: () => void;
    show: () => void;
    addLog: (level: any, ...args: any) => void;
    clearLogs: () => void;
}
const useLoggerStore = create<useLoggerStoreType>((set) => ({
    logs: [],
    visible: false,
    hide: () => { set({ visible: false }) },
    show: () => { set({ visible: true }) },
    addLog: (id: string, level: string, ...args: any) => {
        const key = uuidv4();
        set((state) => {
            let logs = [...state.logs, { key, id, level, message: args, timestamp: new Date() }].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
            // Keep only the last 100 logs
            if (logs.length > 100) logs = logs.slice(logs.length - 100);
            return { logs };
        });
    },
    clearLogs: () => set({ logs: [] }),
}));

const logger = {
    debug: (id: string, ...args: any) => {
        console.log('debug', id, args);
        useLoggerStore.getState().addLog(id, 'debug', ...args);
    },
    info: (id: string, ...args: any) => {
        console.log('info', id, args);
        useLoggerStore.getState().addLog(id, 'info', ...args); 
    },
    warn: (id: string, ...args: any) => {
        console.warn('warn', id, args);
        useLoggerStore.getState().addLog(id, 'warn', ...args);
    },
    error: (id: string, ...args: any) => {
        console.error('error', id, args);
        useLoggerStore.getState().addLog(id, 'error', ...args);
    },
    success: (id: string, ...args: any) => {
        console.log('success', id, args);
        useLoggerStore.getState().addLog(id, 'success', ...args);
    },
    clear: () => useLoggerStore.getState().clearLogs(),
    export: () => {
        const logs = useLoggerStore.getState().logs;
        const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'logs.json';
        a.click();
        URL.revokeObjectURL(url);
    },
};

const LogsComponent = () => {
    // Zustand
    const { logs, visible, hide } = useLoggerStore();

    // State
    const [debugVisible, setDebugVisible] = useState(false);
    const [infoVisible, setInfoVisible] = useState(true);
    const [warnVisible, setWarnVisible] = useState(true);
    const [errorVisible, setErrorVisible] = useState(true);
    const [successVisible, setSuccessVisible] = useState(true);

    const [filteredLogs, setFilteredLogs] = useState<logsType[] | null>(null);

    // useEffect
    useEffect(() => {
        if (!visible) return;
        setFilteredLogs(logs.filter((log) => {
            if (log.level === 'debug' && !debugVisible) return false;
            if (log.level === 'info' && !infoVisible) return false;
            if (log.level === 'warn' && !warnVisible) return false;
            if (log.level === 'error' && !errorVisible) return false;
            if (log.level === 'success' && !successVisible) return false;
            return true;
        }).reverse());
    }, [visible, logs, debugVisible, infoVisible, warnVisible, errorVisible, successVisible]);

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
                <div className="flex justify-between items-center px-4 py-2 text-sm text-gray-700">
                    <span className="font-medium">Logs</span>
                    <div className='flex-grow' />
                    <div
                        className="hidden flex-row items-center sm:flex"
                    >
                        <button
                            onClick={() => { setDebugVisible(!debugVisible) }}
                            className={classNames(
                                'text-sm mr-2',
                                debugVisible ? 'text-gray-700' : 'text-gray-300',
                                'hover:text-gray-600'
                            )}
                        >
                            Debug
                        </button>
                        <button
                            onClick={() => { setSuccessVisible(!successVisible) }}
                            className={classNames(
                                'text-sm mr-2',
                                successVisible ? 'text-green-700' : 'text-green-300',
                                'hover:text-gray-600'
                            )}
                        >
                            Success
                        </button>
                        <button
                            onClick={() => { setInfoVisible(!infoVisible) }}
                            className={classNames(
                                'text-sm mr-2',
                                infoVisible ? 'text-blue-700' : 'text-blue-300',
                                'hover:text-gray-600'
                            )}
                        >
                            Info
                        </button>
                        <button
                            onClick={() => { setWarnVisible(!warnVisible) }}
                            className={classNames(
                                'text-sm mr-2',
                                warnVisible ? 'text-yellow-700' : 'text-yellow-300',
                                'hover:text-gray-600'
                            )}
                        >
                            Warn
                        </button>
                        <button
                            onClick={() => { setErrorVisible(!errorVisible) }}
                            className={classNames(
                                'text-sm mr-2',
                                errorVisible ? 'text-red-700' : 'text-red-300',
                                'hover:text-gray-600'
                            )}
                        >
                            Error
                        </button>
                    </div>
                    <button
                        onClick={() => logger.clear()}
                        className="text-sm text-primary-500 hover:text-primary-600 ml-6"
                    >
                        Clear
                    </button>
                    <button
                        onClick={() => logger.export()}
                        className="text-sm text-primary-500 hover:text-primary-600 ml-2"
                    >
                        Export
                    </button>
                    <button
                        onClick={hide}
                        className="text-sm text-gray-500 hover:text-gray-600 ml-2"
                    >
                        <FaTimes className="h-6 w-6" />
                    </button>
                </div>
                <div
                    className="flex sm:hidden flex-row items-center justify-center px-4 py-2"
                >
                    <button
                        onClick={() => { setDebugVisible(!debugVisible) }}
                        className={classNames(
                            'text-sm mr-2',
                            debugVisible ? 'text-gray-700' : 'text-gray-300',
                            'hover:text-gray-600'
                        )}
                    >
                        Debug
                    </button>
                    <button
                        onClick={() => { setSuccessVisible(!successVisible) }}
                        className={classNames(
                            'text-sm mr-2',
                            successVisible ? 'text-green-700' : 'text-green-300',
                            'hover:text-gray-600'
                        )}
                    >
                        Success
                    </button>
                    <button
                        onClick={() => { setInfoVisible(!infoVisible) }}
                        className={classNames(
                            'text-sm mr-2',
                            infoVisible ? 'text-blue-700' : 'text-blue-300',
                            'hover:text-gray-600'
                        )}
                    >
                        Info
                    </button>
                    <button
                        onClick={() => { setWarnVisible(!warnVisible) }}
                        className={classNames(
                            'text-sm mr-2',
                            warnVisible ? 'text-yellow-700' : 'text-yellow-300',
                            'hover:text-gray-600'
                        )}
                    >
                        Warn
                    </button>
                    <button
                        onClick={() => { setErrorVisible(!errorVisible) }}
                        className={classNames(
                            'text-sm mr-2',
                            errorVisible ? 'text-red-700' : 'text-red-300',
                            'hover:text-gray-600'
                        )}
                    >
                        Error
                    </button>
                </div>
                <div className="border-b border-gray-200" />
                <div className="h-full overflow-y-auto">
                    {(filteredLogs?.length ?? 0) === 0 && (
                        <div className="flex items-center justify-center h-32 text-gray-500">
                            No logs
                        </div>
                    )}
                    {filteredLogs?.map((log, index) => (
                        <div
                            key={`${log.key}`}
                            className={classNames(
                                "flex flex-col lg:flex-row items-start px-4 py-3 border-b border-gray-200 hover:bg-gray-50",
                            )}
                        >
                            <div
                                className="flex flex-row"
                            >
                                {log.level === 'debug' && (
                                    <div className="flex-shrink-0">
                                        <FaBug className="h-4 w-4 text-gray-400" />
                                    </div>
                                )}
                                {log.level === 'success' && (
                                    <div className="flex-shrink-0">
                                        <FaCheck className="h-4 w-4 text-green-400" />
                                    </div>
                                )}
                                {log.level === 'info' && (
                                    <div className="flex-shrink-0">
                                        <FaInfo className="h-4 w-4 text-blue-400" />
                                    </div>
                                )}
                                {log.level === 'warn' && (
                                    <div className="flex-shrink-0">
                                        <GiLogging className="h-4 w-4 text-yellow-400" />
                                    </div>
                                )}
                                {log.level === 'error' && (
                                    <div className="flex-shrink-0">
                                        <GiLogging className="h-4 w-4 text-red-400" />
                                    </div>
                                )}
                                {log.timestamp && (
                                    <p className="text-sm font-medium ml-3">
                                        {moment(log.timestamp).format('HH:mm:ss')}
                                    </p>
                                )}
                            </div>
                            {log.message && (
                                <p className="text-sm font-medium mt-2 lg:mt-0 lg:ml-3">
                                    {(Array.isArray(log.message) ? log.message.map((m) => JSON.stringify(m)).join(' ') : JSON.stringify(log.message)).replace(/^"|"$/g, '')}
                                </p>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default logger;
export { useLoggerStore, LogsComponent };
export type { useLoggerStoreType, logsType };