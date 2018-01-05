// @flow

import {markdown} from 'danger'
import bytes from 'pretty-bytes'
import {
  readLogFile,
  fastlaneBuildLogTail,
  readJsonLogFile,
  listZip,
  m,
  h,
} from './lib'

const logFile = readLogFile('./logs/build').split('\n')
const buildStatus = readLogFile('./logs/build-status')

export default function run() {
  if (buildStatus !== '0') {
    fastlaneBuildLogTail(logFile, 'Android Build Failed')
    // returning early here because if the build fails, there's nothing to analyze
    return
  }

  const appPaths = readJsonLogFile('./logs/products')
  const apkInfos = appPaths.map(listZip)

  markdown(
    h.details(
      h.summary('contents of <code>apkInfos</code>'),
      m.json(apkInfos),
      m.json(appPaths),
    ),
  )

  //   markdown(`Generated ${apkInfos.length} APK${apkInfos.length !== 1 ? 's' : ''}

  // ${outputFilesInfo
  //     .map((filename, i) => [filename, apkInfos[i]])
  //     .map(([filename, apk]) =>
  //       h.details(
  //         h.summary(`${filename} (${bytes(apk.size)})`),
  //         m.json(apk),
  //       ),
  //     )}
  //   `)
}
