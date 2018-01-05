// @flow

import {schedule, warn} from 'danger'
import yarn from 'danger-plugin-yarn'
import runAndroid from './scripts/danger/task-android'
import runiOS from './scripts/danger/task-ios'
import runGeneral from './scripts/danger/task-js-general'
import runGreenkeeper from './scripts/danger/task-greenkeeper'
import runJSのData from './scripts/danger/task-js-data'
import runJSのFlow from './scripts/danger/task-js-flow'
import runJSのJest from './scripts/danger/task-js-jest'
import runJSのLint from './scripts/danger/task-js-lint'
import runJSのPrettier from './scripts/danger/task-js-prettier'

async function main() {
  const taskName = String(process.env.task)

  switch (taskName) {
    case 'ANDROID':
      await runAndroid()
      break
    case 'IOS':
      await runiOS()
      break
    case 'GREENKEEPER':
      await runGreenkeeper()
      break
    case 'JS-general':
      await runGeneral()
      await yarn()
      break
    case 'JS-data':
      await runJSのData()
      break
    case 'JS-flow':
      await runJSのFlow()
      break
    case 'JS-jest':
      await runJSのJest()
      break
    case 'JS-lint':
      await runJSのLint()
      break
    case 'JS-prettier':
      await runJSのPrettier()
      break
    default:
      warn(`Unknown task name "${taskName}"; Danger cannot report anything.`)
  }
}

schedule(main)
