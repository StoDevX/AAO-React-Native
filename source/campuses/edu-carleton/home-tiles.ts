import * as c from '@frogpond/colors'

import type {ViewType} from '../../features/views'
import {developerTile} from '../shared-tiles'

/**
 * The CARLS app's tiles, in its order and under its names. A CARLS tile whose
 * screen cannot yet read Carleton's data is left out rather than shown with
 * St. Olaf's.
 */
export const carletonHomeTiles: ReadonlyArray<ViewType> = [
	{
		type: 'view',
		view: '/menus/burton',
		title: 'Menus',
		icon: 'fork.knife',
		gradient: c.greenGradient,
	},
	// The Hub, which the CARLS app linked to, was replaced by Workday.
	{
		type: 'url',
		url: 'https://www.carleton.edu/workday/',
		title: 'Workday',
		icon: 'briefcase.fill',
		gradient: c.goldGradient,
	},
	// The CARLS app's Balances tile; the OneCard site shows them, and the card's other uses.
	{
		type: 'url',
		url: 'https://get.cbord.com/carletonstolaf/full/prelogin.php',
		title: 'OneCard',
		icon: 'creditcard.fill',
		gradient: c.mintGradient,
	},
	{
		type: 'view',
		view: '/hours?campus=edu.carleton',
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
		type: 'url',
		url: 'https://www.carleton.edu/directory/',
		title: 'Directory',
		icon: 'person.crop.rectangle.fill',
		gradient: c.redGradient,
	},
	{
		type: 'view',
		view: '/contacts',
		title: 'Important Contacts',
		icon: 'phone.fill',
		gradient: c.orangeGradient,
	},
	{
		type: 'radio',
		station: 'krlx',
		title: 'KRLX',
		icon: 'radio.fill',
		gradient: c.purpleGradient,
	},
	{
		type: 'view',
		view: '/carleton-sumo',
		title: 'SUMO',
		icon: 'film.fill',
		gradient: c.lightBlueGradient,
	},
	// The CARLS app's News tile, as the student paper: Carleton's own news is at the end.
	{
		type: 'view',
		view: '/carletonian',
		title: 'The Carletonian',
		icon: 'carletonian',
		gradient: c.tanGradient,
		titleDesign: 'serif',
	},
	{
		type: 'view',
		view: '/transit',
		title: 'Transportation',
		icon: 'bus.fill',
		gradient: c.grayGradient,
	},
	{
		type: 'view',
		view: '/carleton-convos',
		title: 'Convo',
		icon: 'building.columns.fill',
		gradient: c.indigoGradient,
	},
	{
		type: 'view',
		view: '/map?campus=edu.carleton',
		title: 'Campus Map',
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
	// Carleton blocks ccc-server from its orgs list, so the tile opens the college's own.
	{
		type: 'url',
		url: 'https://www.carleton.edu/student-organizations/',
		title: 'Student Orgs',
		icon: 'person.3.fill',
		gradient: c.sageGradient,
	},
	{
		type: 'url',
		url: 'https://moodle.carleton.edu/',
		title: 'Moodle',
		icon: 'graduationcap.fill',
		gradient: c.yellowGradient,
	},
	{
		type: 'view',
		view: '/carleton-news',
		title: 'Carleton News',
		icon: 'megaphone.fill',
		gradient: c.indigoGradient,
	},
	developerTile,
]
