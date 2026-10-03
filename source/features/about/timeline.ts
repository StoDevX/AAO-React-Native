/** What the app is, in a sentence, above its history. */
export const INTRO =
	'All About Olaf is a collaborative application created by alumni of St. Olaf College in Northfield, MN under the name StoDevX.'

/** One era in the app's history. */
export type TimelineEra = {
	period: string
	story: string
}

/** The app's history, newest first. */
export const timeline: Array<TimelineEra> = [
	{
		period: '🏡 October 2017 — Today',
		story:
			'Alumni of St. Olaf — Hawken Rives, Kris Rye, and Drew Volz — develop and support the app in its current form. Rewritten from top to bottom in Typescript, this is the version you see today in the iOS App Store. It remains self-published and open-source, shows no ads, and the anonymous usage and crash data it sends can be turned off.',
	},
	{
		period: '🧱 July 2016 — September 2017',
		story:
			'This version was written in the summer of 2016, led by Elijah Verdoorn and assisted by Hawken Rives and Drew Volz. The app was supported and published by the Student Government Association (SGA) web team, called the Oleville Development Team.',
	},
	{
		period: '🏗 2014',
		story:
			'The first version of All About Olaf was an iOS app created by Drew Volz as an independent project, self-published and written in Objective-C.',
	},
]
