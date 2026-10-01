import AsyncStorage from '@react-native-async-storage/async-storage'
import {create} from 'zustand'
import {createJSONStorage, persist} from 'zustand/middleware'

import {lockoutMinutes} from './lockout'

type SecretStore = {
	/** Every press of the red button, ever; each locks for longer. */
	pressCount: number
	/** When the current lockout ends, in milliseconds since the epoch, or null. */
	lockedUntil: number | null
	/** Records a press at `now` and locks the app. */
	press: (now: number) => void
	/** Ends the lockout early, keeping the press count. */
	unlock: () => void
}

export const useSecretStore = create<SecretStore>()(
	persist(
		(set) => ({
			pressCount: 0,
			lockedUntil: null,
			press: (now) =>
				set((state) => {
					let pressCount = state.pressCount + 1
					return {pressCount, lockedUntil: now + lockoutMinutes(pressCount) * 60_000}
				}),
			unlock: () => set({lockedUntil: null}),
		}),
		{
			name: 'something-secret',
			storage: createJSONStorage(() => AsyncStorage),
			version: 1,
		},
	),
)
