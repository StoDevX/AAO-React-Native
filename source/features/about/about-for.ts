import {BRANDING} from '../campus/branding'
import type {Campus} from '../campus/store'
import {acknowledgements, carlsContributors, contributors} from './credits'
import {timeline, type TimelineEra} from './timeline'

/** A list of people About credits, under its heading. */
export type Credit = {id: string; heading: string; names: ReadonlyArray<string>}

/** What About shows on one campus: the app's intro, its history, and whom it credits. */
export type About = {
	intro: string
	story: ReadonlyArray<TimelineEra>
	credits: ReadonlyArray<Credit>
}

/**
 * Each campus's About. CARLS' is the CARLS app's own: its intro and its
 * writers, with no history and no one else to thank, so those sections go.
 */
export function aboutFor(campus: Campus): About {
	let credits: Credit[] =
		campus === 'carleton'
			? [{id: 'contributors', heading: 'Contributors', names: carlsContributors}]
			: [
					{id: 'contributors', heading: 'Contributors', names: contributors},
					{id: 'acknowledgements', heading: 'Acknowledgements', names: acknowledgements},
				]
	return {
		intro: BRANDING[campus].intro,
		story: campus === 'carleton' ? [] : timeline,
		credits: credits.filter((credit) => credit.names.length > 0),
	}
}
