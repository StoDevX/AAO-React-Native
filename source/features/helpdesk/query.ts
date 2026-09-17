import ky from 'ky'
import {queryOptions} from '@tanstack/react-query'

import {parseHelpdeskPage} from './parse-page'
import {useSelectorConfigStore} from './selector-store'
import type {HelpdeskPageType} from './page-configs'

export const helpdeskKeys = {
	page: (pageType: HelpdeskPageType, url: string) => ['helpdesk', pageType, url] as const,
}

// The portal's own content changes on the order of days (new services,
// updated KB articles); a five-minute cache avoids hammering it on every
// screen focus without showing stale data across a session.
const staleTime = 1000 * 60 * 5

async function fetchHelpdeskPage(pageType: HelpdeskPageType, url: string, signal?: AbortSignal) {
	let html = await ky.get(url, {signal}).text()
	let config = useSelectorConfigStore.getState().config
	return parseHelpdeskPage(html, pageType, config)
}

// oxlint-disable-next-line typescript/explicit-module-boundary-types
export const helpdeskPageOptions = (pageType: HelpdeskPageType, url: string) =>
	queryOptions({
		queryKey: helpdeskKeys.page(pageType, url),
		queryFn: ({signal}) => fetchHelpdeskPage(pageType, url, signal),
		staleTime,
	})
