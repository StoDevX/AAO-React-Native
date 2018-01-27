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
	let processed = loaded
	if (fromDir.endsWith('building-hours')) {
		processed = processed.map(ensureClosedSchedulesHaveTimes)
		processed = processed.map(ensureScheduleEntriesHaveTimes)
	}
	const dated = {data: processed}
	const output = JSON.stringify(dated) + '\n'

	const outStream =
		toFile === '-' ? process.stdout : fs.createWriteStream(toFile)
	outStream.write(output)
}

function ensureClosedSchedulesHaveTimes(building) {
	let schedules = []

	for (let schedule of building.schedule) {
		schedules.push(schedule)
	}

	for (let override of building.overrides) {
		for (let schedule of override.schedule) {
			schedules.push(schedule)
		}
	}

	for (let schedule of schedules) {
		if (schedule.closed && !schedule.hours) {
			schedule.hours = [{closed: true, from: '12:00am', to: '12:00am', days: []}]
		}
	}

	return building
}

function ensureScheduleEntriesHaveTimes(building) {
	let entries = []
	for (let schedule of building.schedule) {
		for (let entry of schedule.hours) {
			entries.push(entry)
		}
	}

	for (let override of building.overrides) {
		for (let schedule of override.schedule) {
			for (let entry of schedule.hours) {
				entries.push(entry)
			}
		}
	}

	for (let entry of entries) {
		if (entry.closed && !(entry.from || entry.to)) {
			entry.from = '12:00am'
			entry.to = '12:00am'
		}
	}

	return building
}
