import AsyncStorage from '@react-native-async-storage/async-storage'
import {create} from 'zustand'
import {createJSONStorage, persist} from 'zustand/middleware'

type DeveloperStore = {
	/**
	 * Whether DebugSwift's floating button shows. Off by default: the Developer
	 * screen opens DebugSwift without it.
	 */
	floatingButtonEnabled: boolean
	setFloatingButtonEnabled: (enabled: boolean) => void
}

export const useDeveloperStore = create<DeveloperStore>()(
	persist(
		(set) => ({
			floatingButtonEnabled: false,
			setFloatingButtonEnabled: (enabled) => set({floatingButtonEnabled: enabled}),
		}),
		{
			name: 'developer-preferences',
			storage: createJSONStorage(() => AsyncStorage),
			version: 1,
			partialize: (state) => ({floatingButtonEnabled: state.floatingButtonEnabled}),
		},
	),
)
