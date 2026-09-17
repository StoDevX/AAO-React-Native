import type {SelectorConfig} from './types'

/**
 * Fallback selectors. Used until the remote config (see selector-store.ts)
 * loads, and again if that fetch fails, so a portal redesign that breaks
 * scraping doesn't take the feature down before the remote config is fixed.
 */
export const DEFAULT_SELECTOR_CONFIG: SelectorConfig = {
	version: 1,
	shapes: {
		resultList: {
			scope: '#divContent',
			item: '.search-result',
			title: 'h2.h3 a',
			snippet: '.result-desc',
		},
		categoryList: {
			scope: '#divCats',
			item: '.category-box',
			title: '.category-title a',
			snippet: '.category-box-description small',
		},
		itemList: {
			item: '.gutter-bottom-lg',
			title: 'h3.gutter-bottom-xs a',
			snippet: '.breadcrumb',
		},
	},
}
