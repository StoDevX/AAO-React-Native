import type {InfiniteData} from '@tanstack/react-query'

/** A paged list's items as its one loaded page, for seeding a story list's cache. */
export function onePage<T>(items: T[]): InfiniteData<T[], number> {
	return {pages: [items], pageParams: [1]}
}
