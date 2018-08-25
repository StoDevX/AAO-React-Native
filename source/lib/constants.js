// @flow

export const GH_BASE_URL = 'https://github.com/StoDevX/AAO-React-Native'
export const GH_NEW_ISSUE_URL = `${GH_BASE_URL}/issues/new`

export const IS_PRODUCTION = process.env.NODE_ENV === 'production'

const GOOGLE_ANALYTICS_PRODUCTION_ID = 'UA-90234209-2'
const GOOGLE_ANALYTICS_DEVELOPMENT_ID = 'UA-90234209-1'

export const GOOGLE_ANALYTICS_ID = IS_PRODUCTION
	? GOOGLE_ANALYTICS_PRODUCTION_ID
	: GOOGLE_ANALYTICS_DEVELOPMENT_ID
