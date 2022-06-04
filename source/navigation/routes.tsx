import * as React from 'react'
import {
	createNativeStackNavigator,
	NativeStackNavigationOptions,
} from '@react-navigation/native-stack'

import * as home from '../views/home'
import * as buildingHours from '../views/building-hours'
import * as calendar from '../views/calendar'
import {EventDetail as eventDetail} from '@frogpond/event-list'
import * as contacts from '../views/contacts'
import * as dictionary from '../views/dictionary'
import * as faqs from '../views/faqs'
import * as help from '../views/help'
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
	MenuItemDetailView,
	DetailNavigationOptions,
} from '@frogpond/food-menu/food-item-detail'
import * as news from '../views/news'
import * as settings from '../views/settings/'
// import SISView from '../views/sis'
import * as streaming from '../views/streaming'
import * as orgs from '../views/student-orgs'
import * as transportation from '../views/transportation'
import * as othermodes from '../views/transportation/other-modes'
import * as stoprint from '../views/stoprint'
import {StyleSheet} from 'react-native'
import {getTheme} from '@frogpond/app-theme'
import {RootStackParamList, SettingsStackParamList} from './types'

const theme = getTheme()

const styles = StyleSheet.create({
	header: {
		backgroundColor: theme.navigationBackground,
	},
})

const styledScreenOptions: NativeStackNavigationOptions = {
	gestureEnabled: true,
	headerStyle: styles.header,
	headerTintColor: theme.navigationForeground,
}

const Stack = createNativeStackNavigator<RootStackParamList>()
const SettingsStack = createNativeStackNavigator<SettingsStackParamList>()

const HomeStackScreens = () => (
	<Stack.Navigator screenOptions={styledScreenOptions}>
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
				name="EventDetail"
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
				name="Transportation"
				options={transportation.NavigationOptions}
			/>
			<Stack.Screen
				component={transportation.OtherModesDetailView}
				name="OtherModesDetail"
				options={othermodes.OtherModesNavigationOptions}
			/>
		</Stack.Group>
		<Stack.Group>
			<Stack.Screen
				component={DevBonAppPickerView}
				name="BonAppPicker"
				options={DevBonAppNavigationOptions}
			/>
			<Stack.Screen
				component={menus.View}
				name="Menus"
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
				name="Streaming"
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
		<Stack.Screen
			component={help.HelpView}
			name="Help"
			options={help.NavigationOptions}
		/>
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
				name="News"
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
				name="SIS"
				options={sis.NavigationOptions}
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
	</Stack.Navigator>
)

const SettingsStackScreens = () => (
	<SettingsStack.Navigator screenOptions={styledScreenOptions}>
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
		</SettingsStack.Group>

		{/* developer */}
		<SettingsStack.Group>
			<SettingsStack.Screen component={settings.APITestView} name="APITest" />
			<SettingsStack.Screen component={settings.DebugView} name="Debug" />
		</SettingsStack.Group>
	</SettingsStack.Navigator>
)

export const RootStack = (): JSX.Element => (
	<Stack.Navigator
		initialRouteName="Home"
		screenOptions={{
			headerShown: false,
		}}
	>
		<Stack.Screen component={HomeStackScreens} name="HomeRoot" />
		<SettingsStack.Screen
			component={SettingsStackScreens}
			name="Settings"
			options={{presentation: 'modal'}}
		/>
	</Stack.Navigator>
)
