#!/usr/bin/env node
const AJV = require('ajv')
const fs = require('fs')
const path = require('path')
const get = require('lodash/get')
const yaml = require('js-yaml')
const junk = require('junk')
const minimist = require('minimist')

const SCHEMA_BASE = path.join(__dirname, '..', 'data', '_schemas')
const DATA_BASE = path.join(__dirname, '..', 'data')

const isDir = pth => tryBoolean(() => fs.statSync(pth).isDirectory())
const readYaml = pth => JSON.parse(JSON.stringify(yaml.safeLoad(fs.readFileSync(pth, 'utf-8'), {filename: p})))
const readDir = pth => fs.readdirSync(pth).filter(junk.not).filter(entry => !entry.startsWith('_'))

/// MARK: program

// set up the validator
const validator = new AJV()
// load the common definitions
const defs = readYaml(path.join(SCHEMA_BASE, '_defs.yaml'))
validator.addSchema(defs)

// get cli arguments
const args = parseArgs(process.argv.slice(2))

// allow either --data/--schema or automatic schema loading
let iterator
if (args.data) {
  const dataFile = readYaml(args.data)
  const schemaFile = readYaml(args.schema)
  iterator = [[[args.schema, schemaFile, dataFile]]]
} else {
  iterator = args.schemaNames.map(schemaName => load(schemaName))
}

// iterate!
for (const multitudes of iterator) {
  for (const [filename, schema, data] of multitudes) {
    const validate = validator.compile(schema)
    const isValid = validate(data)
    if (!isValid) {
      console.log(`${filename} is invalid`)
      console.log(validate.errors.map(e => formatError(e, data)).join('\n'))
      if (args.bail) {
        process.exit(1)
      }
      break
    }
    console.log(`${filename} is valid`)
  }
}

/// MARK: helpers

function parseArgs(argv) {
  const allSchemas = readDir(SCHEMA_BASE).map(f => f.replace('.yaml', ''))
  const args = minimist(argv, {
    boolean: ['help', 'bail'],
    string: ['data', 'schema'],
    alias: {d: 'data', s: 'schema'},
    default: {
      bail: true,
    },
    unknown(arg) {
      if (!arg.startsWith('-')) {
        return
      }
      console.error('Usage: node validate-compiled-data.js [options] [args]')
      console.error(`Unknown option "${arg}"`)
      process.exit(1)
    },
  })

  if (args.help) {
    console.error('Usage: node validate-compiled-data.js [options] [args]')
    console.error()
    console.error('Arguments:')
    console.error('  <blank>: validates all schemas and data')
    console.error('  [schema-name]+: validates the schema and data for the given schema')
    console.error()
    console.error('Options:')
    console.error('  --no-bail: continue past the first error')
    console.error('  -d, --data: use this as the data file (requires --schema)')
    console.error('  -s, --schema: use this as the schema (requires --data)')
    console.error()
    console.error(`By default, the program looks for schema files in ${SCHEMA_BASE}`)
    process.exit(1)
  }

  if ((args.data && !args.schema) || (args.schema && !args.data)) {
    console.error('Usage: node validate-compiled-data.js [options] [args]')
    console.error('If either --data or --schema are provided, both are required')
    process.exit(1)
  }

  // if you don't provide any files, it defaults to all schemas
  if (!args._.length) {
    args._ = allSchemas
  }

  args.schemaNames = args._

  return args
}

function* load(schemaName) {
  // grab the schema
  let schema
  try {
    schema = readYaml(path.join(SCHEMA_BASE, schemaName + '.yaml'))
  } catch (err) {
    console.error(`Could not find "${schemaName}.yaml" in ${SCHEMA_BASE}`)
    process.exit(1)
  }

  const dirPath = path.join(DATA_BASE, schemaName)
  // check if we need to go over the contents of a folder
  if (isDir(dirPath)) {
    for (let file of readDir(dirPath)) {
      // yield each file in the folder
      const data = readYaml(path.join(dirPath, file))
      yield [schemaName + '/' + file, schema, data]
    }
  } else {
    // or just yield the single file
    const data = readYaml(dirPath + '.yaml')
    yield [schemaName + '.yaml', schema, data]
  }
}

function tryBoolean(cb) {
  // try a function; return a boolean version of success
  try {
    return Boolean(cb())
  } catch (err) {
    return false
  }
}

function formatError(err, data) {
  // format some of the errors from ajv
  let contents = ''
  const dataPath = err.dataPath.replace(/^\./, '')
  switch (err.keyword) {
    case 'enum': {
      contents = `Given value "${get(data, dataPath)}" ${err.message} [${err.params.allowedValues.join(', ')}]`
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
  return [
    `Error at ${err.dataPath}:`,
    contents,
  ].join('\n')
}
