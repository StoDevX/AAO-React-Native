import {setVersionInfo, setAppName, setTimezone} from '@frogpond/constants'

export const SENTRY_DSN =
	'https://6f70285364b7417181e17db8bcf4de11@sentry.frogpond.tech/2'

import {version, name} from '../../package.json'

setVersionInfo(version)
setAppName(name)
setTimezone('America/Chicago')
