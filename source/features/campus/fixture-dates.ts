// Read by the app (fixtures.ts) and by the recorder (scripts/campus-fixtures.mjs),
// so the two write a recording's key the same way. No React Native imports:
// Node runs this file as it is.

/** The St. Olaf calendar's feed (The Events Calendar), by its URL. */
export const TEC_EVENTS = /tribe\/events\/v1\/events/u

/** The window the app asks TEC for, which `tecWindow` takes from the day's date. */
const DATED_PARAMS = /([?&](?:ends_after|starts_before)=)[^&]*/gu

/**
 * `url`, with the St. Olaf calendar's window written `{date}` so a recording
 * answers on any day; the recorder moves the recorded events onto the frozen
 * day to match. Any other URL keeps its dates.
 */
export function undatedUrl(url: string): string {
	return TEC_EVENTS.test(url) ? url.replaceAll(DATED_PARAMS, '$1{date}') : url
}
