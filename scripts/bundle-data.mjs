#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import {isDataEntry} from './data-entries.mjs'
import {loadScheduleData, scheduleArtifacts} from './schedule-data.ts'
import {bundleDataDir} from './bundle-data-dir.mjs'
import {convertDataFile} from './convert-data-file.mjs'
import {buildFaqs} from './build-faqs.mjs'
import {buildSources} from './build-sources.mjs'
import {bundleImages} from './bundle-images.mjs'

const isDir = (pth) => fs.statSync(pth).isDirectory()
const isFile = (pth) => fs.statSync(pth).isFile()

const readDir = (pth) => fs.readdirSync(pth).filter(isDataEntry)

const findDirsIn = (pth) => readDir(pth).filter((entry) => isDir(path.join(pth, entry)))

const findFilesIn = (pth) => readDir(pth).filter((entry) => isFile(path.join(pth, entry)))

/// `file` with its own extension replaced. Only the last segment is touched:
/// the folders above it may hold dots (`/Users/some.name/…`), and the file's
/// extension begins at its first dot (`a.b.yaml` becomes `a.json`).
const withExtension = (file, extension) => {
	let {dir, base} = path.parse(file)
	return path.join(dir, base.replace(/\..*$/u, extension))
}

const args = process.argv.slice(2)
const flags = args.filter((arg) => arg.startsWith('--'))
const [fromDir, toDir] = args.filter((arg) => !arg.startsWith('--'))
if (!fromDir || !toDir || flags.includes('--help')) {
	console.error('usage: node bundle-data.js [--verbose] [--bundle-into-app] <from-dir> <to-dir>')
	process.exit(1)
}

const verbose = flags.includes('--verbose')

// The app's offline copy of the manifest lives in this repo, so only the
// repo's own `mise run bundle-data` asks for it. The data editor builds in a
// workspace of its own and has no repo to write into.
const bundledCopy = flags.includes('--bundle-into-app')
	? path.join(import.meta.dirname, '..', 'modules/data-sources/bundled.json')
	: undefined

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

// Check every schedule input before creating or writing any generated output.
const hasSchedules =
	fs.existsSync(path.join(fromDir, 'breaks.yaml')) ||
	fs.existsSync(path.join(fromDir, 'building-hours'))
const artifacts = hasSchedules ? scheduleArtifacts(loadScheduleData(fromDir)) : []
const outputs = artifacts.map(({filename, data}) => ({
	filename,
	contents: JSON.stringify(data) + '\n',
}))

fs.mkdirSync(toDir, {recursive: true})

for (let {filename, contents} of outputs) {
	let output = path.join(toDir, filename)
	step(`bundle-schedules ${output}`, () => fs.writeFileSync(output, contents))
}
if (artifacts.length > 0) {
	// Remove the retired generated feed only after validating and writing its replacement.
	fs.rmSync(path.join(toDir, 'building-hours-authored.json'), {force: true})
}

// Bundle each directory of yaml files into one big json file
const dirs = findDirsIn(fromDir)
dirs
	.filter((dirname) => dirname !== 'building-hours')
	.forEach((dirname) => {
		let input = path.join(fromDir, dirname)
		let output = path.join(toDir, dirname) + '.json'
		step(`bundle-data-dir ${input} ${output}`, () =>
			bundleDataDir({fromDir: input, toFile: output}),
		)
	})

// Convert these files into JSON equivalents
const specialFiles = new Map([
	['faqs.yaml', buildFaqs],
	['sources.yaml', buildSources],
])

const files = findFilesIn(fromDir).filter(
	(file) => !specialFiles.has(file) && file !== 'breaks.yaml',
)
files.forEach((file) => {
	// Get the absolute paths to the input and output files
	let input = path.join(fromDir, file)
	let output = withExtension(path.join(toDir, file), '.json')
	step(`convert-data-file ${input} ${output}`, () => {
		convertDataFile({fromFile: input, toFile: output})
		if (file.endsWith('.css')) {
			let dest = withExtension(output, '.css')
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

	let output = withExtension(path.join(toDir, file), '.json')
	step(`${builder.name} ${source} ${output}`, () =>
		builder({sourceFile: source, outputFile: output, bundledCopy}),
	)
	built += 1
}

// The images the app fetches through ccc-server, published beside the data
let images = 0
step(`bundle-images images ${toDir}`, () => {
	images = bundleImages({toDir})
})

console.log(
	`bundle-data: ${dirs.length} directories, ${files.length + built + artifacts.length} files and ${images} images -> ${toDir}`,
)
