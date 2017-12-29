import {fileLog, readLogFile} from '../logs.js'

const prettierLog = readLogFile('./logs/prettier')

if (prettierLog) {
  fileLog('Prettier made some changes', prettierLog, {lang: 'diff'})
}
