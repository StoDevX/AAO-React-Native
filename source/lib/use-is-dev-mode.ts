import {useSelector} from 'react-redux'
import {isDebugBuild} from '@frogpond/constants'
import {selectDevModeOverride} from '../redux/parts/settings'

// Combines the build-time isDebugBuild() flag with the persisted runtime
// override so that beta testers (or XCUITests against Release) can opt into
// dev-gated UI. Non-React callers (e.g. pre-rehydrate init) should keep
// using isDebugBuild() directly.
export const useIsDevMode = (): boolean => {
	const override = useSelector(selectDevModeOverride)
	return isDebugBuild() || override
}
