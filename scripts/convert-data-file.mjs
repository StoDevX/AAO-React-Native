#!/usr/bin/env node
import fs from 'node:fs'
import {load} from 'js-yaml'
import {yamlProblem} from './data-problems.mjs'

// run cli
// if (process.mainModule === module) {
// 	let args = process.argv.slice(2)
// 	let fromFile = args[0]
// 	let toFile = args[1] || '-'
// 	if (!fromFile || fromFile === '-h' || fromFile === '--help') {
// 		console.error(
// 			'usage: node convert-data-file.js <from-file.{md,yaml,css}> [to-file]',
// 		)
// 		process.exit(1)
// 	}
// 	convertDataFile({fromFile, toFile})
// }

// exported module
/** The file as the app reads it: JSON, or for `toFileType` 'css' the stylesheet itself. */
export function renderDataFile({fromFile, toFileType = 'json'}) {
	let contents = fs.readFileSync(fromFile, 'utf-8')
	let output = contents

	let fileType = fromFile.split('.').at(-1)
	switch (fileType) {
		case 'md':
			output = processMarkdown(contents)
			break
		case 'yaml':
			try {
				output = processYaml(contents)
			} catch (error) {
				throw yamlProblem(fromFile, error)
			}
			break
		case 'css':
			if (toFileType === 'css') {
				output = contents
			} else {
				output = processCSS(contents)
			}
			break
		default:
			throw new Error(`unexpected filetype "${fileType}; expected "md", "yaml", or "css"`)
	}

	return output + '\n'
}

function processYaml(fileContents) {
	let loaded = load(fileContents)
	return JSON.stringify({data: loaded})
}

function processMarkdown(fileContents) {
	return JSON.stringify({text: fileContents})
}

function processCSS(fileContents) {
	return JSON.stringify({css: fileContents})
}
