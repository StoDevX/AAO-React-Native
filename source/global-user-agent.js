// @flow

import {version} from '../package.json'
import {Platform} from 'react-native'

const platformString = Platform.OS == 'ios' ? 'iOS' : 'Android'
const platformVersion = Platform.getVersion()

global.AAO_USER_AGENT = `AllAboutOlaf/${version} (${platformString}/${platformVersion})`
