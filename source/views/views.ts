import * as c from '@frogpond/colors'
import type {Gradient} from '@frogpond/colors'
import type {ImageProps} from '@expo/ui/swift-ui'
import {RootViewsParamList} from '../navigation/types'

const menus: keyof RootViewsParamList = 'Menus'
const sis: keyof RootViewsParamList = 'SIS'
const calendar: keyof RootViewsParamList = 'Calendar'
const reddit: keyof RootViewsParamList = 'Communities'
const streaming: keyof RootViewsParamList = 'Streaming Media'
const news: keyof RootViewsParamList = 'News'
const transportation: keyof RootViewsParamList = 'Transportation'
const hours: keyof RootViewsParamList = 'BuildingHours'
const directory: keyof RootViewsParamList = 'Directory'
const importantContacts: keyof RootViewsParamList = 'Contacts'
const dictionary: keyof RootViewsParamList = 'Dictionary'
const studentOrgs: keyof RootViewsParamList = 'StudentOrgs'
const more: keyof RootViewsParamList = 'More'
const printJobs: keyof RootViewsParamList = 'PrintJobs'
const courseSearch: keyof RootViewsParamList = 'CourseSearch'

type CommonView = {
	title: string
	/// An SF Symbol name. Health builds its category cards from SF Symbols, so
	/// matching its glyph weight and Dynamic Type behaviour means drawing from
	/// the same set rather than from an icon font.
	///
	/// Taken from `Image` rather than from `sf-symbols-typescript` directly: the
	/// names this accepts should be exactly the names the component can render,
	/// and that package is only reachable here as one of @expo/ui's own
	/// dependencies.
	icon: NonNullable<ImageProps['systemName']>
	gradient: Gradient
	disabled?: boolean
	devOnly?: boolean
}

type NativeView = {
	type: 'view'
	view: keyof RootViewsParamList
}

type WebLinkView = {
	type: 'url' | 'browser-url'
	url: string
}

export type ViewType = CommonView & (NativeView | WebLinkView)

export const AllViews = (): Array<ViewType> => {
	return [
		{
			type: 'view',
			view: menus,
			title: 'Menus',
			icon: 'fork.knife',
			gradient: c.greenGradient,
		},
		{
			type: 'view',
			view: sis,
			title: 'SIS',
			icon: 'person.text.rectangle.fill',
			gradient: c.goldGradient,
			disabled: true,
		},
		{
			type: 'view',
			view: hours,
			title: 'Building Hours',
			icon: 'clock.fill',
			gradient: c.blueGradient,
			disabled: true,
		},
		{
			type: 'view',
			view: calendar,
			title: 'Calendar',
			icon: 'calendar',
			gradient: c.violetGradient,
			disabled: true,
		},
		{
			type: 'view',
			view: directory,
			title: 'Directory',
			icon: 'person.crop.rectangle.fill',
			gradient: c.redGradient,
		},
		{
			type: 'view',
			view: streaming,
			title: 'Streaming Media',
			icon: 'play.rectangle.fill',
			gradient: c.lightBlueGradient,
			disabled: true,
		},
		{
			type: 'view',
			view: news,
			title: 'News',
			icon: 'newspaper.fill',
			gradient: c.purpleGradient,
			disabled: true,
		},
		{
			type: 'url',
			url: 'https://map.stolaf.edu/',
			title: 'Campus Map',
			icon: 'map.fill',
			gradient: c.indigoGradient,
		},
		{
			type: 'view',
			view: importantContacts,
			title: 'Important Contacts',
			icon: 'phone.fill',
			gradient: c.orangeGradient,
		},
		{
			type: 'view',
			view: transportation,
			title: 'Transportation',
			icon: 'bus.fill',
			gradient: c.grayGradient,
			disabled: true,
		},
		{
			type: 'view',
			view: dictionary,
			title: 'Campus Dictionary',
			icon: 'character.book.closed.fill',
			gradient: c.pinkGradient,
		},
		{
			type: 'view',
			view: studentOrgs,
			title: 'Student Orgs',
			icon: 'person.3.fill',
			gradient: c.sageGradient,
		},
		{
			type: 'view',
			view: more,
			title: 'More',
			icon: 'ellipsis.circle.fill',
			gradient: c.mintGradient,
		},
		{
			type: 'view',
			view: printJobs,
			title: 'stoPrint',
			icon: 'printer.fill',
			gradient: c.yellowGradient,
		},
		{
			type: 'view',
			view: courseSearch,
			title: 'Course Catalog',
			icon: 'graduationcap.fill',
			gradient: c.tanGradient,
			disabled: true,
		},
		{
			type: 'view',
			view: reddit,
			title: 'Communities',
			icon: 'bubble.left.and.bubble.right.fill',
			gradient: c.orangeGradient,
			devOnly: true,
			disabled: true,
		},
	]
}
