// @flow

import {version} from '../package.json'
import {Platform} from 'react-native'

global.AAO_USER_AGENT = `AllAboutOlaf/${version} (${Platform.OS == 'ios' ? 'iOS' : 'Android'}/${Platform.getVersion()})`
