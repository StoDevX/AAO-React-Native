switch (process.env.task) {
  case 'ANDROID':
    require('./tasks/android.js')
    break
  case 'IOS':
    require('./tasks/ios.js')
    break
  case 'GREENKEEPER':
    require('./tasks/general.js')
    require('./tasks/greenkeeper.js')
    break
  case 'JS-data':
    require('./tasks/js-data.js')
    break
  case 'JS-flow':
    require('./tasks/js-flow.js')
    break
  case 'JS-jest':
    require('./tasks/js-jest.js')
    break
  case 'JS-lint':
    require('./tasks/js-lint.js')
    break
  case 'JS-prettier':
    require('./tasks/js-prettier.js')
    break
  default:
    warn(`Unknown task name ${process.env.task}; Danger cannot report anything.`)
}
