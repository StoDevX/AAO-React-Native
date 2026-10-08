#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'
import {load as loadYaml} from 'js-yaml'
import {isDataEntry} from './data-entries.mjs'
import {parseArgs} from 'node:util'
import {validate} from './validate.mjs'
import {SCHEMA_BASE, DATA_BASE} from './paths.mjs'
import {loadScheduleData} from './schedule-data.ts'

const isDir = (pth) => tryBoolean(() => fs.statSync(pth).isDirectory())
const readYaml = (pth) =>
	JSON.parse(JSON.stringify(loadYaml(fs.readFileSync(pth, 'utf-8'), {filename: pth})))

const readDir = (pth) => fs.readdirSync(pth).filter(isDataEntry)

/// MARK: program

// get cli arguments
const args = getArgs(process.argv.slice(2))

const scheduleSchemas = new Set(['breaks', 'building-hours'])

// Scheduling inputs share one preparation path with publication.
let iterator
if (args.data) {
	let schemaFile = readYaml(args.schema)
	let kind =
		schemaFile.$id === 'building-hours.json'
			? 'space'
			: schemaFile.$id === 'breaks.json'
				? 'calendar'
				: undefined
	if (kind !== undefined) {
		loadScheduleData(DATA_BASE, {kind, filename: args.data})
		args.quiet || console.log(args.data + ' is valid')
		iterator = []
	} else {
		iterator = [[[args.schema, schemaFile, readYaml(args.data)]]]
	}
} else {
	if (args.schemaNames.some((name) => scheduleSchemas.has(name))) {
		let schedules = loadScheduleData(DATA_BASE)
		if (!args.quiet) {
			if (args.schemaNames.includes('breaks')) console.log('breaks.yaml is valid')
			if (args.schemaNames.includes('building-hours')) {
				for (let {label} of schedules.spaces) {
					console.log(path.relative(DATA_BASE, label) + ' is valid')
				}
			}
		}
	}
	iterator = args.schemaNames.filter((name) => !scheduleSchemas.has(name)).map((name) => load(name))
}

// iterate!
for (const multitudes of iterator) {
	for (const [filename, schema, data] of multitudes) {
		let [result, errors] = validate(schema, data)
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

function getArgs(argv) {
	let allSchemas = readDir(SCHEMA_BASE).map((f) => f.replace('.yaml', ''))

	let values, positionals
	try {
		;({values, positionals} = parseArgs({
			args: argv,
			options: {
				help: {type: 'boolean'},
				bail: {type: 'boolean', default: true},
				'no-bail': {type: 'boolean'},
				quiet: {type: 'boolean'},
				data: {type: 'string', short: 'd'},
				schema: {type: 'string', short: 's'},
			},
			allowPositionals: true,
			strict: true,
		}))
	} catch (err) {
		console.error('Usage: node validate-compiled-data.js [options] [args]')
		console.error(err.message)
		process.exit(1)
	}

	let bail = values['no-bail'] ? false : (values.bail ?? true)
	let args = {...values, bail, _: positionals}

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
	if (args._.length === 0) {
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
		if (err.code === 'ENOENT') {
			console.error(`Could not find "${schemaName}.yaml" in ${SCHEMA_BASE}`)
			process.exit(1)
		}
	}

	let dirPath = path.join(DATA_BASE, schemaName)
	// check if we need to go over the contents of a folder
	if (isDir(dirPath)) {
		for (let file of readDir(dirPath)) {
			// yield each file in the folder
			let data = readYaml(path.join(dirPath, file))
			yield [schemaName + '/' + file, schema, data]
		}
	} else {
		// or just yield the single file
		let data = readYaml(dirPath + '.yaml')
		yield [schemaName + '.yaml', schema, data]
	}
}

function tryBoolean(cb) {
	// try a function; return a boolean version of success
	try {
		return Boolean(cb())
	} catch (_err) {
		return false
	}
}
