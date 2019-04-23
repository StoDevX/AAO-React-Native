// @flow

import React from 'react'
import {Navigation} from 'react-native-navigation'
import {getTheme} from '@frogpond/app-theme'

import {Provider} from 'react-redux'
import {makeStore, initRedux} from '../redux'
const store = makeStore()
initRedux(store)

const withRedux = Component => props => (
	<Provider store={store}>
		<Component {...props} />
	</Provider>
)

const register = Navigation.registerComponent.bind(Navigation)

let theme = getTheme()

Navigation.events().registerAppLaunchedListener(() => {
	Navigation.setDefaultOptions({
		statusBar: {
			style: 'light',
		},
		layout: {
			orientation: ['portrait', 'landscape'],
		},
		topBar: {
			visible: true,
			barStyle: 'default',
			searchBar: true,
			searchBarHiddenWhenScrolling: true,
			searchBarPlaceholder: 'Search',
			title: {
				text: 'All About Olaf',
			},
			backButton: {
				title: 'Home',
			},
			largeTitle: {
				visible: true,
			},
			background: {
				// color: theme.navigationBackground,
			},
		},
	})
})

Navigation.events().registerCommandCompletedListener((name, params) => {
	console.log(name, params)
	// if (name !== 'push') {
	// 	return
	// }

	// Sentry.captureBreadcrumb({
	// 	message: `Navigated to ${componentId}`,
	// 	category: 'navigation',
	// })
})

/////

import {HomeView, EditHomeView} from '../views/home'
register('app.home', () => withRedux(HomeView))
register('app.home.edit', () => withRedux(EditHomeView))

/*
import {BuildingHoursDetailView} from '../views/building-hours/detail'
import {
	BuildingHoursProblemReportView,
	BuildingHoursScheduleEditorView,
	BuildingHoursView,
} from '../views/building-hours'
register('app.hours', () => withRedux(BuildingHoursView))
register('app.hours.detail', () => withRedux(BuildingHoursDetailView))
register('app.hours.report', () => withRedux(BuildingHoursProblemReportView))
register('app.hours.editor', () => withRedux(BuildingHoursScheduleEditorView))

import CalendarView from '../views/calendar'
import {EventDetail} from '@frogpond/event-list'
register('app.calendar', () => withRedux(CalendarView))
register('app.calendar.detail', () => withRedux(EventDetail))

import {ContactsDetailView, ContactsView} from '../views/contacts'
register('app.contacts', () => withRedux(ContactsView))
register('app.contacts.detail', () => withRedux(ContactsDetailView))

import {
	DictionaryDetailView,
	DictionaryEditorView,
	DictionaryView,
} from '../views/dictionary'
register('app.dictionary', () => withRedux(DictionaryView))
register('app.dictionary.detail', () => withRedux(DictionaryDetailView))
register('app.dictionary.editor', () => withRedux(DictionaryEditorView))

import HelpView from '../views/help'
register('app.help', () => withRedux(HelpView))

import {CourseDetailView, CourseSearchResultsView} from '../views/sis'
register('app.courses', () => withRedux(CourseSearchResultsView))
register('app.courses.detail', () => withRedux(CourseDetailView))

import {
	CarletonBurtonMenuScreen,
	CarletonLDCMenuScreen,
	CarletonSaylesMenuScreen,
	CarletonWeitzMenuScreen,
	MenusView,
} from '../views/menus'
import {MenuItemDetailView} from '@frogpond/food-menu/food-item-detail'
register('app.menu', () => withRedux(MenusView))
register('app.menu.burton', () => withRedux(CarletonBurtonMenuScreen))
register('app.menu.ldc', () => withRedux(CarletonLDCMenuScreen))
register('app.menu.sayles', () => withRedux(CarletonSaylesMenuScreen))
register('app.menu.weitz', () => withRedux(CarletonWeitzMenuScreen))
register('app.menu.detail', () => withRedux(MenuItemDetailView))

import {JobDetailView} from '../views/sis'
register('app.jobs.detail', () => withRedux(JobDetailView))

import NewsView from '../views/news'
register('app.news', () => withRedux(NewsView))

import {
	SettingsView,
	IconSettingsView,
	CreditsView,
	LegalView,
	PrivacyView,
	PushNotificationsSettingsView,
} from '../views/settings'
*/
import {FaqView} from '../views/faqs'
register('app.info.faqs', () => withRedux(FaqView))
/*
register('app.settings', () => withRedux(SettingsView))
register('app.settings.icon', () => withRedux(IconSettingsView))
register('app.settings.push', () => withRedux(PushNotificationsSettingsView))
register('app.info.credits', () => withRedux(CreditsView))
register('app.info.legal', () => withRedux(LegalView))
register('app.info.privacy', () => withRedux(PrivacyView))

import SISView from '../views/sis'
register('app.sis', () => withRedux(SISView))

import StreamingView, {
	KRLXScheduleView,
	KSTOScheduleView,
} from '../views/streaming'
register('app.media', () => withRedux(StreamingView))
register('app.radio.krlx', () => withRedux(KRLXScheduleView))
register('app.radio.ksto', () => withRedux(KSTOScheduleView))

import {StudentOrgsDetailView, StudentOrgsView} from '../views/student-orgs'
register('app.stuorgs', () => withRedux(StudentOrgsView))
register('app.stuorgs.detail', () => withRedux(StudentOrgsDetailView))

import TransportationView, {
	BusMap as BusMapView,
	OtherModesDetailView,
} from '../views/transportation'
register('app.transit', () => withRedux(TransportationView))
register('app.transit.map', () => withRedux(BusMapView))
register('app.transit.other', () => withRedux(OtherModesDetailView))

import {
	PrinterListView,
	PrintJobReleaseView,
	PrintJobsView,
} from '../views/stoprint'
register('app.print', () => withRedux(PrinterListView))
register('app.print.jobs', () => withRedux(PrintJobsView))
register('app.print.release', () => withRedux(PrintJobReleaseView))

import {BonAppPickerView} from '../views/menus/dev-bonapp-picker'
register('app.dev.bonapp', () => withRedux(BonAppPickerView))

import {APITestView} from '../views/settings'
register('app.dev.apitester', () => withRedux(APITestView))

import {DebugView} from '../views/settings'
register('app.dev.debug', () => withRedux(DebugView))
*/
