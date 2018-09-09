// @flow

import {HomeView, EditHomeView} from '../views/home'
import {BuildingHoursDetailView} from '../views/building-hours/detail'
import {
	BuildingHoursProblemReportView,
	BuildingHoursScheduleEditorView,
	BuildingHoursView,
} from '../views/building-hours'
import CalendarView, {EventDetail as EventDetailView} from '../views/calendar'
import {ContactsDetailView, ContactsView} from '../views/contacts'
import {
	DictionaryDetailView,
	DictionaryEditorView,
	DictionaryView,
} from '../views/dictionary'
import {FaqView} from '../views/faqs'
import HelpView from '../views/help'
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
import {MenuItemDetailView} from '@frogpond/food-menu/food-item-detail'
import NewsView from '../views/news'
import {
	SettingsView,
	IconSettingsView,
	CreditsView,
	LegalView,
	PrivacyView,
	PushNotificationsSettingsView,
} from '../views/settings'
import SISView from '../views/sis'
import StreamingView, {
	KRLXScheduleView,
	KSTOScheduleView,
} from '../views/streaming'
import {StudentOrgsDetailView, StudentOrgsView} from '../views/student-orgs'
import TransportationView, {
	BusMap as BusMapView,
	OtherModesDetailView,
} from '../views/transportation'
import {
	PrinterListView,
	PrintJobReleaseView,
	PrintJobsView,
} from '../views/stoprint'

export const routes = {
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
	DictionaryEditorView: {screen: DictionaryEditorView},
	EditHomeView: {screen: EditHomeView},
	EventDetailView: {screen: EventDetailView},
	FaqView: {screen: FaqView},
	HelpView: {screen: HelpView},
	JobDetailView: {screen: JobDetailView},
	LegalView: {screen: LegalView},
	MenusView: {screen: MenusView},
	NewsView: {screen: NewsView},
	PrivacyView: {screen: PrivacyView},
	SettingsView: {screen: SettingsView},
	IconSettingsView: {screen: IconSettingsView},
	PushNotificationsSettingsView: {screen: PushNotificationsSettingsView},
	SISView: {screen: SISView},
	CourseSearchResultsView: {screen: CourseSearchResultsView},
	CourseDetailView: {screen: CourseDetailView},
	StreamingView: {screen: StreamingView},
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
	MenuItemDetailView: {screen: MenuItemDetailView},
	PrintJobsView: {screen: PrintJobsView},
	PrinterListView: {screen: PrinterListView},
	PrintJobReleaseView: {screen: PrintJobReleaseView},
}
