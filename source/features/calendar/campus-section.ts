/** A campus's calendar screen. */
export type CalendarSection = {
	/**
	 * The calendars it offers, by their ids in the sources manifest
	 * (`stolaf`, `presence`) -- source ids, not campus ids. The manifest
	 * says which server each is read from.
	 */
	sources: readonly string[]
}
