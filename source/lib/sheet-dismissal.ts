import {StackActions} from 'expo-router/react-navigation'
import type {NavigationContainerRefWithCurrent, ParamListBase} from 'expo-router/react-navigation'

/**
 * The root stack's routes that open as a sheet, by the name `app/_layout.tsx`
 * gives them. Keep it to the screens that set `DETAIL_SHEET` or a modal
 * `presentation` there.
 */
export const SHEET_ROUTES: ReadonlySet<string> = new Set([
	'menu-item-detail',
	'transit/line',
	'hours/detail',
	'dictionary/entry',
	'directory/named',
	'calendar/event',
	'customize',
	'messenger/customize',
	'report-problem',
])

/** How many sheets sit on top of the stack, given its route names from bottom to top. */
export function countSheetsOnTop(routeNames: string[]): number {
	let count = 0
	for (let name of routeNames.toReversed()) {
		if (!SHEET_ROUTES.has(name)) {
			break
		}
		count += 1
	}
	return count
}

let container: NavigationContainerRefWithCurrent<ParamListBase> | undefined

/** Tells this module which navigation container to dismiss sheets from. */
export function registerNavigationContainer(
	ref: NavigationContainerRefWithCurrent<ParamListBase> | undefined,
): void {
	container = ref
}

/**
 * Closes the sheets over the screen the reader was on, and only them, so Back
 * from the next screen still retraces their steps. A sheet can hold a stack of
 * its own, so the pop is aimed at the root stack rather than the focused one.
 *
 * Returns whether anything was closed.
 */
export function dismissSheets(): boolean {
	let state = container?.isReady() ? container.getRootState() : undefined
	if (!container || !state) {
		return false
	}

	let count = countSheetsOnTop(state.routes.map((route) => route.name))
	if (count === 0) {
		return false
	}

	container.dispatch({...StackActions.pop(count), target: state.key})
	return true
}
