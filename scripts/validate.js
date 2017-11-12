#!/usr/bin/env node
const fs = require('fs')
const path = require('path')
const AJV = require('ajv')
const yaml = require('js-yaml')
const get = require('lodash/get')
const memoize = require('lodash/memoize')
const {SCHEMA_BASE} = require('./paths')

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
      return JSON.stringify(err, null, 2)
    }
  }
  return `Error at ${err.dataPath}:\n${contents}`
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

module.exports = function validate(schema, data) {
  const validator = init()

  const validate = validator.compile(schema)
  const isValid = validate(data)

  if (!isValid) {
    return [false, validate.errors.map(e => formatError(e, data))]
  }

  return [true, []]
}
