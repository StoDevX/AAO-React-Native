import * as Sentry from '@sentry/react-native'
import type {NavigationState} from '@react-navigation/native'

// gets the current screen from navigation state
function getCurrentRouteName(navigationState: NavigationState): string | null {
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
): void {
	const currentScreen = getCurrentRouteName(currentState)
	const prevScreen = getCurrentRouteName(prevState)

	if (!currentScreen) {
		return
	}

	if (currentScreen !== prevScreen) {
		Sentry.addBreadcrumb({
			message: `Navigated to ${currentScreen}`,
			category: 'navigation',
			data: {
				prev: prevScreen,
			},
		})
	}
}
