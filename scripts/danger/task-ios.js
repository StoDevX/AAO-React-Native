// @flow

import {markdown} from 'danger'
import bytes from 'pretty-bytes'
import {
  readFile,
  readLogFile,
  fastlaneBuildLogTail,
  readJsonLogFile,
  m,
  h,
  listDirectoryTree,
} from './lib'

export default function run() {
  const logFile = readLogFile('./logs/build').split('\n')
  const buildStatus = readLogFile('./logs/build-status')

  if (buildStatus !== '0') {
    fastlaneBuildLogTail(logFile, 'iOS Build Failed')
    // returning early here because if the build fails, there's nothing to analyze
    return
  }

  // ideas:
  // - tee the "fastlane" output to a log, and run the analysis script
  //   to report back the longest compilation units
  //   (maybe only on react-native / package.json changes?)
  const analysisFile = readFile('./logs/analysis')
  markdown(
    h.details(
      h.summary('Analysis of slow build times (>20s)'),
      m.code({}, analysisFile),
    ),
  )

  // - report the .ipa size
  // - report the .ipa file list
  const appPaths = readJsonLogFile('./logs/products')

  appPaths.forEach(appPath => {
    const info = listDirectoryTree(appPath)
    markdown(`## <code>.app</code>
Total <code>.app</code> size: ${info.size}

${h.details(h.summary('.app contents'), m.json(info))}
`)
  })
}
