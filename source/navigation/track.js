// @flow

import {type NavigationState} from 'react-navigation'

// gets the current screen from navigation state
function getCurrentRouteName(navigationState: NavigationState): ?string {
	if (!navigationState) {
		return null
	}
	const route = navigationState.routes[navigationState.index]
	// dive into nested navigators
	if (route.routes) {
		return getCurrentRouteName(route)
	}
	return route.routeName
}

export function trackScreenChanges(
	prevState: NavigationState,
	currentState: NavigationState,
) {
	const currentScreen = getCurrentRouteName(currentState)
	const prevScreen = getCurrentRouteName(prevState)

	if (!currentScreen) {
		return
	}

	if (currentScreen !== prevScreen) {
		// leave a breadcrumb
	}
}
