import fs from 'fs';
import path from 'path';
import 'dotenv/config';

enum LogLevels {
    TRACE = 1,
    DEBUG = 2,
    INFO = 3,
    WARN = 4,
    ERROR = 5,
    FATAL = 6,
}
const serverLogLevel: number = parseInt(process.env.LOGLEVEL_SERVER || String(LogLevels.INFO));
const clientLogLevel: number = parseInt(process.env.LOGLEVEL_CLIENT || String(LogLevels.INFO));
const logToConsole: boolean = process.env.LOGGING_PRINT_TO_CONSOLE === 'true';

function writeLogEntry (
    message: string,
    level: number = LogLevels.INFO,
    fileName: string = '',
    logFile: string = 'logs/radio-server.log',
    context: any = null
): void {
    const isClient = (logFile !== '' && logFile.indexOf('client') >= 0) ? true : false;
    //console.log('serverLogLevel', serverLogLevel, level, isClient, message);
    if ((isClient && level <= clientLogLevel) && (!isClient && level  <= serverLogLevel)) {
        return;
    }

    let processedContext: any;
    if (context instanceof Error) {
        processedContext = {
            name: context.name,
            message: context.message,
            stack: context.stack
        };
    } else if (typeof context === 'object' && context !== null) {
        // For non-Error objects, create a shallow copy to avoid modifying the original
        processedContext = Array.isArray(context) ? [...context] : { ...context };
    } else {
        // For primitives or null/undefined, use as is
        processedContext = context;
    }
    const timestamp = new Date().toISOString();

    // log to console, too?
    if (logToConsole) {
        if (serverLogLevel >= LogLevels.ERROR) {
            console.error(message, context);
        } else {
            console.log(message, context);
        }
    }

    const logEntry = { timestamp, level, fileName, message, context: processedContext };
    const logDir = path.dirname(logFile);

    if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
    }

    fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');
}

function writeFatal (message: string, context: any = undefined): void {
    writeLogEntry(message, LogLevels.FATAL, '', 'logs/radio-server-error.log', context);
}
function writeError (message: string, context: any = undefined): void {
    writeLogEntry(message, LogLevels.ERROR, '', 'logs/radio-server-error.log', context);
}
function writeInfo (message: string, context: any = undefined): void {
    writeLogEntry(message, LogLevels.INFO, '', 'logs/radio-server-info.log', context);
}
function writeDebug (message: string, context: any  = undefined): void {
    writeLogEntry(message, LogLevels.DEBUG, '', 'logs/radio-server-info.log', context);
}
function writeTrace (message: string, context: any = undefined): void {
    writeLogEntry(message, LogLevels.TRACE, '', 'logs/radio-server-info.log', context);
}
function writeWarn (message: string, context: any = undefined): void {
    writeLogEntry(message, LogLevels.WARN, '', 'logs/radio-server-info.log', context);
}

const logger = {
    LogLevels,
    writeLogEntry,
    writeFatal,
    writeError,
    writeInfo,
    writeDebug,
    writeTrace,
    writeWarn
};
export default logger;