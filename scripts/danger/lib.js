// @flow

import {fail, markdown} from 'danger'

// it leaves the rest of the imports alone, though
import fs from 'fs'
import childProcess from 'child_process'
import stripAnsi from 'strip-ansi'
import directoryTree from 'directory-tree'
import xcode from 'xcode'
import util from 'util'

const execFile = util.promisify(childProcess.execFile)

const {XmlEntities} = require('html-entities')
export const entities = new XmlEntities()

export function fastlaneBuildLogTail(
  log /*: Array<string>*/,
  message /*: string*/,
) {
  const n = 150
  const logToPost = log
    .slice(-n)
    .map(stripAnsi)
    .join('\n')

  fail(
    h.details(
      h.summary(message),
      h.p(`Last ${n} lines`),
      m.code({}, logToPost),
    ),
  )
}

export const h /*: any*/ = new Proxy(
  {},
  {
    get(_, property) {
      return function(...children /*: Array<string>*/) {
        if (!children.length) {
          return `<${property}>`
        }
        return `<${property}>${children.join('\n')}</${property}>`
      }
    },
  },
)

export const m = {
  code(attrs /*: Object*/, ...children /*: Array<string>*/) {
    return (
      '\n' +
      '```' +
      (attrs.language || '') +
      '\n' +
      children.join('\n') +
      '\n' +
      '```' +
      '\n'
    )
  },
  json(blob /*: any*/) {
    return m.code({language: 'json'}, JSON.stringify(blob, null, 2))
  },
}

export function readFile(filename /*: string*/) {
  try {
    return fs.readFileSync(filename, 'utf-8')
  } catch (err) {
    fail(
      h.details(
        h.summary(`Could not read <code>${filename}</code>`),
        m.json(err),
      ),
    )
    return ''
  }
}

export function readLogFile(filename /*: string*/) {
  return readFile(filename).trim()
}

export function readJsonLogFile(filename /*: string*/) {
  try {
    return JSON.parse(readFile(filename))
  } catch (err) {
    fail(
      h.details(
        h.summary(`Could not read the log file at <code>${filename}</code>`),
        m.json(err),
      ),
    )
    return []
  }
}

export function isBadDataValidationLog(log /*: string*/) {
  return log.split('\n').some(l => !l.endsWith('is valid'))
}

export function fileLog(
  name /*: string*/,
  log /*: string*/,
  {lang = null} /*: any*/ = {},
) {
  return markdown(
    `## ${name}

${m.code({language: lang}, log)}`,
  )
}

export function parseXcodeProject(
  pbxprojPath /*: string*/,
) /*: Promise<Object>*/ {
  return new Promise((resolve, reject) => {
    const project = xcode.project(pbxprojPath)
    // I think this can be called twice from .parse, which is an error for a Promise
    let resolved = false
    project.parse((error, data) => {
      if (resolved) {
        return
      }
      resolved = true

      if (error) {
        reject(error)
      }
      resolve(data)
    })
  })
}

export async function listZip(filepath /*: string*/) {
  try {
    const {stdout} = await execFile('unzip', ['-l', filepath])
    const lines = stdout.split('\n')

    const parsed = lines.slice(3, -3).map(line => {
      const length = parseInt(line.slice(0, 9).trim(), 10)
      // const datetime = line.slice(12, 28)
      const filepath = line.slice(30).trim()
      const type = filepath.endsWith('/') ? 'folder' : 'file'
      return {size: length, filepath, type}
    })
    const zipSize = parsed.reduce((sum, current) => current.size + sum, 0)

    return {files: parsed, size: zipSize}
  } catch (err) {
    fail(
      h.details(
        h.summary(`Could not examine the ZIP file at <code>${filepath}</code>`),
        m.json(err),
      ),
    )
  }
}

export function listDirectory(dirpath /*: string*/) {
  try {
    return fs.readdirSync(dirpath)
  } catch (err) {
    fail(h.details(h.summary(`${h.code(dirpath)} does not exist`), m.json(err)))
    return []
  }
}

export function listDirectoryTree(dirpath /*: string*/) /*: any*/ {
  try {
    const exists = fs.accessSync(dirpath, fs.F_OK)

    if (!exists) {
      fail(
        h.details(
          h.summary(`Could not access <code>${dirpath}</code>`),
          m.code({}, listDirectory(dirpath).join('\n')),
        ),
      )
    }

    return directoryTree(dirpath)
  } catch (err) {
    fail(
      h.details(
        h.summary('<code>listDirectoryTree</code> threw an error'),
        m.json(err),
      ),
    )
    return {}
  }
}
