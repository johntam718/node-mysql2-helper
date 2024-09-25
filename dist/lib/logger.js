"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chalk_1 = __importDefault(require("chalk"));
const loglevel_1 = __importDefault(require("loglevel"));
loglevel_1.default.setLevel('trace');
// Custom function to format the date and time
function formatTimestamp(date) {
    const pad = (num) => num.toString().padStart(2, '0');
    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    const seconds = pad(date.getSeconds());
    const timezoneOffset = -date.getTimezoneOffset();
    const sign = timezoneOffset >= 0 ? '+' : '-';
    const absOffset = Math.abs(timezoneOffset);
    const offsetHours = pad(Math.floor(absOffset / 60));
    const offsetMinutes = pad(absOffset % 60);
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${sign}${offsetHours}:${offsetMinutes}`;
}
// Override the log methods to add colors and custom formatting
const originalFactory = loglevel_1.default.methodFactory;
loglevel_1.default.methodFactory = (methodName, logLevel, loggerName) => {
    const rawMethod = originalFactory(methodName, logLevel, loggerName);
    return (...args) => {
        // const timestamp = new Date().toISOString();
        const timestamp = formatTimestamp(new Date());
        const upperCaseMethodName = methodName.toUpperCase();
        let coloredMessage;
        switch (methodName) {
            case 'trace':
                coloredMessage = chalk_1.default.gray(`[${timestamp}] [${upperCaseMethodName}]`, ...args);
                break;
            case 'debug':
                coloredMessage = chalk_1.default.blue(`[${timestamp}] [${upperCaseMethodName}]`, ...args);
                break;
            case 'info':
                coloredMessage = chalk_1.default.green(`[${timestamp}] [${upperCaseMethodName}]`, ...args);
                break;
            case 'warn':
                coloredMessage = chalk_1.default.yellow(`[${timestamp}] [${upperCaseMethodName}]`, ...args);
                break;
            case 'error':
                coloredMessage = chalk_1.default.red(`[${timestamp}] [${upperCaseMethodName}]`, ...args);
                break;
            default:
                coloredMessage = `[${timestamp}] [${upperCaseMethodName}] ${args.join(' ')}`;
                break;
        }
        rawMethod(coloredMessage);
    };
};
// Apply the method factory
loglevel_1.default.rebuild();
exports.default = loglevel_1.default;
