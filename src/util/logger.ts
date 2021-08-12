import { blue, cyan, red, yellow, bgRed, gray } from "https://deno.land/std@0.104.0/fmt/colors.ts";

export enum LogLevel {
    Info,
    Debug,
    Warn,
    Error,
    Fatal,
}

const prefixOf = (level: LogLevel) => LogLevel[level].toUpperCase();

/* formatters */
// const colorlessFormatter: Formatter = (str: string) => str;
const coloredFormatters: Formatters = {
    [LogLevel.Info]: cyan,
    [LogLevel.Debug]: blue,
    [LogLevel.Warn]: yellow,
    [LogLevel.Error]: red,
    [LogLevel.Fatal]: msg => yellow(bgRed(msg))
}

type Formatter = (str: string) => string;
type Formatters = Record<LogLevel, Formatter>

/* logger */
export interface Logger {
    info: (...msg: any[]) => void;
    debug: (...msg: any[]) => void;
    error: (...msg: any[]) => void;
    fatal: (...msg: any[]) => void;
    warn: (...msg: any[]) => void;
}

export function getLogger(name: string, level: LogLevel = LogLevel.Info): Logger {
    function write(logLevel: LogLevel, str: string) {
        /* check if `logLevel` is alllowed. */
        if (level < logLevel) {
            return;
        }

        const timestamp = new Date();
        const message = `${gray(`${timestamp.toLocaleDateString()} ${timestamp.toLocaleTimeString()}`)} ${coloredFormatters[logLevel](prefixOf(logLevel).padEnd(5, ' '))} ${name}: ${str}`;
        switch (logLevel) {
            case LogLevel.Debug: return console.debug(message);
            case LogLevel.Info: return console.info(message);
            case LogLevel.Warn: return console.warn(message);
            case LogLevel.Error: return console.error(message);
            case LogLevel.Fatal: return console.error(message);
        }
    }

    return Object.assign({}, ...[LogLevel.Debug, LogLevel.Error, LogLevel.Fatal, LogLevel.Info, LogLevel.Warn]
        .map(m => ({ [LogLevel[m].toLowerCase()]: (...msg: any[]) => write(m, msg.join(" ")) })))
}
