// @flow

import {initTracker, initBugsnag} from '@frogpond/analytics'
import {IS_PRODUCTION} from '@frogpond/constants'

const GOOGLE_ANALYTICS_PRODUCTION_ID = 'UA-90234209-2'
const GOOGLE_ANALYTICS_DEVELOPMENT_ID = 'UA-90234209-1'

export const GOOGLE_ANALYTICS_ID = IS_PRODUCTION
	? GOOGLE_ANALYTICS_PRODUCTION_ID
	: GOOGLE_ANALYTICS_DEVELOPMENT_ID

initTracker(GOOGLE_ANALYTICS_ID)
initBugsnag()
