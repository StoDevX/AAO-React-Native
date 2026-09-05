#!/usr/bin/env node
import fs from 'node:fs'
import {isNotJunk} from './junk.mjs'
import path from 'node:path'
import {bundleDataDir} from './bundle-data-dir.mjs'
import {convertDataFile} from './convert-data-file.mjs'
import {buildFaqs} from './build-faqs.mjs'
import {buildSources} from './build-sources.mjs'

const isDir = (pth) => fs.statSync(pth).isDirectory()
const isFile = (pth) => fs.statSync(pth).isFile()

const readDir = (pth) =>
	fs
		.readdirSync(pth)
		.filter(isNotJunk)
		.filter((entry) => !entry.startsWith('_'))

const findDirsIn = (pth) => readDir(pth).filter((entry) => isDir(path.join(pth, entry)))

const findFilesIn = (pth) => readDir(pth).filter((entry) => isFile(path.join(pth, entry)))

const args = process.argv.slice(2)
const flags = args.filter((arg) => arg.startsWith('--'))
const [fromDir, toDir] = args.filter((arg) => !arg.startsWith('--'))
if (!fromDir || !toDir || flags.includes('--help')) {
	console.error('usage: node bundle-data.js [--verbose] <from-dir> <to-dir>')
	process.exit(1)
}

const verbose = flags.includes('--verbose')

// Naming and timing every file is a few hundred lines of output, and this
// script runs ahead of tsc, jest, and so every pre-commit hook -- enough noise
// to bury whatever the reader ran the command for. Report a count by default
// and keep the detail for whoever asks for it.
const step = (label, work) => {
	if (!verbose) {
		work()
		return
	}
	console.log(label)
	console.time(label)
	work()
	console.timeEnd(label)
}

fs.mkdirSync(toDir, {recursive: true})

// Bundle each directory of yaml files into one big json file
const dirs = findDirsIn(fromDir)
dirs.forEach((dirname) => {
	let input = path.join(fromDir, dirname)
	let output = path.join(toDir, dirname) + '.json'
	step(`bundle-data-dir ${input} ${output}`, () => bundleDataDir({fromDir: input, toFile: output}))
})

// Convert these files into JSON equivalents
const specialFiles = new Map([
	['faqs.yaml', buildFaqs],
	['sources.yaml', buildSources],
])

const files = findFilesIn(fromDir).filter((file) => !specialFiles.has(file))
files.forEach((file) => {
	// Get the absolute paths to the input and output files
	let input = path.join(fromDir, file)
	let output = path.join(toDir, file).replace(/\.(.*)$/u, '.json')
	step(`convert-data-file ${input} ${output}`, () => {
		convertDataFile({fromFile: input, toFile: output})
		if (file.endsWith('.css')) {
			let dest = output.replace(/\.json/u, '.css')
			convertDataFile({fromFile: input, toFile: dest, toFileType: 'css'})
		}
	})
})

let built = 0
for (let [file, builder] of specialFiles.entries()) {
	let source = path.join(fromDir, file)
	if (!fs.existsSync(source)) {
		continue
	}

	let output = path.join(toDir, file).replace(/\.(.*)$/u, '.json')
	step(`${builder.name} ${source} ${output}`, () =>
		builder({sourceFile: source, outputFile: output}),
	)
	built += 1
}

console.log(`bundle-data: ${dirs.length} directories and ${files.length + built} files -> ${toDir}`)
