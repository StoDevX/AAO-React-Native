/** A news feed the News screen reads. */
export type NewsSource = {
	/** The feed's id in the sources manifest, which also keys its query. */
	id: string
	title: string
	/** The file's name in `images/news-sources/`, without the extension. */
	thumbnail: false | string
}

/** A campus's own news site, which its News tile opens. */
export type NewsSection = {
	source: NewsSource
}
