import type {HelpdeskItemType, HelpdeskShape} from './types'

export type HelpdeskPageType =
	| 'search'
	| 'serviceCatalog'
	| 'serviceCatalogCategory'
	| 'servicesAtoZ'
	| 'kb'
	| 'kbCategory'

export const HELPDESK_BASE_URL = 'https://stolafcarleton.teamdynamix.com'
// 1893 is St. Olaf's numeric TDX client ID; StOlaf is the portal slug.
const PORTAL_PATH = '/TDClient/1893/StOlaf'

interface PageConfig {
	shape: HelpdeskShape
	/** Every item on this page is this type. Absent on `search`, whose items
	 * mix types and must be read from each item's own href. */
	itemType?: HelpdeskItemType
}

export const HELPDESK_PAGE_CONFIGS: Record<HelpdeskPageType, PageConfig> = {
	search: {shape: 'resultList'},
	serviceCatalog: {shape: 'categoryList', itemType: 'category'},
	serviceCatalogCategory: {shape: 'itemList', itemType: 'service'},
	servicesAtoZ: {shape: 'itemList', itemType: 'service'},
	kb: {shape: 'categoryList', itemType: 'category'},
	kbCategory: {shape: 'itemList', itemType: 'article'},
}

export const searchUrl = (query: string): string =>
	`${HELPDESK_BASE_URL}${PORTAL_PATH}/Shared/Search/?c=all&s=${encodeURIComponent(query)}`

export const serviceCatalogUrl = (): string =>
	`${HELPDESK_BASE_URL}${PORTAL_PATH}/Requests/ServiceCatalog`

export const serviceCatalogCategoryUrl = (id: string, slug: string): string =>
	`${HELPDESK_BASE_URL}${PORTAL_PATH}/Requests/ServiceCatalog/Category/${id}/${slug}`

export const servicesAtoZUrl = (): string =>
	`${HELPDESK_BASE_URL}${PORTAL_PATH}/Services/ServicesAtoZ`

// The trailing slash is load-bearing -- TDX's real KB root URL includes it,
// verified against the live portal.
export const kbUrl = (): string => `${HELPDESK_BASE_URL}${PORTAL_PATH}/KB/`

export const kbCategoryUrl = (id: string, slug: string): string =>
	`${HELPDESK_BASE_URL}${PORTAL_PATH}/KB/Category/${id}/${slug}`
