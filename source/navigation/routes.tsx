import React from 'react'
import {createNativeStackNavigator} from '@react-navigation/native-stack'

import {HomeView} from '../views/home'
import {BuildingHoursDetailView} from '../views/building-hours/detail'
import {
	BuildingHoursProblemReportView,
	BuildingHoursScheduleEditorView,
	BuildingHoursView,
} from '../views/building-hours'
import CalendarView from '../views/calendar'
import {EventDetail as EventDetailView} from '@frogpond/event-list'
import {ContactsDetailView, ContactsView} from '../views/contacts'
import {
	DictionaryDetailView,
	DictionaryEditorView,
	DictionaryView,
} from '../views/dictionary'
import {FaqView} from '../views/faqs'
import {HelpView} from '../views/help'
import {
	CourseDetailView,
	CourseSearchResultsView,
	JobDetailView,
} from '../views/sis'
import {
	CarletonBurtonMenuScreen,
	CarletonLDCMenuScreen,
	CarletonSaylesMenuScreen,
	CarletonWeitzMenuScreen,
	MenusView,
} from '../views/menus'
import {BonAppPickerView} from '../views/menus/dev-bonapp-picker'
import {MenuItemDetailView} from '@frogpond/food-menu/food-item-detail'
import NewsView from '../views/news'
import {
	SettingsView,
	IconSettingsView,
	CreditsView,
	DebugView,
	LegalView,
	PrivacyView,
	APITestView,
} from '../views/settings'
import SISView from '../views/sis'
import StreamingView, {
	KRLXScheduleView,
	KSTOScheduleView,
} from '../views/streaming'
import {StudentOrgsDetailView, StudentOrgsView} from '../views/student-orgs'
import TransportationView, {OtherModesDetailView} from '../views/transportation'
import {
	PrinterListView,
	PrintJobReleaseView,
	PrintJobsView,
} from '../views/stoprint'

import {Platform, StyleSheet} from 'react-native'
import * as c from '@frogpond/colors'
import {getTheme} from '@frogpond/app-theme'

const theme = getTheme()

const styles = StyleSheet.create({
	header: {
		backgroundColor: theme.navigationBackground,
	},
	card: {
		backgroundColor: c.sectionBgColor,
	},
})

type RootStackParamList = {
	Home: undefined
	Profile: {userId: string}
	Feed: {sort: 'latest' | 'top'} | undefined
	BuildingHoursDetailView: undefined
	BuildingHoursView: undefined
	BuildingHoursProblemReportView: undefined
	BuildingHoursScheduleEditorView: undefined
	CalendarView: undefined
	ContactsView: undefined
	ContactsDetailView: undefined
	CreditsView: undefined
	DebugView: undefined
	APITestView: undefined
	DictionaryDetailView: undefined
	DictionaryView: undefined
	DictionaryEditorView: undefined
	EventDetailView: undefined
	FaqView: undefined
	HelpView: undefined
	JobDetailView: undefined
	LegalView: undefined
	MenusView: undefined
	BonAppPickerView: undefined
	NewsView: undefined
	PrivacyView: undefined
	SettingsView: undefined
	IconSettingsView: undefined
	SISView: undefined
	CourseSearchResultsView: undefined
	CourseDetailView: undefined
	StreamingView: undefined
	KSTOScheduleView: undefined
	KRLXScheduleView: undefined
	StudentOrgsDetailView: undefined
	StudentOrgsView: undefined
	TransportationView: undefined
	OtherModesDetailView: undefined
	CarletonBurtonMenuView: undefined
	CarletonLDCMenuView: undefined
	CarletonWeitzMenuView: undefined
	CarletonSaylesMenuView: undefined
	MenuItemDetailView: undefined
	PrintJobsView: undefined
	PrinterListView: undefined
	PrintJobReleaseView: undefined
}

const Stack = createNativeStackNavigator<RootStackParamList>()

export function RootStack() {
	return (
		<Stack.Navigator
			initialRouteName="Home"
			screenOptions={{
				gestureEnabled: false,
				headerStyle: styles.header,
				headerTintColor: theme.navigationForeground,
			}}
		>
			<Stack.Screen name="Home" component={HomeView} />
			<Stack.Screen
				name="BuildingHoursDetailView"
				component={BuildingHoursDetailView}
			/>
			<Stack.Screen name="BuildingHoursView" component={BuildingHoursView} />
			<Stack.Screen
				name="BuildingHoursProblemReportView"
				component={BuildingHoursProblemReportView}
			/>
			<Stack.Screen
				name="BuildingHoursScheduleEditorView"
				component={BuildingHoursScheduleEditorView}
			/>
			<Stack.Screen name="CalendarView" component={CalendarView} options={{title: 'Calendar', headerBackTitle: 'Back'}} />
			<Stack.Screen name="ContactsView" component={ContactsView} />
			<Stack.Screen name="ContactsDetailView" component={ContactsDetailView} />
			<Stack.Screen name="CreditsView" component={CreditsView} />
			<Stack.Screen name="DebugView" component={DebugView} />
			<Stack.Screen name="APITestView" component={APITestView} />
			<Stack.Screen
				name="DictionaryDetailView"
				component={DictionaryDetailView}
			/>
			<Stack.Screen name="DictionaryView" component={DictionaryView} />
			<Stack.Screen
				name="DictionaryEditorView"
				component={DictionaryEditorView}
			/>
			<Stack.Screen name="EventDetailView" component={EventDetailView} />
			<Stack.Screen name="FaqView" component={FaqView} />
			<Stack.Screen name="HelpView" component={HelpView} />
			<Stack.Screen name="JobDetailView" component={JobDetailView} />
			<Stack.Screen name="LegalView" component={LegalView} />
			<Stack.Screen name="MenusView" component={MenusView} />
			<Stack.Screen name="BonAppPickerView" component={BonAppPickerView} />
			<Stack.Screen name="NewsView" component={NewsView} />
			<Stack.Screen name="PrivacyView" component={PrivacyView} />
			<Stack.Screen name="SettingsView" component={SettingsView} />
			<Stack.Screen name="IconSettingsView" component={IconSettingsView} />
			<Stack.Screen name="SISView" component={SISView} />
			<Stack.Screen
				name="CourseSearchResultsView"
				component={CourseSearchResultsView}
			/>
			<Stack.Screen name="CourseDetailView" component={CourseDetailView} />
			<Stack.Screen name="StreamingView" component={StreamingView} />
			<Stack.Screen name="KSTOScheduleView" component={KSTOScheduleView} />
			<Stack.Screen name="KRLXScheduleView" component={KRLXScheduleView} />
			<Stack.Screen
				name="StudentOrgsDetailView"
				component={StudentOrgsDetailView}
			/>
			<Stack.Screen name="StudentOrgsView" component={StudentOrgsView} />
			<Stack.Screen name="TransportationView" component={TransportationView} />
			<Stack.Screen
				name="OtherModesDetailView"
				component={OtherModesDetailView}
			/>
			<Stack.Screen
				name="CarletonBurtonMenuView"
				component={CarletonBurtonMenuScreen}
			/>
			<Stack.Screen
				name="CarletonLDCMenuView"
				component={CarletonLDCMenuScreen}
			/>
			<Stack.Screen
				name="CarletonWeitzMenuView"
				component={CarletonWeitzMenuScreen}
			/>
			<Stack.Screen
				name="CarletonSaylesMenuView"
				component={CarletonSaylesMenuScreen}
			/>
			<Stack.Screen name="MenuItemDetailView" component={MenuItemDetailView} />
			<Stack.Screen name="PrintJobsView" component={PrintJobsView} />
			<Stack.Screen name="PrinterListView" component={PrinterListView} />
			<Stack.Screen
				name="PrintJobReleaseView"
				component={PrintJobReleaseView}
			/>
		</Stack.Navigator>
	)
}
