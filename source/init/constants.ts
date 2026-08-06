import {setVersionInfo, setTimezone} from '@frogpond/constants'

export const SENTRY_DSN =
	'https://7f68e814c5c24c32a582f2ddc3d42b4c@o524787.ingest.sentry.io/5637838'

import {version} from '../../package.json'

setVersionInfo(version)
setTimezone('America/Chicago')
