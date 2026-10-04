export type NewsSource = {
	id: string
	title: string
	/** The file's name in `images/news-sources/`, without the extension. */
	thumbnail: false | string
}

/** The student newspaper. */
export const OLAF_MESSENGER: NewsSource = {
	id: 'mess',
	title: 'The Olaf Messenger',
	thumbnail: 'mess',
}

/** The college's own news site. */
export const STOLAF_NEWS: NewsSource = {
	id: 'stolaf',
	title: 'St. Olaf News',
	thumbnail: 'stolaf',
}
