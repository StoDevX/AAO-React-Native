export type CrosspostParent = {
	title: string
	subreddit: string
	author: string
	selftext: string
	permalink: string
}

export type PollOption = {
	text: string
	votes: number
}

export type PollData = {
	options: PollOption[]
	totalVotes: number
	votingEndAt: string | null
}

export type RedditPostType = {
	id: string
	title: string
	author: string
	publishedAt: string
	permalink: string
	contentHtml: string
	thumbnail: string | null
	// New fields from JSON API (optional for backward compat)
	postType?: 'text' | 'image' | 'gallery' | 'link' | 'crosspost' | 'poll'
	imageUrl?: string | null
	images?: string[]
	linkUrl?: string | null
	linkDomain?: string | null
	crosspostParent?: CrosspostParent | null
	pollData?: PollData | null
}

export type RedditCommentType = {
	id: string
	author: string
	contentHtml: string
	publishedAt: string
	score: number
	replies: RedditCommentType[]
}

export type FlatComment = {comment: RedditCommentType; depth: number}

export type RedditPostDetailParams = {
	postUrl: string
	title: string
	author: string
	publishedAt: string
	contentHtml: string
	thumbnail: string | null
	communityName: string
	postAuthor: string
	// New fields (optional)
	postType?: RedditPostType['postType']
	imageUrl?: string | null
	images?: string[]
	linkUrl?: string | null
	linkDomain?: string | null
	crosspostParent?: CrosspostParent | null
	pollData?: PollData | null
}
