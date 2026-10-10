import * as c from '@frogpond/colors'

import type {ViewType} from '../../features/views'
import {developerTile} from '../shared-tiles'
import {menus} from './menus'

/** Wiki Monkeys' tiles: one for each feature it has, so every screen can be reached from Home. */
export const exampleCollegeHomeTiles: ReadonlyArray<ViewType> = [
	{
		type: 'view',
		view: menus.entryHref,
		title: 'Menus',
		icon: 'fork.knife',
		gradient: c.greenGradient,
	},
	{
		type: 'view',
		view: '/hours',
		title: 'Building Hours',
		icon: 'clock.fill',
		gradient: c.blueGradient,
	},
	{
		type: 'view',
		view: '/calendar',
		title: 'Calendar',
		icon: 'calendar',
		gradient: c.violetGradient,
	},
	{
		type: 'view',
		view: '/contacts',
		title: 'Contacts',
		icon: 'phone.fill',
		gradient: c.orangeGradient,
	},
	{
		type: 'view',
		view: '/directory',
		title: 'Directory',
		icon: 'person.crop.rectangle.stack.fill',
		gradient: c.lightBlueGradient,
	},
	{
		type: 'radio',
		station: 'kmnk',
		title: 'KMNK',
		icon: 'radio.fill',
		gradient: c.purpleGradient,
	},
	{
		type: 'view',
		view: '/newspaper',
		title: 'The Valley Echo',
		icon: 'newspaper.fill',
		gradient: c.tanGradient,
		titleDesign: 'serif',
	},
	{
		type: 'view',
		view: '/transit',
		title: 'Transit',
		icon: 'bus.fill',
		gradient: c.grayGradient,
	},
	{
		type: 'view',
		view: '/map',
		title: 'Valley Map',
		icon: 'map.fill',
		gradient: c.greenGradient,
	},
	{
		type: 'view',
		view: '/dictionary',
		title: 'Dictionary',
		icon: 'character.book.closed.fill',
		gradient: c.pinkGradient,
	},
	{
		type: 'view',
		view: '/student-orgs',
		title: 'Student Orgs',
		icon: 'person.3.fill',
		gradient: c.sageGradient,
	},
	{
		type: 'view',
		view: '/athletics',
		title: 'Athletics',
		icon: 'sportscourt.fill',
		gradient: c.yellowGradient,
	},
	{
		type: 'view',
		view: '/streaming-media',
		title: 'Streaming Media',
		icon: 'play.rectangle.fill',
		gradient: c.indigoGradient,
	},
	{
		type: 'view',
		view: '/student-work',
		title: 'Student Work',
		icon: 'briefcase.fill',
		gradient: c.goldGradient,
	},
	{
		type: 'view',
		view: '/more',
		title: 'More',
		icon: 'ellipsis.circle.fill',
		gradient: c.mintGradient,
	},
	developerTile,
]
