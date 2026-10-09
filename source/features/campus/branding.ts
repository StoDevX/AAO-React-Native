import {SUPPORT_EMAIL} from '../../lib/constants'
import {type LegacyCampus as Campus, currentLegacyCampus, useLegacyCampus} from './store'

/** What the app calls itself, and the college it is for, on one campus. */
export type Branding = {
	/** The app's name: All About Olaf, or CARLS on a Carleton install. */
	appName: string
	/** Where the app's support email goes. */
	supportEmail: string
	/** The college the app serves, and is not sponsored by. */
	college: string
	/** What the app is, in a sentence, above its history on About. */
	intro: string
}

export const BRANDING: Record<Campus, Branding> = {
	stolaf: {
		appName: 'All About Olaf',
		supportEmail: SUPPORT_EMAIL,
		college: 'St. Olaf College',
		intro:
			'All About Olaf is a collaborative application created by alumni of St. Olaf College in Northfield, MN under the name StoDevX.',
	},
	carleton: {
		appName: 'CARLS',
		supportEmail: 'carls@frogpond.tech',
		college: 'Carleton College',
		// CARLS' own, as carls-app/carls' data/credits.yaml has it.
		intro:
			"CARLS is an application created by Hawken Rives, based off of the app All About Olaf, which was a result of collaboration between student and alumni of St. Olaf College. It was inspired by the original 'All About Olaf', an iOS application created by Drew Volz as an independent project in 2014.",
	},
}

/** The current campus's branding. */
export function useBranding(): Branding {
	return BRANDING[useLegacyCampus()]
}

/** The current campus's branding, for code outside a component, read when it is called. */
export function currentBranding(): Branding {
	return BRANDING[currentLegacyCampus()]
}
