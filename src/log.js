/* eslint-disable no-console */
import { appendFileSync, readFileSync, writeFileSync } from 'fs';
import { join, resolve } from 'path';

const FILE_NAME = 'log.txt';
const PATH = resolve(__dirname, '..');
const FULL_PATH = join(PATH, FILE_NAME);

const LEVELS = {
  debug: 'DEBUG',
  verbose: 'VERBOSE',
  info: 'INFO',
  warning: 'WARNING',
  error: 'ERROR',
};

const getLevelHeader = (level) => `[${LEVELS[level]}]`;

const getMessage = (input1, input2) => {
  if (input1 && input2) {
    return `[${input1}] - ${input2}`;
  }

  return input1;
};

const getStoragedLog = () => {
  try {
    return readFileSync(FULL_PATH);
  } catch (_) {
    return null;
  }
};

const generateLog = (level) => (input1, input2) => {
  const storagedLog = getStoragedLog();
  const levelHeader = getLevelHeader(level);
  const message = getMessage(input1, input2);
  const formatedText = `\n${levelHeader} - ${message}`;
  const properFn = storagedLog ? appendFileSync : writeFileSync;
  const logger = console[level] || console.log;
  logger(formatedText);
  properFn(FULL_PATH, formatedText);
};

const log = Object.keys(LEVELS).reduce((acc, level) => {
  acc[level] = generateLog(level);
  return acc;
}, {});

export default log;
