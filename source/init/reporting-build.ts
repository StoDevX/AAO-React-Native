import {IS_PRODUCTION} from '@frogpond/constants'
import {isChaos, isDebugNativeBuild, isSimulator, isUITesting} from '@frogpond/launch-arguments'

/**
 * Whether this build may send anything to Sentry: a Release build on a phone,
 * launched by a person. IS_PRODUCTION alone is not enough, as local builds
 * embed a release bundle too -- the UI tests', and `mise run device`'s. A
 * chaos run's failures are injected, so none of them belong in Sentry either.
 */
export const IS_REPORTING_BUILD: boolean =
	IS_PRODUCTION && !isChaos && !isUITesting && !isSimulator && !isDebugNativeBuild
