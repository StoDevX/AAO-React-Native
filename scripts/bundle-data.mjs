#!/usr/bin/env node
import fs from 'node:fs/promises'
import {isJunk} from 'junk'
import path from 'node:path'
import {bundleDataDir} from './bundle-data-dir.mjs'
import {convertDataFile} from './convert-data-file.mjs'

const args = process.argv.slice(2)
const fromDir = args[0]
const toDir = args[1]
if (!fromDir || !toDir || fromDir === '-h' || fromDir === '--help') {
	console.error('usage: node bundle-data.js <from-dir> <to-dir>')
	process.exit(1)
}

await fs.mkdir(toDir, {recursive: true})

console.time(`bundle-data from ${fromDir} to ${toDir}`)
for (const file of await fs.readdir(fromDir)) {
	if (isJunk(file) || file.startsWith('_')) {
		continue
	}

	const fullPath = path.join(fromDir, file)
	const stat = await fs.stat(fullPath) // eslint-disable-line no-await-in-loop -- sequential processing is intentional

	if (stat.isDirectory()) {
		// Bundle each directory of yaml files into one big json file
		let input = fullPath
		let output = path.join(toDir, file) + '.json'
		console.log(`bundle-data-dir ${input} ${output}`)
		console.time(`bundle-data-dir ${input} ${output}`)
		bundleDataDir({fromDir: input, toFile: output})
		console.timeEnd(`bundle-data-dir ${input} ${output}`)
	} else if (stat.isFile()) {
		// Convert these files into JSON equivalents
		// Get the absolute paths to the input and output files
		let input = path.join(fromDir, file)
		let output = path.join(toDir, file).replace(/\.(.*)$/u, '.json')
		console.log(`convert-data-file ${input} ${output}`)
		console.time(`convert-data-file ${input} ${output}`)
		convertDataFile({fromFile: input, toFile: output})
		if (file.endsWith('.css')) {
			let dest = output.replace(/\.json/u, '.css')
			convertDataFile({fromFile: input, toFile: dest, toFileType: 'css'})
		}
		console.timeEnd(`convert-data-file ${input} ${output}`)
	}
}
console.timeEnd(`bundle-data from ${fromDir} to ${toDir}`)
