export type RedditPostType = {
	id: string
	title: string
	author: string
	publishedAt: string
	permalink: string
	contentHtml: string
	thumbnail: string | null
}

export type RedditCommentType = {
	id: string
	author: string
	contentHtml: string
	publishedAt: string
	replies: RedditCommentType[]
}
