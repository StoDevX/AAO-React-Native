import {setVersionInfo, setAppName, setTimezone} from '@frogpond/constants'

export const DEMO_USER = {
	username: 'demo@frogpond.tech',
	password: 'demo',
}

export const SENTRY_DSN =
	'https://7f68e814c5c24c32a582f2ddc3d42b4c@o524787.ingest.sentry.io/5637838'

import {version, name} from '../../package.json'

setVersionInfo(version)
setAppName(name)
setTimezone('America/Chicago')
