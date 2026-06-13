import {NativeStackNavigationOptions} from '@react-navigation/native-stack'

export * as studentwork from './student-work'
export {
	CourseSearchView,
	CourseSearchResultsView,
	CourseDetailView,
	CourseSearchNavigationOptions,
	CourseSearchViewNavigationOptions,
	CourseSearchDetailNavigationOptions,
} from './course-search'

// SIS shows the student's account balances. Open Jobs (student work) is its
// own destination, reachable from the Browse catalog via the "Job" route.
export {BalancesOrAcknowledgementView as View} from './balances-acknowledgement'

export type NavigationParams = undefined
export const NavigationKey = 'SIS'
export const NavigationOptions: NativeStackNavigationOptions = {
	title: 'SIS',
}
