const winston = require('winston');
const { combine, timestamp, label, printf } = winston.format;
// creates a new Winston Logger

const myFormat = printf(({ level, message, timestamp }) => {
    return `${timestamp} ${level}: ${message}`;
  });
const logger = new winston.createLogger({
  level: 'info',
  format: combine(
    timestamp(),
    myFormat,
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console()
  ],
  exitOnError: false
});
export default logger;
