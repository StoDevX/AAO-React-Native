import type {RoutePattern} from './catalog'

/**
 * Joins Expo Router's segments into the route's file path. `useSegments()`
 * returns file names, not the filled-in URL, so a dynamic segment stays
 * `[word]` and the word itself is never sent.
 */
export function routePattern(segments: readonly string[]): RoutePattern {
	return `/${segments.join('/')}` as RoutePattern
}
