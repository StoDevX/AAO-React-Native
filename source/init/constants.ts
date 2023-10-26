import {setAppName, setTimezone, setVersionInfo} from '@frogpond/constants'

import {name, version} from '../../package.json'

export const SENTRY_DSN =
	'https://7f68e814c5c24c32a582f2ddc3d42b4c@o524787.ingest.sentry.io/5637838'

setVersionInfo(version)
setAppName(name)
setTimezone('America/Chicago')
