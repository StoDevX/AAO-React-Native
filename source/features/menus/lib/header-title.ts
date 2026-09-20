/** The line under the cafe's name, e.g. `Sun • Lunch • 11AM – 1:30PM`. */
export function subtitle(...parts: (string | null)[]): string {
	return parts.filter(Boolean).join(' • ')
}

/**
 * The window as VoiceOver should hear it. Read aloud, the dash in
 * `11AM – 1:30PM` is either silence or the word "dash".
 *
 * The spaces around the dash go with it, or the words it separates end up
 * three spaces apart.
 */
export function spokenTime(time: string): string {
	return time.replace(' – ', ' to ')
}
