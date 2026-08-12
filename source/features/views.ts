import * as c from '@frogpond/colors'
import type {Gradient} from '@frogpond/colors'
import type {ImageProps} from '@expo/ui/swift-ui'
import {useRouter} from 'expo-router'

type r = typeof useRouter extends () => infer T ? T : never
type href = r extends {push: (href: infer H) => void} ? H : never

type CommonView = {
	title: string
	icon: NonNullable<ImageProps['systemName']>
	gradient: Gradient
	disabled?: boolean
	devOnly?: boolean
}

type NativeView = {
	type: 'view'
	view: href
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
			view: '/Menus',
			title: 'Menus',
			icon: 'fork.knife',
			gradient: c.greenGradient,
		},
		{
			type: 'view',
			view: '/SIS',
			title: 'SIS',
			icon: 'person.text.rectangle.fill',
			gradient: c.goldGradient,
		},
		{
			type: 'view',
			view: '/BuildingHours',
			title: 'Building Hours',
			icon: 'clock.fill',
			gradient: c.blueGradient,
		},
		{
			type: 'view',
			view: '/Calendar',
			title: 'Calendar',
			icon: 'calendar',
			gradient: c.violetGradient,
		},
		{
			type: 'view',
			view: '/Directory',
			title: 'Directory',
			icon: 'person.crop.rectangle.fill',
			gradient: c.redGradient,
		},
		{
			type: 'view',
			view: '/Streaming Media',
			title: 'Streaming Media',
			icon: 'play.rectangle.fill',
			gradient: c.lightBlueGradient,
		},
		{
			type: 'view',
			view: '/News',
			title: 'News',
			icon: 'newspaper.fill',
			gradient: c.purpleGradient,
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
			view: '/Map',
			title: 'Carleton Map (Beta)',
			icon: 'map.circle.fill',
			gradient: c.blueGradient,
			// MAP_STYLE_URL now points at real campus tiles, but nobody has yet
			// seen this screen draw on a device -- the MapLibre swap and the
			// tileset both arrived without one. Drop this line after a build on
			// hardware shows the map.
			devOnly: true,
		},
		{
			type: 'view',
			view: '/Contacts',
			title: 'Important Contacts',
			icon: 'phone.fill',
			gradient: c.orangeGradient,
		},
		{
			type: 'view',
			view: '/Transportation',
			title: 'Transportation',
			icon: 'bus.fill',
			gradient: c.grayGradient,
		},
		{
			type: 'view',
			view: '/Dictionary',
			title: 'Campus Dictionary',
			icon: 'character.book.closed.fill',
			gradient: c.pinkGradient,
		},
		{
			type: 'view',
			view: '/StudentOrgs',
			title: 'Student Orgs',
			icon: 'person.3.fill',
			gradient: c.sageGradient,
		},
		{
			type: 'view',
			view: '/More',
			title: 'More',
			icon: 'ellipsis.circle.fill',
			gradient: c.mintGradient,
		},
		{
			type: 'view',
			view: '/PrintJobs',
			title: 'stoPrint',
			icon: 'printer.fill',
			gradient: c.yellowGradient,
		},
		{
			type: 'view',
			view: '/CourseSearch',
			title: 'Course Catalog',
			icon: 'graduationcap.fill',
			gradient: c.tanGradient,
		},
		{
			type: 'view',
			view: '/Communities',
			title: 'Communities',
			icon: 'bubble.left.and.bubble.right.fill',
			gradient: c.orangeGradient,
			devOnly: true,
		},
	]
}
