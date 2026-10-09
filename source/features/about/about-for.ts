import type {AboutSection, Credit, TimelineEra} from './campus-section'

export type {Credit}

/** What About shows on one campus: its history, and whom it credits. */
export type About = {
	story: ReadonlyArray<TimelineEra>
	credits: ReadonlyArray<Credit>
}

/** The About a campus's `about` section describes, with any empty credit left off. */
export function aboutFor(about: AboutSection | undefined): About {
	return {
		story: about?.story ?? [],
		credits: (about?.credits ?? []).filter((credit) => credit.names.length > 0),
	}
}
