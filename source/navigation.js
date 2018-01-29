// @flow

import {Platform} from 'react-native'
import {StackNavigator} from 'react-navigation'
import * as c from './views/components/colors'

import CalendarView, {EventDetail as EventDetailView} from './views/calendar'
import {ContactsView, ContactsDetailView} from './views/contacts'
import {DictionaryView, DictionaryDetailView} from './views/dictionary'
import {HomeView, EditHomeView} from './views/home'
import StreamingView, {
	KSTOScheduleView,
	KRLXScheduleView,
} from './views/streaming'
import {
	MenusView,
	CarletonBurtonMenuScreen,
	CarletonLDCMenuScreen,
	CarletonWeitzMenuScreen,
	CarletonSaylesMenuScreen,
} from './views/menus'
import {FilterView} from './views/components/filter'
import NewsView from './views/news'
import SISView from './views/sis'
import {JobDetailView} from './views/sis/student-work/detail'
import {
	BuildingHoursView,
	BuildingHoursDetailView,
	BuildingHoursProblemReportView,
	BuildingHoursScheduleEditorView,
} from './views/building-hours'
import TransportationView, {
	BusMap as BusMapView,
	OtherModesDetailView,
} from './views/transportation'
import SettingsView from './views/settings'
import CreditsView from './views/settings/credits'
import PrivacyView from './views/settings/privacy'
import LegalView from './views/settings/legal'
import {IconSettingsView} from './views/settings/icon'
import {StudentOrgsView, StudentOrgsDetailView} from './views/student-orgs'
import {FaqView} from './views/faqs'
import HelpView from './views/help'

export const AppNavigator = StackNavigator(
	{
		StreamingView: {screen: StreamingView},
		HomeView: {screen: HomeView},
		BuildingHoursDetailView: {screen: BuildingHoursDetailView},
		BuildingHoursView: {screen: BuildingHoursView},
		BuildingHoursProblemReportView: {screen: BuildingHoursProblemReportView},
		BuildingHoursScheduleEditorView: {screen: BuildingHoursScheduleEditorView},
		CalendarView: {screen: CalendarView},
		ContactsView: {screen: ContactsView},
		ContactsDetailView: {screen: ContactsDetailView},
		CreditsView: {screen: CreditsView},
		DictionaryDetailView: {screen: DictionaryDetailView},
		DictionaryView: {screen: DictionaryView},
		EditHomeView: {screen: EditHomeView},
		EventDetailView: {screen: EventDetailView},
		FaqView: {screen: FaqView},
		FilterView: {screen: FilterView},
		HelpView: {screen: HelpView},
		JobDetailView: {screen: JobDetailView},
		LegalView: {screen: LegalView},
		MenusView: {screen: MenusView},
		NewsView: {screen: NewsView},
		PrivacyView: {screen: PrivacyView},
		SettingsView: {screen: SettingsView},
		IconSettingsView: {screen: IconSettingsView},
		SISView: {screen: SISView},
		KSTOScheduleView: {screen: KSTOScheduleView},
		KRLXScheduleView: {screen: KRLXScheduleView},
		StudentOrgsDetailView: {screen: StudentOrgsDetailView},
		StudentOrgsView: {screen: StudentOrgsView},
		TransportationView: {screen: TransportationView},
		OtherModesDetailView: {screen: OtherModesDetailView},
		BusMapView: {screen: BusMapView},
		CarletonBurtonMenuView: {screen: CarletonBurtonMenuScreen},
		CarletonLDCMenuView: {screen: CarletonLDCMenuScreen},
		CarletonWeitzMenuView: {screen: CarletonWeitzMenuScreen},
		CarletonSaylesMenuView: {screen: CarletonSaylesMenuScreen},
	},
	{
		navigationOptions: {
			headerTintColor: c.white,
			headerStyle: {
				backgroundColor: c.olevilleGold,
			},
		},
		cardStyle: {
			backgroundColor: Platform.select({
				ios: c.iosLightBackground,
				android: c.androidLightBackground,
			}),
		},
	},
)
