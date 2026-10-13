/** One era in the app's history. */
export type TimelineEra = {
	period: string
	story: string
}

/** A list of people About credits, under its heading. */
export type Credit = {id: string; heading: string; names: ReadonlyArray<string>}

/** Somewhere the app gets its data, and what it takes from there. */
export type DataSource = {
	name: string
	provides: string
	url: string
}

/** What About and Contributing tell of the app on one campus. */
export type AboutSection = {
	/** The app's history, newest first. Empty for an app that tells none. */
	story: ReadonlyArray<TimelineEra>
	/** Whom About credits, in order. An empty list is left off. */
	credits: ReadonlyArray<Credit>
	/** Where the campus's data comes from, which Contributing lists. */
	dataSources: ReadonlyArray<DataSource>
}
