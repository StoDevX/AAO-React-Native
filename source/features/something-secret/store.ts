import AsyncStorage from '@react-native-async-storage/async-storage'
import {create} from 'zustand'
import {createJSONStorage, persist} from 'zustand/middleware'

import {wakeUp} from './burial'
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
	/** Whether the slab's space is gone from the home screen until the app has rested. */
	buried: boolean
	/** When the app was last in the foreground, in milliseconds since the epoch, or null. */
	lastActiveAt: number | null
	/** Takes the slab's space away. */
	bury: () => void
	/** Records the app coming to the foreground at `now`, digging the slab up after a rest. */
	wake: (now: number) => void
	/** Records the app leaving the foreground at `now`. */
	noteActive: (now: number) => void
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
			buried: false,
			lastActiveAt: null,
			bury: () => set({buried: true}),
			wake: (now) => set((state) => wakeUp(state, now)),
			noteActive: (now) => set({lastActiveAt: now}),
		}),
		{
			name: 'something-secret',
			storage: createJSONStorage(() => AsyncStorage),
			version: 1,
		},
	),
)
