import React from 'react'
import {createNativeStackNavigator} from '@react-navigation/native-stack'

import * as buildingHours from '../../views/building-hours'
import * as calendar from '../../views/calendar'
import {EventDetail as eventDetail} from '@frogpond/event-list'
import * as contacts from '../../views/contacts'
import * as dictionary from '../../views/dictionary'
import * as faqs from '../../views/faqs'
import * as sis from '../../views/sis'
import * as studentwork from '../../views/sis/student-work'
import * as studentworkdetail from '../../views/sis/student-work/detail'
import * as menus from '../../views/menus'
import * as carletonmenus from '../../views/menus/carleton-menus'
import {
	DetailNavigationOptions,
	MenuItemDetailView,
} from '@frogpond/food-menu/food-item-detail'
import * as news from '../../views/news'
import * as reddit from '../../views/reddit'
import * as streaming from '../../views/streaming'
import * as orgs from '../../views/student-orgs'
import * as transportation from '../../views/transportation'
import {BusRouteDetail} from '../../views/transportation/bus/detail'
import * as stoprint from '../../views/stoprint'
import * as more from '../../views/more'
import * as directory from '../../views/directory'

import {RootStackParamList} from '../types'

// One factory, reused by every tab navigator. Each <Stack.Navigator> render
// creates an independent navigator instance, so screen names only need to be
// unique within a single tab's stack.
export const Stack = createNativeStackNavigator<RootStackParamList>()

export const calendarScreens = (): React.ReactElement => (
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
)

export const buildingHoursScreens = (): React.ReactElement => (
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
)

export const transportationScreens = (): React.ReactElement => (
	<Stack.Group>
		<Stack.Screen
			component={transportation.View}
			name={transportation.NavigationKey}
			options={transportation.NavigationOptions}
		/>
		<Stack.Screen
			component={BusRouteDetail}
			name="BusRouteDetail"
			options={({route}) => ({
				title: `${route.params.line.line} Schedule`,
			})}
		/>
	</Stack.Group>
)

export const menuScreens = (): React.ReactElement => (
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
)

export const sisScreens = (): React.ReactElement => (
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
			initialParams={{initialFilters: [], initialQuery: ''}}
			name="CourseSearchResults"
			options={sis.CourseSearchNavigationOptions}
		/>
		<Stack.Screen
			component={sis.CourseDetailView}
			name="CourseDetail"
			options={sis.CourseSearchDetailNavigationOptions}
		/>
	</Stack.Group>
)

export const streamingScreens = (): React.ReactElement => (
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
)

export const contactsScreens = (): React.ReactElement => (
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
)

export const dictionaryScreens = (): React.ReactElement => (
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
)

export const orgsScreens = (): React.ReactElement => (
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
)

export const newsScreens = (): React.ReactElement => (
	<Stack.Group>
		<Stack.Screen
			component={news.View}
			name={news.NavigationKey}
			options={news.NavigationOptions}
		/>
	</Stack.Group>
)

export const redditScreens = (): React.ReactElement => (
	<Stack.Group>
		<Stack.Screen
			component={reddit.View}
			name={reddit.NavigationKey}
			options={reddit.NavigationOptions}
		/>
		<Stack.Screen
			component={reddit.PostDetailView}
			name={reddit.PostDetailNavigationKey}
			options={reddit.PostDetailNavigationOptions}
		/>
	</Stack.Group>
)

export const stoprintScreens = (): React.ReactElement => (
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
)

export const moreScreens = (): React.ReactElement => (
	<Stack.Group>
		<Stack.Screen
			component={more.View}
			name="More"
			options={more.NavigationOptions}
		/>
	</Stack.Group>
)

export const directoryScreens = (): React.ReactElement => (
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
)

export const faqScreens = (): React.ReactElement => (
	<Stack.Group>
		<Stack.Screen
			component={faqs.View}
			name="Faq"
			options={faqs.NavigationOptions}
		/>
	</Stack.Group>
)
