'use strict'

const fs = require('fs')
const path = require('path')
const junk = require('junk')
const yaml = require('js-yaml')
const moment = require('moment')
const {DATA_BASE} = require('./paths')

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

function* validate(data) {
  for (let schedule of data.schedules) {
    for (let [i, times] of enumerate(schedule.times)) {
      // prettier-ignore
      const thisRowNote = `in row ${i+1} of the ${data.line} schedule for [${schedule.days.join(',')}]`
      if (times.length !== schedule.stops.length) {
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

if (require.main === module) {
  const files = fs
    .readdirSync(path.join(DATA_BASE, 'bus-times'))
    .filter(junk.not)
    .map(f => path.join(DATA_BASE, 'bus-times', f))

  let anyHadError = false
  for (let filepath of files) {
    let fileHadError = false
    process.stdout.write(filepath)
    const errors = validate(yaml.safeLoad(fs.readFileSync(filepath, 'utf-8')))
    for (let error of errors) {
      process.stdout.write('\n')
      fileHadError = true
      process.stdout.write(error + '\n')
    }
    if (!fileHadError) {
      process.stdout.write(' is valid\n')
    }
    anyHadError = fileHadError
  }

  if (anyHadError) {
    process.exit(1)
  }
}
