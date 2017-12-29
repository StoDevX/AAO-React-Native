const {readFileSync} = require('fs')

module.exports.readFile = filename => {
  try {
    return readFileSync(filename, 'utf-8')
  } catch (err) {
    if (err.code === 'ENOENT') {
      return ''
    }
    return err.message
  }
}

module.exports.readLogFile = filename => readFile(filename).trim()
