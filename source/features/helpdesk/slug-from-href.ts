/**
 * Pulls the URL slug off the end of a category `href` (e.g.
 * `.../ServiceCatalog/Category/14765/Report-an-Issue` -> `Report-an-Issue`),
 * for handing to `serviceCatalogCategoryUrl`/`kbCategoryUrl`, which take the
 * slug as its own argument rather than a full path.
 *
 * Strips a query string and any trailing slash first -- TDX categories don't
 * carry either in `parse-page.ts`'s fixtures, but a naive `.split('/').pop()`
 * would silently return `''` for a trailing slash, breaking navigation.
 */
export function slugFromHref(href: string): string {
	let path = href.split('?')[0].replace(/\/+$/u, '')
	return path.split('/').pop() ?? ''
}
