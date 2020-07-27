// @flow

import React from 'react'
// import {Platform, StyleSheet} from 'react-native'
import {createAppContainer} from 'react-navigation'
import {createNativeStackNavigator} from 'react-native-screens/native-stack'
// import * as c from '@frogpond/colors'
// import {getTheme} from '@frogpond/app-theme'
import {routes} from './routes'

// let theme = getTheme()

// const styles = StyleSheet.create({
// 	header: {
// 		backgroundColor: theme.navigationBackground,
// 	},
// 	card: {
// 		backgroundColor: c.sectionBgColor,
// 	},
// })

// const navigatorOptions = {
// 	defaultNavigationOptions: {
// 		headerStyle: styles.header,
// 		headerTintColor: theme.navigationForeground,
// 	},
// 	headerTransitionPreset: Platform.select({
// 		ios: 'uikit',
// 		android: undefined,
// 	}),
// 	// cardStyle: styles.card,
// }

const Stack = createNativeStackNavigator()

export function AppStack() {
	return (
		<Stack.Navigator>
			<Stack.Screen component={routes.HomeView} name="Home" />
			<Stack.Screen
				component={routes.BuildingHoursDetailView}
				name="BuildingHoursDetail"
			/>
			<Stack.Screen component={routes.BuildingHoursView} name="BuildingHours" />
			<Stack.Screen
				component={routes.BuildingHoursProblemReportView}
				name="BuildingHoursProblemReport"
			/>
			<Stack.Screen
				component={routes.BuildingHoursScheduleEditorView}
				name="BuildingHoursScheduleEditor"
			/>
			<Stack.Screen component={routes.CalendarView} name="Calendar" />
			<Stack.Screen component={routes.ContactsView} name="Contacts" />
			<Stack.Screen
				component={routes.ContactsDetailView}
				name="ContactsDetail"
			/>
			<Stack.Screen component={routes.CreditsView} name="Credits" />
			<Stack.Screen component={routes.DebugView} name="Debug" />
			<Stack.Screen component={routes.APITestView} name="APITest" />
			<Stack.Screen
				component={routes.DictionaryDetailView}
				name="DictionaryDetail"
			/>
			<Stack.Screen component={routes.DictionaryView} name="Dictionary" />
			<Stack.Screen
				component={routes.DictionaryEditorView}
				name="DictionaryEditor"
			/>
			<Stack.Screen component={routes.EventDetailView} name="EventDetail" />
			<Stack.Screen component={routes.FaqView} name="Faq" />
			<Stack.Screen component={routes.HelpView} name="Help" />
			<Stack.Screen component={routes.JobDetailView} name="JobDetail" />
			<Stack.Screen component={routes.LegalView} name="Legal" />
			<Stack.Screen component={routes.MenusView} name="Menus" />
			<Stack.Screen component={routes.BonAppPickerView} name="BonAppPicker" />
			<Stack.Screen component={routes.NewsView} name="News" />
			<Stack.Screen component={routes.PrivacyView} name="Privacy" />
			<Stack.Screen component={routes.SettingsView} name="Settings" />
			<Stack.Screen component={routes.IconSettingsView} name="IconSettings" />
			<Stack.Screen component={routes.SISView} name="SIS" />
			<Stack.Screen
				component={routes.CourseSearchResultsView}
				name="CourseSearchResults"
			/>
			<Stack.Screen component={routes.CourseDetailView} name="CourseDetail" />
			<Stack.Screen component={routes.StreamingView} name="Streaming" />
			<Stack.Screen component={routes.KSTOScheduleView} name="KSTOSchedule" />
			<Stack.Screen component={routes.KRLXScheduleView} name="KRLXSchedule" />
			<Stack.Screen
				component={routes.StudentOrgsDetailView}
				name="StudentOrgsDetail"
			/>
			<Stack.Screen component={routes.StudentOrgsView} name="StudentOrgs" />
			<Stack.Screen
				component={routes.TransportationView}
				name="Transportation"
			/>
			<Stack.Screen
				component={routes.OtherModesDetailView}
				name="OtherModesDetail"
			/>
			<Stack.Screen component={routes.BusMapView} name="BusMap" />
			<Stack.Screen
				component={routes.CarletonBurtonMenuView}
				name="CarletonBurtonMenu"
			/>
			<Stack.Screen
				component={routes.CarletonLDCMenuView}
				name="CarletonLDCMenu"
			/>
			<Stack.Screen
				component={routes.CarletonWeitzMenuView}
				name="CarletonWeitzMenu"
			/>
			<Stack.Screen
				component={routes.CarletonSaylesMenuView}
				name="CarletonSaylesMenu"
			/>
			<Stack.Screen
				component={routes.MenuItemDetailView}
				name="MenuItemDetail"
			/>
			<Stack.Screen component={routes.PrintJobsView} name="PrintJobs" />
			<Stack.Screen component={routes.PrinterListView} name="PrinterList" />
			<Stack.Screen
				component={routes.PrintJobReleaseView}
				name="PrintJobRelease"
			/>
		</Stack.Navigator>
	)
}
