import * as React from 'react'
import {useSegments} from 'expo-router'

import {routePattern} from './route-pattern'
import {track} from './track'

/** Counts a `screen.view` each time the visible route changes. */
export function useScreenViews(): void {
	let route = routePattern(useSegments())

	React.useEffect(() => {
		track({name: 'screen.view', attributes: {route}})
	}, [route])
}
