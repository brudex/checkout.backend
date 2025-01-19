const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');

const logger = winston.createLogger({
    level: 'info',
    transports: [
        new winston.transports.Console({
            colorize: true,
            'timestamp':true
        }),
        new DailyRotateFile({
            name:"file",
            filename: 'log-%DATE%.log',
            dirname: __dirname + "/" + "logs",
            datePattern: 'yyyy-MM-DD',
            maxSize:'50m'
        }),
        new DailyRotateFile({
            name:"file",
            level: 'error',
            filename: 'errlog-%DATE%.log',
            dirname: __dirname + "/" + "logs",
            datePattern: 'yyyy-MM-DD',
            maxSize:'50m'
        })
    ]
});

module.exports= logger;