export interface StoryType {
	authors: string[]
	categories: string[]
	content: string
	datePublished?: string
	excerpt: string
	featuredImage?: string
	link?: string
	title: string
}

export interface RssFeedItemType {
	'dc:creator': string[]
	category: string[]
	'content:encoded': string[]
	description: string[]
	link: string[]
	pubDate: string[]
	title: string[]
}

export interface FeedResponseType {
	rss: {
		channel: {
			title: string[]
			'atom:link': unknown[]
			link: string[]
			description: string[]
			item: RssFeedItemType[]
		}[]
	}
}

export interface WpEmbeddedAuthorType {
	avatar_urls: Record<string, string>
	description: string
	id: number
	link: string
	name: string
	slug: string
}

export interface WpEmbeddedFeaturedMediaType {
	alt_text: string
	author: number
	date: string
	id: number
	link: string
	media_details: {
		height: number
		width: number
		sizes: Record<string, {
				file: string
				height: number
				width: number
				mime_type: string
				source_url: string
			}>
	}
	media_type: 'image'
	mime_type: string
	slug: string
	source_url: string
	title: {
		rendered: string
	}
	type: 'attachment'
}

export interface WpJsonItemType {
	_embedded?: {
		author?: WpEmbeddedAuthorType[]
		'wp:featuredmedia'?: WpEmbeddedFeaturedMediaType[]
	}
	author: number
	categories: number[]
	content: {rendered: string}
	date_gmt: string
	excerpt: {rendered: string}
	featured_media: number
	id: number
	link: string
	modified_gmt: string
	title: {rendered: string}
}

export type WpJsonResponseType = WpJsonItemType[]
