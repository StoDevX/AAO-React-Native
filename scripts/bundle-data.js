#!/bin/bash
const bundleDataDir = require('./bundle-data-dir')
const convertDataFile = require('./convert-data-file')

// Bundle each directory of yaml files into one big json file
let dirs = [
  'building-hours',
  'bus-times',
  'contact-info',
  'dictionary',
  'map-coordinates',
  'transportation',
  'webcams',
]
dirs.forEach(dirname => {
  console.log(`bundle-data-dir data/${dirname} docs/${dirname}.json`)
  bundleDataDir({fromDir: `data/${dirname}`, toFile: `docs/${dirname}.json`})
})

// Convert these files into JSON equivalents
let files = [
  'breaks.yaml',
  'chapel.yaml',
  'credits.yaml',
  'legal.md',
  'map.yaml',
  'pause-menu.yaml',
  'privacy.md',
]
files.forEach(file => {
  let out = file.replace(/\.(md|yaml)$/, '.json')
  console.log(`convert-data-file data/${file} docs/${out}`)
  convertDataFile({fromFile: `data/${file}`, toFile: `docs/${out}`})
})
