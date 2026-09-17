import {
	kbCategoryUrl,
	kbUrl,
	searchUrl,
	serviceCatalogCategoryUrl,
	serviceCatalogUrl,
	servicesAtoZUrl,
} from '../page-configs'

describe('searchUrl', () => {
	it('builds the portal search URL for a query', () => {
		expect(searchUrl('wifi')).toBe(
			'https://stolafcarleton.teamdynamix.com/TDClient/1893/StOlaf/Shared/Search/?c=all&s=wifi',
		)
	})

	// A raw `&` or `#` in the query would otherwise be read as another query
	// param or a fragment, silently truncating the search.
	it('escapes punctuation in the query rather than truncating it', () => {
		expect(searchUrl('wifi & password #help')).toBe(
			'https://stolafcarleton.teamdynamix.com/TDClient/1893/StOlaf/Shared/Search/?c=all&s=wifi%20%26%20password%20%23help',
		)
	})
})

describe('serviceCatalogUrl', () => {
	it('builds the service catalog root URL', () => {
		expect(serviceCatalogUrl()).toBe(
			'https://stolafcarleton.teamdynamix.com/TDClient/1893/StOlaf/Requests/ServiceCatalog',
		)
	})
})

describe('serviceCatalogCategoryUrl', () => {
	it('builds a service catalog category URL from its id and slug', () => {
		expect(serviceCatalogCategoryUrl('12', 'network-and-wifi')).toBe(
			'https://stolafcarleton.teamdynamix.com/TDClient/1893/StOlaf/Requests/ServiceCatalog/Category/12/network-and-wifi',
		)
	})
})

describe('servicesAtoZUrl', () => {
	it('builds the Services A-Z URL', () => {
		expect(servicesAtoZUrl()).toBe(
			'https://stolafcarleton.teamdynamix.com/TDClient/1893/StOlaf/Services/ServicesAtoZ',
		)
	})
})

describe('kbUrl', () => {
	it('builds the knowledge base root URL', () => {
		expect(kbUrl()).toBe('https://stolafcarleton.teamdynamix.com/TDClient/1893/StOlaf/KB/')
	})
})

describe('kbCategoryUrl', () => {
	it('builds a knowledge base category URL from its id and slug', () => {
		expect(kbCategoryUrl('34', 'accounts-and-passwords')).toBe(
			'https://stolafcarleton.teamdynamix.com/TDClient/1893/StOlaf/KB/Category/34/accounts-and-passwords',
		)
	})
})
