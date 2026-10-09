import * as c from '@frogpond/colors'

import type {ViewType} from '../../features/views'
import {menus} from './menus'
import {developerTile} from '../shared-tiles'

/** All About Olaf's Home tiles, in order. */
export const stolafHomeTiles: ReadonlyArray<ViewType> = [
	{
		type: 'view',
		view: menus.entryHref,
		title: 'Menus',
		icon: 'fork.knife',
		gradient: c.greenGradient,
	},
	{
		type: 'url',
		url: 'https://sis.stolaf.edu/sis/index.cfm',
		title: 'Balances',
		icon: 'arrow.up.right',
		gradient: c.goldGradient,
	},
	// Balances opens SIS on the web instead. To bring the native screen
	// back, move `disabled` to the entry above.
	{
		type: 'view',
		view: '/balances',
		title: 'Balances',
		icon: 'person.text.rectangle.fill',
		gradient: c.goldGradient,
		disabled: true,
	},
	{
		type: 'view',
		view: '/hours',
		title: 'Hours',
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
		view: '/directory',
		title: 'Directory',
		icon: 'person.crop.rectangle.fill',
		gradient: c.redGradient,
	},
	{
		type: 'view',
		view: '/streaming-media',
		title: 'Streaming Media',
		icon: 'play.rectangle.fill',
		gradient: c.lightBlueGradient,
	},
	{
		type: 'view',
		view: '/newspaper',
		title: 'Olaf Messenger',
		icon: 'olaf-messenger',
		gradient: c.purpleGradient,
		titleDesign: 'serif',
	},
	{
		type: 'view',
		view: '/map?campus=edu.stolaf',
		title: 'Map',
		icon: 'map.fill',
		gradient: c.greenGradient,
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
		view: '/more',
		title: 'More',
		icon: 'ellipsis.circle.fill',
		gradient: c.mintGradient,
	},
	{
		type: 'view',
		view: '/print-jobs',
		title: 'stoPrint',
		icon: 'printer.fill',
		gradient: c.yellowGradient,
	},
	{
		type: 'view',
		view: '/course-search',
		title: 'Course Catalog',
		icon: 'graduationcap.fill',
		gradient: c.tanGradient,
	},
	{
		type: 'view',
		view: '/student-work',
		title: 'Student Work',
		icon: 'briefcase.fill',
		gradient: c.orangeGradient,
	},
	{
		type: 'view',
		view: '/st-olaf-news',
		title: 'St. Olaf News',
		icon: 'megaphone.fill',
		gradient: c.indigoGradient,
	},
	{
		type: 'view',
		view: '/athletics',
		title: 'Athletics',
		icon: 'trophy.fill',
		gradient: c.paleGoldGradient,
		devOnly: true,
	},
	developerTile,
]
