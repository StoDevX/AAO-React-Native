// @flow

import {fail} from 'danger'
import fs from 'fs'

function runTask(taskName) {
  const taskFile = `./danger/task-${taskName}.js`
  if (!fs.exists(taskFile)) {
    // We want to make sure the file exists before we try to run it, to avoid
    // confusing errors
    fail(`No task file was found for the task ${taskName}.`)
  }

  // Danger itself will report any execution errors, so we don't want to do a
  // try-catch here.

  // $FlowExpectedError
  require(taskFile)
}

function main() {
  // Automatically run some dangerfiles based on `process.env.TASK`

  const taskNames: ?string = process.env.TASK
  if (!taskNames) {
    // If danger is invoked, it should run. If it can't find a TASK, then
    // either the TASK needs to be written, or danger needs to not run.
    fail('Danger was invoked, but no TASK was set.')
    return
  }

  taskNames.split(',').forEach(runTask)
}

main()
