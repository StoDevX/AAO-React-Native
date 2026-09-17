export type HelpdeskItemType = 'category' | 'service' | 'article'

/** One row worth of data, regardless of which portal page it came from. */
export interface HelpdeskItem {
	type: HelpdeskItemType
	/** The numeric ID TDX embeds in the URL, or the href itself if none is found. */
	id: string
	title: string
	/** Absolute URL — handed straight to the WebView on drill-in. */
	href: string
	/** A description (search/category pages) or a category label (A-Z page). */
	snippet?: string
}

export type HelpdeskShape = 'resultList' | 'categoryList' | 'itemList'

export interface ShapeSelectors {
	/** Restricts matching to inside this container, when the page has chrome
	 * (nav, sidebar) that could otherwise false-match the item selector. */
	scope?: string
	item: string
	title: string
	snippet?: string
}

export interface SelectorConfig {
	version: number
	shapes: Record<HelpdeskShape, ShapeSelectors>
}
