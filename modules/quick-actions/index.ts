import {NativeModule, requireNativeModule} from 'expo-modules-core'

/** One Home Screen quick action. */
export type QuickAction = {
	/** Unique among the actions; iOS calls it the item's type. */
	id: string
	title: string
	/** An SF Symbol name. */
	symbol: string
	/** The in-app route a tap opens, percent-encoded. */
	href: string
}

interface QuickActionsModule extends NativeModule {
	setQuickActions(actions: QuickAction[]): Promise<void>
}

const QuickActions = requireNativeModule<QuickActionsModule>('QuickActions')

/** Replace the app icon's quick actions. iOS shows at most four. */
export function setQuickActions(actions: QuickAction[]): Promise<void> {
	return QuickActions.setQuickActions(actions)
}
