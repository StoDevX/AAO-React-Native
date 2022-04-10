import React from 'react'
import {createNativeStackNavigator} from '@react-navigation/native-stack'

import * as home from '../views/home'
// import {BuildingHoursDetailView} from '../views/building-hours/detail'
// import {
// 	BuildingHoursProblemReport,
// 	BuildingHoursScheduleEditor,
// 	BuildingHours,
// } from '../views/building-hours'
import * as buildingHours from '../views/building-hours'
import * as calendar from '../views/calendar'
import {EventDetail as eventDetail} from '@frogpond/event-list'
import * as contacts from '../views/contacts'
// import {
// 	DictionaryDetail,
// 	DictionaryEditor,
// 	Dictionary,
// } from '../views/dictionary'
import * as faqs from '../views/faqs'
// import {Help} from '../views/help'
// import {
// 	CourseDetail,
// 	CourseSearchResults,
// 	JobDetail,
// } from '../views/sis'
// import {
// 	CarletonBurtonMenuScreen,
// 	CarletonLDCMenuScreen,
// 	CarletonSaylesMenuScreen,
// 	CarletonWeitzMenuScreen,
// 	Menus,
// } from '../views/menus'
// import {BonAppPicker} from '../views/menus/dev-bonapp-picker'
// import {MenuItemDetail} from '@frogpond/food-menu/food-item-detail'
// import NewsView from '../views/news'
import * as settings from '../views/settings/'
// import {
// 	Settings,
// 	IconSettings,
// 	Credits,
// 	Debug,
// 	Legal,
// 	Privacy,
// 	APITest,
// } from '../views/settings'
// import SISView from '../views/sis'
// import Streaming, {
// 	KRLXSchedule,
// 	KSTOSchedule,
// } from '../views/streaming'
// import {StudentOrgsDetail, StudentOrgs} from '../views/student-orgs'
// import Transportation, {OtherModesDetail} from '../views/transportation'
// import {
// 	PrinterList,
// 	PrintJobRelease,
// 	PrintJobs,
// } from '../views/stoprint'

import {StyleSheet} from 'react-native'
import {getTheme} from '@frogpond/app-theme'

const theme = getTheme()

const styles = StyleSheet.create({
	header: {
		backgroundColor: theme.navigationBackground,
	},
})

import {RootStackParamList} from './types'

const Stack = createNativeStackNavigator<RootStackParamList>()

export function RootStack(): JSX.Element {
	return (
		<Stack.Navigator
			initialRouteName="Home"
			screenOptions={{
				gestureEnabled: false,
				headerStyle: styles.header,
				headerTintColor: theme.navigationForeground,
			}}
		>
			<Stack.Screen
				component={home.View}
				name="Home"
				options={home.NavigationOptions}
			/>
			<Stack.Group>
				<Stack.Screen
					component={calendar.View}
					name={calendar.NavigationKey}
					options={calendar.NavigationOptions}
				/>
				<Stack.Screen
					component={eventDetail.View}
					name="EventDetail"
					options={eventDetail.NavigationOptions}
				/>
			</Stack.Group>
			<Stack.Group>
				<Stack.Screen
					component={settings.SettingsView}
					name="Settings"
					options={settings.SettingsNavigationOptions}
				/>
				<Stack.Screen
					component={faqs.View}
					name="Faq"
					options={faqs.NavigationOptions}
				/>
			</Stack.Group>
			<Stack.Group>
				<Stack.Screen
					component={buildingHours.BuildingHoursDetailView}
					name="BuildingHoursDetail"
					options={buildingHours.DetailNavigationOptions}
				/>
				<Stack.Screen
					component={buildingHours.BuildingHoursView}
					name="BuildingHours"
					options={buildingHours.NavigationOptions}
				/>
				<Stack.Screen
					component={buildingHours.BuildingHoursProblemReportView}
					name="BuildingHoursProblemReport"
					options={buildingHours.ReportNavigationOptions}
				/>
				<Stack.Screen
					component={buildingHours.BuildingHoursScheduleEditorView}
					name="BuildingHoursScheduleEditor"
					options={buildingHours.EditorNavigationOptions}
				/>
			</Stack.Group>
			<Stack.Group>
				<Stack.Screen
					component={contacts.ContactsView}
					name="Contacts"
					options={contacts.NavigationOptions}
				/>
				<Stack.Screen
					component={contacts.ContactsDetailView}
					name="ContactsDetail"
					options={contacts.DetailNavigationOptions}
				/>
			</Stack.Group>
			{/*
			<Stack.Screen component={Credits} name="Credits" />
			<Stack.Screen component={Debug} name="Debug" />
			<Stack.Screen component={APITest} name="APITest" />
			<Stack.Screen component={DictionaryDetail} name="DictionaryDetail" />
			<Stack.Screen component={Dictionary} name="Dictionary" />
			<Stack.Screen component={DictionaryEditor} name="DictionaryEditor" />
			<Stack.Screen component={EventDetail} name="EventDetail" />
			<Stack.Screen component={Help} name="Help" />
			<Stack.Screen component={JobDetail} name="JobDetail" />
			<Stack.Screen component={Legal} name="Legal" />
			<Stack.Screen component={Menus} name="Menus" />
			<Stack.Screen component={BonAppPicker} name="BonAppPicker" />
			<Stack.Screen component={News} name="News" />
			<Stack.Screen component={Privacy} name="Privacy" />
			<Stack.Screen component={IconSettings} name="IconSettings" />
			<Stack.Screen component={SIS} name="SIS" />
			<Stack.Screen
				component={CourseSearchResults}
				name="CourseSearchResults"
			/>
			<Stack.Screen component={CourseDetail} name="CourseDetail" />
			<Stack.Screen component={Streaming} name="Streaming" />
			<Stack.Screen component={KSTOSchedule} name="KSTOSchedule" />
			<Stack.Screen component={KRLXSchedule} name="KRLXSchedule" />
			<Stack.Screen component={StudentOrgsDetail} name="StudentOrgsDetail" />
			<Stack.Screen component={StudentOrgs} name="StudentOrgs" />
			<Stack.Screen component={Transportation} name="Transportation" />
			<Stack.Screen component={OtherModesDetail} name="OtherModesDetail" />
			<Stack.Screen
				component={CarletonBurtonMenuScreen}
				name="CarletonBurtonMenu"
			/>
			<Stack.Screen component={CarletonLDCMenuScreen} name="CarletonLDCMenu" />
			<Stack.Screen
				component={CarletonWeitzMenuScreen}
				name="CarletonWeitzMenu"
			/>
			<Stack.Screen
				component={CarletonSaylesMenuScreen}
				name="CarletonSaylesMenu"
			/>
			<Stack.Screen component={MenuItemDetail} name="MenuItemDetail" />
			<Stack.Screen component={PrintJobs} name="PrintJobs" />
			<Stack.Screen component={PrinterList} name="PrinterList" />
			<Stack.Screen component={PrintJobRelease} name="PrintJobRelease" /> */}
		</Stack.Navigator>
	)
}
