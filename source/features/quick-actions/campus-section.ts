/** A campus's Home Screen quick actions. A campus without one offers none. */
export type QuickActionsSection = {
	/**
	 * The destinations, by id, a fresh install starts with: at most four, each
	 * a café action from the menus section or a Home tile's title.
	 */
	defaults: ReadonlyArray<string>
}
