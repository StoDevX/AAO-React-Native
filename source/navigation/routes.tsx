import React from 'react'

import {createNativeStackNavigator} from '@react-navigation/native-stack'

import {EventDetail as eventDetail} from '@frogpond/event-list'
import {
	DetailNavigationOptions,
	MenuItemDetailView,
} from '@frogpond/food-menu/food-item-detail'
import {toLaxTitleCase} from '@frogpond/titlecase'

import * as buildingHours from '../views/building-hours'
import * as calendar from '../views/calendar'
import * as contacts from '../views/contacts'
import * as dictionary from '../views/dictionary'
import * as directory from '../views/directory'
import * as faqs from '../views/faqs'
import * as home from '../views/home'
import * as menus from '../views/menus'
import * as carletonmenus from '../views/menus/carleton-menus'
import {
	BonAppPickerView as DevBonAppPickerView,
	DevBonAppNavigationOptions,
} from '../views/menus/dev-bonapp-picker'
import * as more from '../views/more'
import * as news from '../views/news'
import * as settings from '../views/settings/'
import {NavigationKey as Debug} from '../views/settings/screens/debug'
import * as sis from '../views/sis'
import * as studentwork from '../views/sis/student-work'
import * as studentworkdetail from '../views/sis/student-work/detail'
import * as stoprint from '../views/stoprint'
import * as streaming from '../views/streaming'
import * as orgs from '../views/student-orgs'
import * as transportation from '../views/transportation'
import {
	ComponentLibraryStackParamList,
	RootStackParamList,
	SettingsStackParamList,
} from './types'

const Stack = createNativeStackNavigator<RootStackParamList>()
const SettingsStack = createNativeStackNavigator<SettingsStackParamList>()
const ComponentLibraryStack =
	createNativeStackNavigator<ComponentLibraryStackParamList>()

const HomeStackScreens = () => {
	return (
		<Stack.Navigator screenOptions={{gestureEnabled: true}}>
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
					component={eventDetail.EventDetail}
					name={eventDetail.NavigationKey}
					options={eventDetail.EventDetailNavigationOptions}
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
					name={buildingHours.ReportNavigationKey}
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
			<Stack.Group>
				<Stack.Screen
					component={dictionary.DictionaryView}
					name="Dictionary"
					options={dictionary.NavigationOptions}
				/>
				<Stack.Screen
					component={dictionary.DictionaryDetailView}
					name="DictionaryDetail"
					options={dictionary.DetailNavigationOptions}
				/>
				<Stack.Screen
					component={dictionary.DictionaryEditorView}
					name="DictionaryEditor"
					options={dictionary.EditorNavigationOptions}
				/>
			</Stack.Group>
			<Stack.Group>
				<Stack.Screen
					component={transportation.View}
					name={transportation.NavigationKey}
					options={transportation.NavigationOptions}
				/>
			</Stack.Group>
			<Stack.Group>
				<Stack.Screen
					component={menus.View}
					name={menus.NavigationKey}
					options={menus.NavigationOptions}
				/>
				<Stack.Screen
					component={menus.CarletonBurtonMenuScreen}
					name="CarletonBurtonMenu"
					options={carletonmenus.BurtonNavigationOptions}
				/>
				<Stack.Screen
					component={menus.CarletonLDCMenuScreen}
					name="CarletonLDCMenu"
					options={carletonmenus.LDCNavigationOptions}
				/>
				<Stack.Screen
					component={menus.CarletonSaylesMenuScreen}
					name="CarletonSaylesMenu"
					options={carletonmenus.SaylesNavigationOptions}
				/>
				<Stack.Screen
					component={menus.CarletonWeitzMenuScreen}
					name="CarletonWeitzMenu"
					options={carletonmenus.WeitzNavigationOptions}
				/>
				<Stack.Screen
					component={MenuItemDetailView}
					name="MenuItemDetail"
					options={DetailNavigationOptions}
				/>
			</Stack.Group>
			<Stack.Group>
				<Stack.Screen
					component={streaming.View}
					name={streaming.NavigationKey}
					options={streaming.NavigationOptions}
				/>
				<Stack.Screen
					component={streaming.KSTOScheduleView}
					name="KSTOSchedule"
					options={streaming.KSTOScheduleNavigationOptions}
				/>
				<Stack.Screen
					component={streaming.KRLXScheduleView}
					name="KRLXSchedule"
					options={streaming.KRLXScheduleNavigationOptions}
				/>
			</Stack.Group>
			<Stack.Group>
				<Stack.Screen
					component={orgs.StudentOrgsView}
					name="StudentOrgs"
					options={orgs.NavigationOptions}
				/>
				<Stack.Screen
					component={orgs.StudentOrgsDetailView}
					name="StudentOrgsDetail"
					options={orgs.DetailNavigationOptions}
				/>
			</Stack.Group>
			<Stack.Group>
				<Stack.Screen
					component={news.View}
					name={news.NavigationKey}
					options={news.NavigationOptions}
				/>
			</Stack.Group>
			<Stack.Group>
				<Stack.Screen
					component={studentwork.View}
					name="Job"
					options={studentwork.NavigationOptions}
				/>
				<Stack.Screen
					component={studentworkdetail.View}
					name="JobDetail"
					options={studentworkdetail.NavigationOptions}
				/>
				<Stack.Screen
					component={sis.View}
					name={sis.NavigationKey}
					options={sis.NavigationOptions}
				/>
				<Stack.Screen
					component={sis.CourseSearchView}
					name="CourseSearch"
					options={sis.CourseSearchViewNavigationOptions}
				/>
				<Stack.Screen
					component={sis.CourseSearchResultsView}
					name="CourseSearchResults"
					options={sis.CourseSearchNavigationOptions}
				/>
				<Stack.Screen
					component={sis.CourseDetailView}
					name="CourseDetail"
					options={sis.CourseSearchDetailNavigationOptions}
				/>
			</Stack.Group>
			<Stack.Group>
				<Stack.Screen
					component={stoprint.PrintJobsView}
					name="PrintJobs"
					options={stoprint.PrintJobsNavigationOptions}
				/>
				<Stack.Screen
					component={stoprint.PrinterListView}
					name="PrinterList"
					options={stoprint.PrinterListNavigationOptions}
				/>
				<Stack.Screen
					component={stoprint.PrintJobReleaseView}
					name="PrintJobRelease"
					options={stoprint.PrintJobReleaseNavigationOptions}
				/>
			</Stack.Group>
			<Stack.Group>
				<Stack.Screen
					component={more.View}
					name="More"
					options={more.NavigationOptions}
				/>
			</Stack.Group>
			<Stack.Group>
				<Stack.Screen
					component={directory.DirectoryView}
					name="Directory"
					options={directory.NavigationOptions}
				/>
				<Stack.Screen
					component={directory.DirectoryDetailView}
					name="DirectoryDetail"
					options={directory.DetailNavigationOptions}
				/>
			</Stack.Group>
		</Stack.Navigator>
	)
}

const SettingsStackScreens = () => {
	return (
		<SettingsStack.Navigator screenOptions={{gestureEnabled: true}}>
			<SettingsStack.Screen
				component={settings.SettingsView}
				name="SettingsRoot"
				options={settings.SettingsNavigationOptions}
			/>
			<SettingsStack.Screen
				component={faqs.View}
				name="Faq"
				options={faqs.NavigationOptions}
			/>
			<SettingsStack.Screen component={settings.CreditsView} name="Credits" />
			<SettingsStack.Screen component={settings.PrivacyView} name="Privacy" />
			<SettingsStack.Screen component={settings.LegalView} name="Legal" />
			<SettingsStack.Screen
				component={settings.APITestView}
				name="APITest"
				options={settings.APITestNavigationOptions}
			/>
			<SettingsStack.Screen
				component={DevBonAppPickerView}
				name="BonAppPicker"
				options={DevBonAppNavigationOptions}
			/>
			<SettingsStack.Screen
				component={settings.DebugRootView}
				name={Debug}
				options={({
					route: {
						params: {keyPath},
					},
				}) => ({title: toLaxTitleCase(keyPath?.[keyPath?.length - 1])})}
			/>
			<SettingsStack.Screen
				component={settings.NetworkLoggerView}
				name="NetworkLogger"
				options={settings.NetworkLoggerNavigationOptions}
			/>
		</SettingsStack.Navigator>
	)
}

const ComponentLibraryStackScreens = () => {
	return (
		<ComponentLibraryStack.Navigator screenOptions={{gestureEnabled: true}}>
			<ComponentLibraryStack.Screen
				component={settings.ComponentLibrary}
				name="ComponentLibraryRoot"
				options={settings.ComponentLibraryNavigationOptions}
			/>
			<ComponentLibraryStack.Screen
				component={settings.BadgeLibrary}
				name="BadgeLibrary"
				options={{title: 'Badges'}}
			/>
			<ComponentLibraryStack.Screen
				component={settings.ButtonLibrary}
				name="ButtonLibrary"
				options={{title: 'Buttons'}}
			/>
			<ComponentLibraryStack.Screen
				component={settings.ColorsLibrary}
				name={settings.ColorsLibraryNavigationKey}
				options={{title: 'Colors'}}
			/>
			<ComponentLibraryStack.Screen
				component={settings.ContextMenuLibrary}
				name="ContextMenuLibrary"
				options={{title: 'Context Menus'}}
			/>
		</ComponentLibraryStack.Navigator>
	)
}

export const RootStack = (): JSX.Element => (
	<Stack.Navigator initialRouteName="Home" screenOptions={{headerShown: false}}>
		<Stack.Screen component={HomeStackScreens} name="HomeRoot" />
		<SettingsStack.Screen
			component={SettingsStackScreens}
			name="Settings"
			options={{presentation: 'modal'}}
		/>
		<ComponentLibraryStack.Screen
			component={ComponentLibraryStackScreens}
			name="ComponentLibrary"
			options={{presentation: 'modal'}}
		/>
	</Stack.Navigator>
)
