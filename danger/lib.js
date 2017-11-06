// @flow

import {readFileSync} from 'fs'

export const readFile = (filename: string) => {
  try {
    return readFileSync(filename, 'utf-8')
  } catch (err) {
    if (err.code === 'ENOENT') {
      return ''
    }
    return err.message
  }
}

export const readLogFile = (filename: string) => readFile(filename).trim()

export const isBadDataValidationLog = (log: string) => {
  // if any lines don't end with "is valid"
  return log.split('\n').some(l => !l.endsWith('is valid'))
}

export const logDetailsEl = (name: string, log: string, args?: {lang?: string} = {}) => {
  danger.message(`
<details>
  <summary>${name}</summary>

\`\`\`${args.lang || ''}
${log}
\`\`\`

</details>`,
  )
}
