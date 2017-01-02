#!/usr/bin/env node
// usage: convert-data-file file.{yaml,md} [file.json]

const fs = require('fs')
const yaml = require('js-yaml')
const marked = require('marked')

// run cli
const args = process.argv.slice(2)
if (args.length) {
  const fromFile = args[0]
  const toFile = args[1] || '-'
  convertDataFile({fromFile, toFile})
}

// exported module
module.exports = convertDataFile
function convertDataFile({fromFile, toFile}) {
  const contents = fs.readFileSync(fromFile, 'utf-8')
  let output = contents

  const fileType = fromFile.split('.').slice(-1)[0]
  switch (fileType) {
    case 'md':
      output = processMarkdown(contents)
      break
    case 'yaml':
      output = processYaml(contents)
      break
    default:
      throw new Error(`unexpected filetype "${fileType}; expected "md" or "yaml"`)
  }

  output = output + '\n'

  const outStream = toFile === '-' ? process.stdout : fs.createWriteStream(toFile)
  outStream.write(output)
}

function processYaml(fileContents) {
  let loaded = yaml.safeLoad(fileContents)
  return JSON.stringify({dateModified: new Date().toISOString(), data: loaded}, null, 2)
}

function processMarkdown(fileContents) {
  let loaded = marked(fileContents)
  return JSON.stringify({dateModified: new Date().toISOString(), text: loaded}, null, 2)
}
