#!/usr/bin/env node
import {load} from 'js-yaml'
import fs from 'node:fs'
import {isDataEntry} from './data-entries.mjs'
import {collecting, raise, yamlProblem} from './data-problems.mjs'
import path from 'node:path'

// run cli
// if (process.mainModule === module) {
// 	let args = process.argv.slice(2)
// 	let fromDir = args[0]
// 	let toFile = args[1] || '-'
// 	if (!fromDir || fromDir === '-h' || fromDir === '--help') {
// 		console.error('usage: node bundle-data-dir.js <from-dir> [to-file]')
// 		process.exit(1)
// 	}
// 	console.log(process.mainModule)
// 	bundleDataDir({fromDir, toFile})
// }

// exported module
// module.exports = bundleDataDir
/** The folder's yaml files as one JSON document, or nothing for an empty folder. Reports every file that does not parse. */
export function renderDataDir(fromDir) {
	let files = fs
		.readdirSync(fromDir)
		.filter(isDataEntry)
		.map((f) => path.join(fromDir, f))
	if (files.length === 0) {
		return
	}

	// sort the files so that 9 comes before 10
	files.sort(new Intl.Collator(undefined, {numeric: true}).compare)

	let problems = []
	let loaded = files.map((fpath) =>
		collecting(problems, () => {
			let contents = fs.readFileSync(fpath, 'utf-8')
			try {
				return load(contents)
			} catch (err) {
				// js-yaml reports a line and column but not which file they are in,
				// and this runs over several hundred of them.
				throw yamlProblem(fpath, err)
			}
		}),
	)
	raise(problems)
	return JSON.stringify({data: loaded}) + '\n'
}
