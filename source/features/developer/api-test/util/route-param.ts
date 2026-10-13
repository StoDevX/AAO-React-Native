/**
 * A value made safe to pass as a route param. expo-router's useLocalSearchParams
 * runs decodeURIComponent over every param it hands back, even one given to
 * `router.navigate` directly, so a value that is itself encoded -- a request
 * path with `%26` in a query value -- would come back decoded once too often.
 * Encoding it once more here means it comes back exactly as sent.
 */
export function routeParam(value: string): string {
	return encodeURIComponent(value)
}
