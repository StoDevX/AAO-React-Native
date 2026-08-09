import React from 'react'
import {createNativeStackNavigator} from '@react-navigation/native-stack'

import * as home from '../views/home'
import * as buildingHours from '../views/building-hours'
import * as calendar from '../views/calendar'
import {EventDetail as eventDetail} from '@frogpond/event-list'
import * as contacts from '../views/contacts'
import * as dictionary from '../views/dictionary'
import * as faqs from '../views/faqs'
import * as sis from '../views/sis'
import * as studentwork from '../views/sis/student-work'
import * as studentworkdetail from '../views/sis/student-work/detail'
import * as menus from '../views/menus'
import * as carletonmenus from '../views/menus/carleton-menus'
import {
	BonAppPickerView as DevBonAppPickerView,
	DevBonAppNavigationOptions,
} from '../views/menus/dev-bonapp-picker'
import {
	DetailNavigationOptions,
	MenuItemDetailView,
} from '@frogpond/food-menu/food-item-detail'
import * as news from '../views/news'
import * as reddit from '../views/reddit'
import * as settings from '../views/settings/'
import * as streaming from '../views/streaming'
import * as orgs from '../views/student-orgs'
import * as transportation from '../views/transportation'
import {BusRouteDetail} from '../views/transportation/bus/detail'
import * as stoprint from '../views/stoprint'
import * as more from '../views/more'
import * as directory from '../views/directory'

import {
	RootStackParamList,
	SettingsStackParamList,
	ComponentLibraryStackParamList,
} from './types'
import {NavigationKey as Debug} from '../views/settings/screens/debug'
import {toLaxTitleCase} from '@frogpond/titlecase'
import {headerColorsFor} from './header-colors'

const Stack = createNativeStackNavigator<RootStackParamList>()
const SettingsStack = createNativeStackNavigator<SettingsStackParamList>()
const ComponentLibraryStack =
	createNativeStackNavigator<ComponentLibraryStackParamList>()

const HomeStackScreens = () => {
	return (
		<Stack.Navigator
			screenOptions={{gestureEnabled: true, headerBackTitle: ''}}
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
					options={{
						...calendar.NavigationOptions,
						...headerColorsFor(calendar.NavigationKey),
					}}
				/>
				<Stack.Screen
					component={eventDetail.EventDetail}
					name={eventDetail.NavigationKey}
					options={{
						...eventDetail.EventDetailNavigationOptions,
						...headerColorsFor(calendar.NavigationKey),
					}}
				/>
			</Stack.Group>
			<Stack.Group>
				<Stack.Screen
					component={buildingHours.BuildingHoursDetailView}
					name="BuildingHoursDetail"
					options={{
						...buildingHours.DetailNavigationOptions,
						...headerColorsFor('BuildingHours'),
					}}
				/>
				<Stack.Screen
					component={buildingHours.BuildingHoursView}
					name="BuildingHours"
					options={{
						...buildingHours.NavigationOptions,
						...headerColorsFor('BuildingHours'),
					}}
				/>
				<Stack.Screen
					component={buildingHours.BuildingHoursProblemReportView}
					name={buildingHours.ReportNavigationKey}
					options={{
						...buildingHours.ReportNavigationOptions,
						...headerColorsFor('BuildingHours'),
					}}
				/>
				<Stack.Screen
					component={buildingHours.BuildingHoursScheduleEditorView}
					name="BuildingHoursScheduleEditor"
					options={{
						...buildingHours.EditorNavigationOptions,
						...headerColorsFor('BuildingHours'),
					}}
				/>
			</Stack.Group>
			<Stack.Group>
				<Stack.Screen
					component={contacts.ContactsView}
					name="Contacts"
					options={{
						...contacts.NavigationOptions,
						...headerColorsFor('Contacts'),
					}}
				/>
				<Stack.Screen
					component={contacts.ContactsDetailView}
					name="ContactsDetail"
					options={{
						...contacts.DetailNavigationOptions,
						...headerColorsFor('Contacts'),
					}}
				/>
			</Stack.Group>
			<Stack.Group>
				<Stack.Screen
					component={dictionary.DictionaryView}
					name="Dictionary"
					options={{
						...dictionary.NavigationOptions,
						...headerColorsFor('Dictionary'),
					}}
				/>
				<Stack.Screen
					component={dictionary.DictionaryDetailView}
					name="DictionaryDetail"
					options={{
						...dictionary.DetailNavigationOptions,
						...headerColorsFor('Dictionary'),
					}}
				/>
				<Stack.Screen
					component={dictionary.DictionaryEditorView}
					name="DictionaryEditor"
					options={{
						...dictionary.EditorNavigationOptions,
						...headerColorsFor('Dictionary'),
					}}
				/>
			</Stack.Group>
			<Stack.Group>
				<Stack.Screen
					component={transportation.View}
					name={transportation.NavigationKey}
					options={{
						...transportation.NavigationOptions,
						...headerColorsFor(transportation.NavigationKey),
					}}
				/>
				<Stack.Screen
					component={BusRouteDetail}
					name="BusRouteDetail"
					options={({route}) => ({
						title: `${route.params.line.line} Schedule`,
						...headerColorsFor(transportation.NavigationKey),
					})}
				/>
			</Stack.Group>
			<Stack.Group>
				<Stack.Screen
					component={menus.View}
					name={menus.NavigationKey}
					options={{
						...menus.NavigationOptions,
						...headerColorsFor(menus.NavigationKey),
					}}
				/>
				<Stack.Screen
					component={menus.CarletonBurtonMenuScreen}
					name="CarletonBurtonMenu"
					options={{
						...carletonmenus.BurtonNavigationOptions,
						...headerColorsFor(menus.NavigationKey),
					}}
				/>
				<Stack.Screen
					component={menus.CarletonLDCMenuScreen}
					name="CarletonLDCMenu"
					options={{
						...carletonmenus.LDCNavigationOptions,
						...headerColorsFor(menus.NavigationKey),
					}}
				/>
				<Stack.Screen
					component={menus.CarletonSaylesMenuScreen}
					name="CarletonSaylesMenu"
					options={{
						...carletonmenus.SaylesNavigationOptions,
						...headerColorsFor(menus.NavigationKey),
					}}
				/>
				<Stack.Screen
					component={menus.CarletonWeitzMenuScreen}
					name="CarletonWeitzMenu"
					options={{
						...carletonmenus.WeitzNavigationOptions,
						...headerColorsFor(menus.NavigationKey),
					}}
				/>
				<Stack.Screen
					component={MenuItemDetailView}
					name="MenuItemDetail"
					options={{
						...DetailNavigationOptions,
						...headerColorsFor(menus.NavigationKey),
					}}
				/>
			</Stack.Group>
			<Stack.Group>
				<Stack.Screen
					component={streaming.View}
					name={streaming.NavigationKey}
					options={{
						...streaming.NavigationOptions,
						...headerColorsFor(streaming.NavigationKey),
					}}
				/>
				<Stack.Screen
					component={streaming.KSTOScheduleView}
					name="KSTOSchedule"
					options={{
						...streaming.KSTOScheduleNavigationOptions,
						...headerColorsFor(streaming.NavigationKey),
					}}
				/>
				<Stack.Screen
					component={streaming.KRLXScheduleView}
					name="KRLXSchedule"
					options={{
						...streaming.KRLXScheduleNavigationOptions,
						...headerColorsFor(streaming.NavigationKey),
					}}
				/>
			</Stack.Group>
			<Stack.Group>
				<Stack.Screen
					component={orgs.StudentOrgsView}
					name="StudentOrgs"
					options={{
						...orgs.NavigationOptions,
						...headerColorsFor('StudentOrgs'),
					}}
				/>
				<Stack.Screen
					component={orgs.StudentOrgsDetailView}
					name="StudentOrgsDetail"
					options={{
						...orgs.DetailNavigationOptions,
						...headerColorsFor('StudentOrgs'),
					}}
				/>
			</Stack.Group>
			<Stack.Group>
				<Stack.Screen
					component={news.View}
					name={news.NavigationKey}
					options={{
						...news.NavigationOptions,
						...headerColorsFor(news.NavigationKey),
					}}
				/>
			</Stack.Group>
			<Stack.Group>
				<Stack.Screen
					component={reddit.View}
					name={reddit.NavigationKey}
					options={{
						...reddit.NavigationOptions,
						...headerColorsFor(reddit.NavigationKey),
					}}
				/>
				<Stack.Screen
					component={reddit.PostDetailView}
					name={reddit.PostDetailNavigationKey}
					options={{
						...reddit.PostDetailNavigationOptions,
						...headerColorsFor(reddit.NavigationKey),
					}}
				/>
			</Stack.Group>
			<Stack.Group>
				<Stack.Screen
					component={studentwork.View}
					name="Job"
					options={{
						...studentwork.NavigationOptions,
						...headerColorsFor(sis.NavigationKey),
					}}
				/>
				<Stack.Screen
					component={studentworkdetail.View}
					name="JobDetail"
					options={{
						...studentworkdetail.NavigationOptions,
						...headerColorsFor(sis.NavigationKey),
					}}
				/>
				<Stack.Screen
					component={sis.View}
					name={sis.NavigationKey}
					options={{
						...sis.NavigationOptions,
						...headerColorsFor(sis.NavigationKey),
					}}
				/>
				<Stack.Screen
					component={sis.CourseSearchView}
					name="CourseSearch"
					options={{
						...sis.CourseSearchViewNavigationOptions,
						...headerColorsFor(sis.NavigationKey),
					}}
				/>
				<Stack.Screen
					component={sis.CourseSearchResultsView}
					initialParams={{initialFilters: [], initialQuery: ''}}
					name="CourseSearchResults"
					options={{
						...sis.CourseSearchNavigationOptions,
						...headerColorsFor(sis.NavigationKey),
					}}
				/>
				<Stack.Screen
					component={sis.CourseDetailView}
					name="CourseDetail"
					options={{
						...sis.CourseSearchDetailNavigationOptions,
						...headerColorsFor(sis.NavigationKey),
					}}
				/>
			</Stack.Group>
			<Stack.Group>
				<Stack.Screen
					component={stoprint.PrintJobsView}
					name="PrintJobs"
					options={{
						...stoprint.PrintJobsNavigationOptions,
						...headerColorsFor('PrintJobs'),
					}}
				/>
				<Stack.Screen
					component={stoprint.PrinterListView}
					name="PrinterList"
					options={{
						...stoprint.PrinterListNavigationOptions,
						...headerColorsFor('PrintJobs'),
					}}
				/>
				<Stack.Screen
					component={stoprint.PrintJobReleaseView}
					name="PrintJobRelease"
					options={{
						...stoprint.PrintJobReleaseNavigationOptions,
						...headerColorsFor('PrintJobs'),
					}}
				/>
			</Stack.Group>
			<Stack.Group>
				<Stack.Screen
					component={more.View}
					name="More"
					options={{
						...more.NavigationOptions,
						...headerColorsFor('More'),
					}}
				/>
			</Stack.Group>
			<Stack.Group>
				<Stack.Screen
					component={directory.DirectoryView}
					name="Directory"
					options={{
						...directory.NavigationOptions,
						...headerColorsFor('Directory'),
					}}
				/>
				<Stack.Screen
					component={directory.DirectoryDetailView}
					name="DirectoryDetail"
					options={{
						...directory.DetailNavigationOptions,
						...headerColorsFor('Directory'),
					}}
				/>
			</Stack.Group>
			<Stack.Group>
				<Stack.Screen
					component={faqs.View}
					name="Faq"
					options={{
						...faqs.NavigationOptions,
						...headerColorsFor('Faq'),
					}}
				/>
			</Stack.Group>
		</Stack.Navigator>
	)
}

const SettingsStackScreens = () => {
	return (
		<SettingsStack.Navigator
			screenOptions={{gestureEnabled: true, headerBackTitle: ''}}
		>
			{/* user */}
			<SettingsStack.Group>
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
					component={settings.ReportProblemView}
					name="ReportProblem"
					options={settings.ReportProblemNavigationOptions}
				/>
			</SettingsStack.Group>

			{/* developer */}
			<SettingsStack.Group>
				<SettingsStack.Screen
					component={settings.APITestView}
					name="APITest"
					options={settings.APITestNavigationOptions}
				/>
				<SettingsStack.Screen
					component={settings.APITestDetailView}
					name="APITestDetail"
					options={settings.APITestDetailNavigationOptions}
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
				<SettingsStack.Screen
					component={settings.BannerBuilderView}
					name="BannerBuilder"
					options={settings.BannerBuilderNavigationOptions}
				/>
			</SettingsStack.Group>
		</SettingsStack.Navigator>
	)
}

const ComponentLibraryStackScreens = () => {
	return (
		<ComponentLibraryStack.Navigator
			screenOptions={{gestureEnabled: true, headerBackTitle: ''}}
		>
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
			<ComponentLibraryStack.Screen
				component={settings.FaqBannerLibrary}
				name="FaqBannerLibrary"
				options={settings.FaqBannerNavigationOptions}
			/>
		</ComponentLibraryStack.Navigator>
	)
}

export const RootStack = (): React.ReactNode => (
	<Stack.Navigator
		initialRouteName="HomeRoot"
		screenOptions={{headerShown: false}}
	>
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
