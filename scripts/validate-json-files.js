#!/usr/bin/node
const fs = require('fs')
const files = process.argv.slice(2)

files.forEach(f => {
  console.log(`checking ${f}`)
  JSON.parse(fs.readFileSync(f, 'utf-8'))
})
