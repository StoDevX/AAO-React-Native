/**
 * The place a link to the map opens, by its feature id: `/map?place=toh`.
 * Null when the link names none, or none the campus has -- which is also the
 * answer until its places have loaded.
 */
export function linkedPlace(
	link: string | undefined,
	places: ReadonlyArray<{id: string}>,
): string | null {
	if (!link) return null
	return places.some((place) => place.id === link) ? link : null
}
