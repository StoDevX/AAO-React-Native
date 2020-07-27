// @flow

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
	HomeView: HomeView,
	BuildingHoursDetailView: BuildingHoursDetailView,
	BuildingHoursView: BuildingHoursView,
	BuildingHoursProblemReportView: BuildingHoursProblemReportView,
	BuildingHoursScheduleEditorView: BuildingHoursScheduleEditorView,
	CalendarView: CalendarView,
	ContactsView: ContactsView,
	ContactsDetailView: ContactsDetailView,
	CreditsView: CreditsView,
	DebugView: DebugView,
	APITestView: APITestView,
	DictionaryDetailView: DictionaryDetailView,
	DictionaryView: DictionaryView,
	DictionaryEditorView: DictionaryEditorView,
	EventDetailView: EventDetailView,
	FaqView: FaqView,
	HelpView: HelpView,
	JobDetailView: JobDetailView,
	LegalView: LegalView,
	MenusView: MenusView,
	BonAppPickerView: BonAppPickerView,
	NewsView: NewsView,
	PrivacyView: PrivacyView,
	SettingsView: SettingsView,
	IconSettingsView: IconSettingsView,
	SISView: SISView,
	CourseSearchResultsView: CourseSearchResultsView,
	CourseDetailView: CourseDetailView,
	StreamingView: StreamingView,
	KSTOScheduleView: KSTOScheduleView,
	KRLXScheduleView: KRLXScheduleView,
	StudentOrgsDetailView: StudentOrgsDetailView,
	StudentOrgsView: StudentOrgsView,
	TransportationView: TransportationView,
	OtherModesDetailView: OtherModesDetailView,
	BusMapView: BusMapView,
	CarletonBurtonMenuView: CarletonBurtonMenuScreen,
	CarletonLDCMenuView: CarletonLDCMenuScreen,
	CarletonWeitzMenuView: CarletonWeitzMenuScreen,
	CarletonSaylesMenuView: CarletonSaylesMenuScreen,
	MenuItemDetailView: MenuItemDetailView,
	PrintJobsView: PrintJobsView,
	PrinterListView: PrinterListView,
	PrintJobReleaseView: PrintJobReleaseView,
}
