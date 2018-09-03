// @flow

import {setVersionInfo, setAppName} from '@frogpond/constants'

const {version, name} = require('../../package.json')

setVersionInfo(version)
setAppName(name)
