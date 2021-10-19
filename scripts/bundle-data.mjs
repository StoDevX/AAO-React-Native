#!/usr/bin/env node
import fs from 'node:fs'
import {isNotJunk} from 'junk'
import path from 'node:path'
import mkdirp from 'mkdirp'
import {bundleDataDir} from './bundle-data-dir.mjs'
import {convertDataFile} from './convert-data-file.mjs'

const isDir = (pth) => fs.statSync(pth).isDirectory()
const isFile = (pth) => fs.statSync(pth).isFile()

const readDir = (pth) =>
	fs
		.readdirSync(pth)
		.filter(isNotJunk)
		.filter((entry) => !entry.startsWith('_'))

const findDirsIn = (pth) =>
	readDir(pth).filter((entry) => isDir(path.join(pth, entry)))

const findFilesIn = (pth) =>
	readDir(pth).filter((entry) => isFile(path.join(pth, entry)))

const args = process.argv.slice(2)
const fromDir = args[0]
const toDir = args[1]
if (!fromDir || !toDir || fromDir === '-h' || fromDir === '--help') {
	console.error('usage: node bundle-data.js <from-dir> <to-dir>')
	process.exit(1)
}

mkdirp.sync(toDir)

// Bundle each directory of yaml files into one big json file
const dirs = findDirsIn(fromDir)
dirs.forEach((dirname) => {
	let input = path.join(fromDir, dirname)
	let output = path.join(toDir, dirname) + '.json'
	console.log(`bundle-data-dir ${input} ${output}`)
	console.time(`bundle-data-dir ${input} ${output}`)
	bundleDataDir({fromDir: input, toFile: output})
	console.timeEnd(`bundle-data-dir ${input} ${output}`)
})

// Convert these files into JSON equivalents
const files = findFilesIn(fromDir)
files.forEach((file) => {
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
})
