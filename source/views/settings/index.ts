// General settings
export {
	View as SettingsView,
	NavigationOptions as SettingsNavigationOptions,
} from './screens/overview'
export {IconSettingsView} from './screens/change-icon'
export {CreditsView} from './screens/credits'
export {LegalView} from './screens/legal'
export {PrivacyView} from './screens/privacy'
export {
	View as FeatureFlagView,
	NavigationOptions as FeatureFlagNavigationOptions,
} from './screens/feature-flags'
export {
	Detail as FeatureFlagDetailView,
	DetailNavigationOptions as FeatureFlagDetailNavigationOptions,
} from './screens/feature-flags'

// Developer settings
export {DebugRootView} from './screens/debug'
export {APITestView, APITestNavigationOptions} from './screens/api-test'
export {
	NetworkLoggerView,
	NavigationOptions as NetworkLoggerNavigationOptions,
} from './screens/network-logger'

// Component library
export {
	ComponentLibrary,
	ComponentLibraryNavigationOptions,
	BadgeLibrary,
	ButtonLibrary,
	ColorsLibrary,
	ColorsLibraryNavigationKey,
	ContextMenuLibrary,
} from './screens/overview/component-library'
