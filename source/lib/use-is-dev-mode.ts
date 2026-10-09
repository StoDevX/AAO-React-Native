import {useSelector} from 'react-redux'
import {isDebugBuild} from '@frogpond/constants'
import {selectDevModeOverride} from '../redux/parts/settings'

// The build-time isDebugBuild() flag, until the Home notice's dev mode toggle
// overrides it either way: a store build's tester can turn dev-gated UI on,
// and a prerelease build, which counts as a debug build, can turn it off.
// Non-React callers (e.g. pre-rehydrate init) should keep using
// isDebugBuild() directly.
export const useIsDevMode = (): boolean => {
	const override = useSelector(selectDevModeOverride)
	return override ?? isDebugBuild()
}
