// @flow

import fs from 'fs'
import path from 'path'
import AJV from 'ajv'
import yaml from 'js-yaml'
import get from 'lodash/get'
import memoize from 'lodash/memoize'
import {SCHEMA_BASE} from './paths.mjs'

function formatError(err, data) {
  // format some of the errors from ajv
  let contents = ''
  const dataPath = err.dataPath.replace(/^\./, '')
  switch (err.keyword) {
    case 'enum': {
      const value = get(data, dataPath)
      const allowed = err.params.allowedValues.join(', ')
      contents = `Given value "${value}" ${err.message} [${allowed}]`
      break
    }
    case 'type': {
      contents = `${get(data, dataPath)} ${err.message}`
      break
    }
    default: {
      contents = JSON.stringify(err, null, 2)
    }
  }

  return new Error(`Error at ${err.dataPath}:\n${contents}`)
}

const init = memoize(() => {
  // load the common definitions
  const defsPath = path.join(SCHEMA_BASE, '_defs.yaml')
  const defs = yaml.safeLoad(fs.readFileSync(defsPath, 'utf-8'))

  // set up the validator
  const validator = new AJV()
  validator.addSchema(defs)

  return validator
})

export function validate(
  schema /*: Object */,
  data /*: Object */,
) /*: true | Array<Error>*/ {
  const validator = init()

  const validate = validator.compile(schema)
  const isValid = validate(data)

  if (!isValid) {
    return validate.errors.map(e => formatError(e, data))
  }

  return true
}
