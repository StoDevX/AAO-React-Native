'use strict'

const fs = require('fs')
const path = require('path')
const execa = require('execa')

const response = require('./patch.json')

const base = path.join(__dirname, '..', 'node_modules', 'react-native')

for (let file of response.files) {
	console.log('patching', path.join(base, file.filename))
	console.log(file.patch)
	const result = execa.sync('patch', [path.join(base, file.filename)], {input: file.patch})
	console.log(result.stdout)
	console.log(result.stderr)
	console.log()
}
