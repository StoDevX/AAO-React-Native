#!/usr/bin/env node
const yaml = require('js-yaml')
const fs = require('fs')
const junk = require('junk')
const path = require('path')
const natsort = require('string-natural-compare')

// run cli
if (process.mainModule === module) {
  const args = process.argv.slice(2)
  const fromDir = args[0]
  const toFile = args[1] || '-'
  if (!fromDir || fromDir === '-h' || fromDir === '--help') {
    console.error('usage: node bundle-data-dir.js <from-dir> [to-file]')
    process.exit(1)
  }
  console.log(process.mainModule)
  bundleDataDir({fromDir, toFile})
}

// exported module
module.exports = bundleDataDir
function bundleDataDir({fromDir, toFile}) {
  const files = fs
    .readdirSync(fromDir)
    .filter(junk.not)
    .map(f => path.join(fromDir, f))
  if (!files.length) {
    return
  }

  // sort the files so that 9 comes before 10
  files.sort(natsort)

  const loaded = files.map(fpath => {
    console.log(fpath)
    let contents = fs.readFileSync(fpath, 'utf-8')
    return yaml.safeLoad(contents)
  })
  const dated = {data: loaded}
  const output = JSON.stringify(dated) + '\n'

  const outStream =
    toFile === '-' ? process.stdout : fs.createWriteStream(toFile)
  outStream.write(output)
}
