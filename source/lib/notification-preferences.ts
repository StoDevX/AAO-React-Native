import AsyncStorage from '@react-native-async-storage/async-storage'
import {create} from 'zustand'
import {persist, createJSONStorage} from 'zustand/middleware'

type NotificationPreferencesStore = {
	/** Master switch — when false, no notifications are delivered regardless of feature settings. */
	enabled: boolean
	/** Per-feature opt-in map. Keys are feature identifiers (e.g. "menus", "calendar"). */
	features: Record<string, boolean>
	/** Enable or disable the master notification toggle. */
	setEnabled: (enabled: boolean) => void
	/** Enable or disable notifications for a specific feature. */
	setFeatureEnabled: (featureId: string, enabled: boolean) => void
	/** Returns the sorted list of feature IDs that have notifications enabled. */
	enabledFeatures: () => Array<string>
}

export const useNotificationPreferences =
	create<NotificationPreferencesStore>()(
		persist(
			(set, get) => ({
				enabled: false,
				features: {},
				setEnabled: (enabled) => set({enabled}),
				setFeatureEnabled: (featureId, enabled) =>
					set((state) => ({
						features: {...state.features, [featureId]: enabled},
					})),
				enabledFeatures: () =>
					Object.entries(get().features)
						.filter(([, on]) => on)
						.map(([id]) => id)
						.sort(),
			}),
			{
				name: 'notification-preferences',
				storage: createJSONStorage(() => AsyncStorage),
				version: 1,
			},
		),
	)
