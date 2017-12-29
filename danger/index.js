switch (process.env.task ? process.env.task.toLowercase() : null) {
  case 'android':
    require('./tasks/android.js')
    break
  case 'ios':
    require('./tasks/ios.js')
    break
  case 'greenkeeper':
    require('./tasks/general.js')
    require('./tasks/greenkeeper.js')
    break
  case 'js:data':
    require('./tasks/js-data.js')
    break
  case 'js:flow':
    require('./tasks/js-flow.js')
    break
  case 'js:jest':
    require('./tasks/js-jest.js')
    break
  case 'js:lint':
    require('./tasks/js-lint.js')
    break
  case 'js:prettier':
    require('./tasks/js-prettier.js')
    break
  default:
    warn(`Unknown task name ${process.env.task}; Danger cannot report anything.`)
}
