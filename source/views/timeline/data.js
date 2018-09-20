const sept5 = {
	name: 'Today',
	date: 'September 5, 2018',
	ongoing: [
		{title: 'Stav Hall (Lunch)', type: 'menu', source: 'stav-hall'},
		{title: 'The Cage', type: 'menu', source: 'the-cage'},
		{title: 'SGA: Homecoming Prep', type: 'calendar', source: 'SGA'},
	],
	allDay: [],
	events: [
		{
			start: '14:15',
			title: 'Recital: Josie Smith',
			duration: '1 hr',
			type: 'calendar',
			source: 'Music',
		},
		{
			start: '14:15',
			title: 'Fall Concert',
			duration: '1.5 hrs',
			type: 'calendar',
			source: 'Taiko Club',
		},
		{
			start: '14:15',
			title: 'Something Else',
			duration: '1 hr',
			type: 'calendar',
			source: 'Suddenly, Wizards!',
		},
		{
			start: '19:00',
			title: 'Fall Dance Party',
			location: 'Pause Mane Stage',
			duration: '2+ hrs',
			type: 'calendar',
			source: 'SGA/MEC',
		},
		{
			start: '19:00',
			title: 'Scriptless Auditions',
			duration: '1 hr',
			type: 'calendar',
			source: 'Scared Scriptless',
		},
		{
			start: '19:00',
			title: 'Viking Auditions',
			duration: '1 hr',
			type: 'calendar',
			source: 'Viking Chorus',
		},
		{
			start: '21:00',
			title: 'Cage: Closed',
			type: 'hours',
			source: 'the-cage',
		},
		{
			start: '21:00',
			title: 'Bookstore: Closed',
			type: 'hours',
			source: 'bookstore',
		},
		{
			start: '21:00',
			title: 'Men XC Home Meet',
			duration: '1 day',
			type: 'calendar',
			source: 'Athletics',
		},
		{
			start: '21:00',
			title: 'DiSCO Cave Grand Opening',
			duration: '1 hr',
			type: 'calendar',
			source: 'DiSCO',
		},
	],
}

const sept6 = {
	name: 'Tomorrow',
	date: 'September 6, 2018',
	ongoing: [{title: 'Men XC Home Meet', type: 'calendar', source: 'Athletics'}],
	allDay: [
		{
			title: 'Reading Day',
			duration: '1 day',
			type: 'calendar',
			source: 'Registrar',
		},
		{
			title: 'Christmasfest',
			duration: '4 days',
			type: 'calendar',
			source: 'Music Orgs',
		},
		{
			title: 'Senior Art Show',
			duration: '3 days',
			type: 'calendar',
			source: 'Art',
		},
	],
	events: [
		{
			start: '7:00',
			title: 'Stav: Open',
			type: 'hours',
			source: 'stav-hall',
		},
		{
			start: '7:00',
			title: 'Cage: Open',
			type: 'hours',
			source: 'the-cage',
		},
		{
			start: '8:00',
			title: 'WRI 111',
			duration: '50 min',
			type: 'class',
			source: 'SIS Schedule',
		},
	],
}

export const days = [sept5, sept6]
