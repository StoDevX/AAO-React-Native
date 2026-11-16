import type {SFSymbol} from 'sf-symbols-typescript'

export type CampusLink = {
	title: string
	description: string
	url: string
	icon: SFSymbol
}

export const LINKS: CampusLink[] = [
	{
		title: 'Student Organizations',
		description: 'Find and join student organizations at Carleton.',
		url: 'https://www.carleton.edu/student-organizations/',
		icon: 'person.2',
	},
	{
		title: 'Carleton Library',
		description: 'Search the library catalog and databases.',
		url: 'https://www.carleton.edu/library/',
		icon: 'books.vertical',
	},
	{
		title: 'Facilities Work Request',
		description: 'Submit a work request for room maintenance.',
		url: 'http://go.carleton.edu/workorder',
		icon: 'wrench.and.screwdriver',
	},
	{
		title: 'Web Print',
		description: 'Submit and print documents.',
		url: 'http://go.carleton.edu/webprint',
		icon: 'printer',
	},
	{
		title: '25 Live',
		description: 'Book a room for an event or study session.',
		url: 'https://25live.collegenet.com/carleton/',
		icon: 'calendar.badge.plus',
	},
	{
		title: 'Quantitative Resource Center Appointments',
		description: 'Book an appointment with the QRC for help with STEM and QRE courses.',
		url: 'https://carleton.libcal.com/appointments/QRC',
		icon: 'clock.badge.checkmark',
	},
	{
		title: 'Quantitative Resource Center Landing Page',
		description: 'Browse resources and services offered by the QRC.',
		url: 'https://www.carleton.edu/quantitative-resource-center/',
		icon: 'circle.grid.cross',
	},
	{
		title: 'Writing Center Appointments',
		description: 'Book an appointment with the Writing Center for help with writing.',
		url: 'https://carleton.mywconline.com/',
		icon: 'clock.badge.checkmark',
	},
	{
		title: 'Writing Center Landing Page',
		description: 'Browse resources and services offered by the Writing Center.',
		url: 'https://www.carleton.edu/writing-center/',
		icon: 'circle.grid.cross',
	},
	{
		title: 'Career Center Appointments',
		description: 'Book an appointment with the Career Center for help with career development.',
		url: 'https://www.carleton.edu/career/connect/appointment/',
		icon: 'clock.badge.checkmark',
	},
	{
		title: 'Career Center Landing Page',
		description: 'Browse resources and services offered by the Career Center.',
		url: 'https://www.carleton.edu/career/',
		icon: 'circle.grid.cross',
	},
	{
		title: 'Student Health And Counseling Services',
		description: 'Find information about student health services at Carleton.',
		url: 'https://www.carleton.edu/student-health/',
		icon: 'heart',
	},
]
