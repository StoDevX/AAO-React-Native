import fs from 'node:fs'
import path from 'node:path'
import {isDataEntry} from './data-entries.mjs'
import {load} from 'js-yaml'
import moment from 'moment'
import {DATA_BASE} from './paths.mjs'

const NO_VALUE_SEEN = Symbol()
const TIME_FORMAT = 'h:mma'

function* enumerate(iter) {
	let i = 0
	for (let val of iter) {
		yield [i, val]
		i += 1
	}
}

function* pair(iter) {
	let last = NO_VALUE_SEEN
	for (let thisValue of iter) {
		if (thisValue === false) {
			continue
		}
		yield [last, thisValue]
		last = thisValue
	}
}

export function* validate(data) {
	for (let schedule of data.schedules) {
		for (let [i, times] of enumerate(schedule.times)) {
			// prettier-ignore
			let thisRowNote = `in row ${i+1} of the ${data.line} schedule for [${schedule.days.join(',')}]`
			if (times.length !== schedule.stops.length && schedule.stops.length > 1) {
				// prettier-ignore
				yield `There are ${schedule.stops.length} named stops but ${times.length} arrival times ${thisRowNote}`
			}

			for (let [lastTime, thisTime] of pair(times)) {
				if (lastTime === NO_VALUE_SEEN) {
					continue
				}

				let lastM = moment(lastTime, TIME_FORMAT)
				let thisM = moment(thisTime, TIME_FORMAT)

				if (!thisM.isValid()) {
					// prettier-ignore
					yield `"${thisTime}" is invalid; does it match ${TIME_FORMAT}? (${thisRowNote})`
				}

				if (lastM.isAfter(thisM)) {
					// prettier-ignore
					yield `"${lastTime}" is after "${thisTime}" ${thisRowNote}`
				}
			}
		}
	}
}

export function findBusDataFiles(dir) {
	return fs
		.readdirSync(dir)
		.filter(isDataEntry)
		.map((f) => path.join(dir, f))
}

function main() {
	let files = findBusDataFiles(path.join(DATA_BASE, 'bus-times'))

	let anyHadError = false
	for (let filepath of files) {
		let fileHadError = false
		process.stdout.write(filepath)
		let errors = validate(load(fs.readFileSync(filepath, 'utf-8')))
		for (let error of errors) {
			process.stdout.write('\n')
			fileHadError = true
			process.stdout.write(error + '\n')
		}
		if (!fileHadError) {
			process.stdout.write(' is valid\n')
		}
		// OR rather than assign: a plain assignment lets a clean last file
		// erase an earlier file's failure and exit 0 with errors on screen.
		anyHadError = anyHadError || fileHadError
	}

	if (anyHadError) {
		process.exit(1)
	}
}

if (import.meta.main) {
	main()
}
