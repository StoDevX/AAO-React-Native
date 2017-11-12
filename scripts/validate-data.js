#!/usr/bin/env node
const fs = require('fs')
const path = require('path')
const yaml = require('js-yaml')
const junk = require('junk')
const minimist = require('minimist')
const validate = require('./validate')
const {SCHEMA_BASE, DATA_BASE} = require('./paths')

const isDir = pth => tryBoolean(() => fs.statSync(pth).isDirectory())
const readYaml = pth =>
  JSON.parse(
    JSON.stringify(
      yaml.safeLoad(fs.readFileSync(pth, 'utf-8'), {filename: pth}),
    ),
  )

const readDir = pth =>
  fs
    .readdirSync(pth)
    .filter(junk.not)
    .filter(entry => !entry.startsWith('_'))

/// MARK: program

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
    const [result, errors] = validate(schema, data)
    if (!result) {
      console.log(`${filename} is invalid`)
      console.log(errors.join('\n'))
      if (args.bail) {
        process.exit(1)
      }
      break
    }
    args.quiet || console.log(`${filename} is valid`)
  }
}

/// MARK: helpers

function parseArgs(argv) {
  const allSchemas = readDir(SCHEMA_BASE).map(f => f.replace('.yaml', ''))
  const args = minimist(argv, {
    boolean: ['help', 'bail', 'quiet'],
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
    console.error(
      '  [schema-name]+: validates the schema and data for the given schema',
    )
    console.error()
    console.error('Options:')
    console.error('  --no-bail: continue past the first error')
    console.error('  -d, --data: use this as the data file (requires --schema)')
    console.error('  -s, --schema: use this as the schema (requires --data)')
    console.error()
    console.error(
      `By default, the program looks for schema files in ${SCHEMA_BASE}`,
    )
    process.exit(1)
  }

  if ((args.data && !args.schema) || (args.schema && !args.data)) {
    console.error('Usage: node validate-compiled-data.js [options] [args]')
    console.error(
      'If either --data or --schema are provided, both are required',
    )
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
