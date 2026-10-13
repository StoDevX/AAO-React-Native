import {useSelector} from 'react-redux'
import {selectDevModeOverride} from '../redux/parts/settings'

// Dev-gated UI follows the Home notice's dev mode toggle alone, which starts
// off in every build: a prerelease or Metro build counts as a debug build,
// and testers on those should see what a store build shows until they ask
// for more. isDebugBuild() still decides what Sentry attaches to reports.
export const useIsDevMode = (): boolean => useSelector(selectDevModeOverride)
