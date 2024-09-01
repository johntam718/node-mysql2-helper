import chalk from 'chalk';
import logger from 'loglevel';

logger.setLevel('trace');


// Custom function to format the date and time
function formatTimestamp(date: Date): string {
  const pad = (num: number) => num.toString().padStart(2, '0');

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
const originalFactory = logger.methodFactory;
logger.methodFactory = (methodName, logLevel, loggerName) => {
  const rawMethod = originalFactory(methodName, logLevel, loggerName);
  return (...args) => {
    // const timestamp = new Date().toISOString();
    const timestamp = formatTimestamp(new Date());
    const upperCaseMethodName = methodName.toUpperCase();
    let coloredMessage;

    switch (methodName) {
      case 'trace':
        coloredMessage = chalk.gray(`[${timestamp}] [${upperCaseMethodName}]`, ...args);
        break;
      case 'debug':
        coloredMessage = chalk.blue(`[${timestamp}] [${upperCaseMethodName}]`, ...args);
        break;
      case 'info':
        coloredMessage = chalk.green(`[${timestamp}] [${upperCaseMethodName}]`, ...args);
        break;
      case 'warn':
        coloredMessage = chalk.yellow(`[${timestamp}] [${upperCaseMethodName}]`, ...args);
        break;
      case 'error':
        coloredMessage = chalk.red(`[${timestamp}] [${upperCaseMethodName}]`, ...args);
        break;
      default:
        coloredMessage = `[${timestamp}] [${upperCaseMethodName}] ${args.join(' ')}`;
        break;
    }

    rawMethod(coloredMessage);
  };
};

// Apply the method factory
logger.rebuild();

export default logger;