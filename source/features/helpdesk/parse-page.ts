import {parse} from 'node-html-parser'
import * as Sentry from '@sentry/react-native'
import type {HelpdeskItem, HelpdeskItemType, SelectorConfig} from './types'
import {HELPDESK_BASE_URL, HELPDESK_PAGE_CONFIGS, type HelpdeskPageType} from './page-configs'

const ID_PATTERN = /\/(?:Service|Article|Category)\/(\d+)\//u

function itemTypeFromHref(href: string): HelpdeskItemType {
	if (href.includes('/Requests/Service/')) return 'service'
	if (href.includes('/KB/Article/')) return 'article'
	return 'category'
}

const absoluteHref = (href: string): string =>
	href.startsWith('http') ? href : `${HELPDESK_BASE_URL}${href}`

/**
 * Turns a fetched TDX portal page into a flat list of items. All markup
 * knowledge lives in `config` (see default-selectors.ts / selector-store.ts)
 * so a portal redesign is a config fix, not a parser rewrite.
 *
 * A scope selector that matches nothing usually means the portal's markup
 * shifted, not that the page legitimately has zero results -- that gets
 * reported to Sentry, but this still returns an empty array so the caller
 * renders its normal empty state rather than an error state.
 */
export function parseHelpdeskPage(
	html: string,
	pageType: HelpdeskPageType,
	config: SelectorConfig,
): HelpdeskItem[] {
	let {shape, itemType} = HELPDESK_PAGE_CONFIGS[pageType]
	let selectors = config.shapes[shape]
	let root = parse(html)
	let scope = selectors.scope ? root.querySelector(selectors.scope) : root

	if (!scope) {
		Sentry.captureMessage(
			`Helpdesk parser: scope selector "${selectors.scope}" matched nothing for page type "${pageType}" (shape "${shape}") -- the portal's markup may have changed`,
			{level: 'warning'},
		)
		return []
	}

	let items: HelpdeskItem[] = []

	for (let el of scope.querySelectorAll(selectors.item)) {
		let link = el.querySelector(selectors.title)
		let href = link?.getAttribute('href')
		let title = link?.text.trim()

		if (!href || !title) {
			continue
		}

		let absHref = absoluteHref(href)

		items.push({
			type: itemType ?? itemTypeFromHref(href),
			id: ID_PATTERN.exec(href)?.[1] ?? absHref,
			title,
			href: absHref,
			snippet: selectors.snippet
				? (el.querySelector(selectors.snippet)?.text.trim() ?? undefined)
				: undefined,
		})
	}

	return items
}
