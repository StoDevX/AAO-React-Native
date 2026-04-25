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

export type FlatComment = {comment: RedditCommentType; depth: number}

export type RedditPostDetailParams = {
	postUrl: string
	title: string
	author: string
	publishedAt: string
	contentHtml: string
}
