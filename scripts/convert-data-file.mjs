#!/usr/bin/env node
import fs from 'node:fs'
import yaml from 'js-yaml'

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
export function convertDataFile({fromFile, toFile, toFileType = 'json'}) {
	let contents = fs.readFileSync(fromFile, 'utf-8')
	let output = contents

	let fileType = fromFile.split('.').slice(-1)[0]
	switch (fileType) {
		case 'md':
			output = processMarkdown(contents)
			break
		case 'yaml':
			output = processYaml(contents)
			break
		case 'css':
			if (toFileType === 'css') {
				output = contents
			} else {
				output = processCSS(contents)
			}
			break
		default:
			throw new Error(
				`unexpected filetype "${fileType}; expected "md", "yaml", or "css"`,
			)
	}

	output = output + '\n'

	let outStream = toFile === '-' ? process.stdout : fs.createWriteStream(toFile)
	outStream.write(output)
}

function processYaml(fileContents) {
	let loaded = yaml.load(fileContents)
	return JSON.stringify({data: loaded})
}

function processMarkdown(fileContents) {
	return JSON.stringify({text: fileContents})
}

function processCSS(fileContents) {
	return JSON.stringify({css: fileContents})
}
