// @flow

import {setVersionInfo, setAppName, setTimezone} from '@frogpond/constants'

const {version, name} = require('../../package.json')

setVersionInfo(version)
setAppName(name)
setTimezone("US/Central")
