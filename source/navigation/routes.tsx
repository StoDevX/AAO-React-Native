import * as React from 'react'
import {createNativeStackNavigator} from '@react-navigation/native-stack'

import * as home from '../views/home'
import * as buildingHours from '../views/building-hours'
import * as calendar from '../views/calendar'
import {EventDetail as eventDetail} from '@frogpond/event-list'
import * as contacts from '../views/contacts'
import * as dictionary from '../views/dictionary'
import * as faqs from '../views/faqs'
import * as help from '../views/help'
// import {
// 	CourseDetail,
// 	CourseSearchResults,
// 	JobDetail,
// } from '../views/sis'
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
import * as directory from '../views/directory'

// import {
// 	PrinterList,
// 	PrintJobRelease,
// 	PrintJobs,
// } from '../views/stoprint'
import {StyleSheet} from 'react-native'
import {getTheme} from '@frogpond/app-theme'
import {RootStackParamList} from './types'

const theme = getTheme()

const styles = StyleSheet.create({
	header: {
		backgroundColor: theme.navigationBackground,
	},
})

const Stack = createNativeStackNavigator<RootStackParamList>()

export function RootStack(): JSX.Element {
	return (
		<Stack.Navigator
			initialRouteName="Home"
			screenOptions={{
				gestureEnabled: true,
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
					component={eventDetail.EventDetail}
					name="EventDetail"
					options={eventDetail.EventDetailNavigationOptions}
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
				<Stack.Screen
					component={settings.IconSettingsView}
					name="IconSettings"
					options={settings.IconNavigationOptions}
				/>
				<Stack.Screen component={settings.CreditsView} name="Credits" />
				<Stack.Screen component={settings.PrivacyView} name="Privacy" />
				<Stack.Screen component={settings.LegalView} name="Legal" />
				<Stack.Screen component={settings.APITestView} name="APITest" />
				<Stack.Screen component={settings.DebugView} name="Debug" />
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
			{/*
			<Stack.Screen component={JobDetail} name="JobDetail" />
			<Stack.Screen component={Menus} name="Menus" />
			<Stack.Screen component={SIS} name="SIS" />
			<Stack.Screen
				component={CourseSearchResults}
				name="CourseSearchResults"
			/>
			<Stack.Screen component={CourseDetail} name="CourseDetail" />
			</Stack.Group>
			<Stack.Screen component={PrintJobs} name="PrintJobs" />
			<Stack.Screen component={PrinterList} name="PrinterList" />
			<Stack.Screen component={PrintJobRelease} name="PrintJobRelease" /> */}
		</Stack.Navigator>
	)
}
