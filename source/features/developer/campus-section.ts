/**
 * Where a campus's ccc-server is, and how developer settings let someone point
 * the app at another one.
 */
export type ApiSection = {
	/**
	 * The campus's server, with a trailing slash: ky resolves a relative path
	 * against it, so without one the last segment is replaced rather than
	 * extended.
	 */
	defaultUrl: string
	/** The storage key a developer's override is saved under. */
	storageKey: string
	/** The heading of the campus's server field in developer settings. */
	devTitle: string
	/** Whether developer settings also list servers found on the local network. */
	discoverable?: true
}
