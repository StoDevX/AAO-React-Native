export interface FeatureFlagType {
	configKey: AppConfigEntry
	title: string
	active: boolean
}

/**
 * __DEV__ app config keys
 *
 * Reserved for dev-only flags for internal experimentation, these
 * will never be A/B flags nor will they return true in production.
 *
 * The format is SECTION_KEY where the first underscore will be
 * split at render time for our view to group by, but the entirety
 * of the value (section + key) will be stored.
 */
export enum AppConfigEntry {
	Courses_ShowRecentSearchScreen = 'Courses_ShowRecentSearchScreen',
}
