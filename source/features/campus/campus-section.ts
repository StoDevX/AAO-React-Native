/** What the app calls itself, and the college it is for, on one campus. */
export type BrandingSection = {
	/** The app's name, which titles Home: All About Olaf, or CARLS. */
	appName: string
	/** Where the app's support email goes. */
	supportEmail: string
	/** The college the app serves, and is not sponsored by. */
	college: string
	/** What the app is, in a sentence, above its history on About. */
	intro: string
	/** The notices Home picks one of for its foot. Dev mode adds its own. */
	notices: ReadonlyArray<string>
}
