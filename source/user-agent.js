// @flow

import {version} from '../package.json'
import {Platform} from 'react-native'

const aaoVersion = version || 'unknown'
const platformString = Platform.OS == 'ios' ? 'iOS' : 'Android' || 'unknown'
const platformVersion = Platform.Version || 'unknown'

export const AAO_USER_AGENT = `AllAboutOlaf/${aaoVersion} (${platformString}/${platformVersion})`
