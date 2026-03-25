import log from 'loglevel';

const level = process.env.NEXT_PUBLIC_LOG_LEVEL as log.LogLevelDesc | undefined;
log.setLevel(level ?? (process.env.NODE_ENV === 'production' ? 'warn' : 'debug'));

export const logger = log;
