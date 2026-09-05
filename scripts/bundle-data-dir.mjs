#!/usr/bin/env node
import {load} from 'js-yaml'
import fs from 'node:fs'
import {isNotJunk} from './junk.mjs'
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
export function bundleDataDir({fromDir, toFile}) {
	let files = fs
		.readdirSync(fromDir)
		.filter(isNotJunk)
		.map((f) => path.join(fromDir, f))
	if (!files.length) {
		return
	}

	// sort the files so that 9 comes before 10
	files.sort(new Intl.Collator(undefined, {numeric: true}).compare)

	let loaded = files.map((fpath) => {
		let contents = fs.readFileSync(fpath, 'utf-8')
		try {
			return load(contents)
		} catch (err) {
			// js-yaml reports a line and column but not which file they are in,
			// and this runs over several hundred of them.
			throw new Error(`${fpath}: ${err.message}`, {cause: err})
		}
	})
	let dated = {data: loaded}
	let output = JSON.stringify(dated) + '\n'

	let outStream = toFile === '-' ? process.stdout : fs.createWriteStream(toFile)
	outStream.write(output)
}
