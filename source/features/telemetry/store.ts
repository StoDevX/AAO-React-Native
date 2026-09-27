import {randomUUID} from 'expo-crypto'
import {Storage} from 'expo-sqlite/kv-store'
import {create} from 'zustand'
import {createJSONStorage, persist, type StateStorage} from 'zustand/middleware'

/**
 * Storage that answers synchronously, so the store holds its saved state the
 * moment it is created. Sentry starts before the first render and must
 * already know whether this person opted out; AsyncStorage, which the other
 * stores use, answers too late for that.
 */
const synchronousStorage: StateStorage = {
	getItem: (name) => Storage.getItemSync(name),
	setItem: (name, value) => Storage.setItemSync(name, value),
	removeItem: (name) => {
		Storage.removeItemSync(name)
	},
}

type TelemetryState = {
	/** Whether this person shares anonymous usage and crash data. */
	enabled: boolean
	/**
	 * A random ID for this install, and the only user field Sentry gets.
	 * Forgotten on opt-out and remade on opt-in, so the two periods can't be
	 * joined.
	 */
	deviceId: string | null
	optIn: () => void
	optOut: () => void
	/** The device ID, made on first ask; `null` when opted out. */
	ensureDeviceId: () => string | null
}

export const useTelemetryStore = create<TelemetryState>()(
	persist(
		(set, get) => ({
			enabled: true,
			deviceId: null,
			optIn: () => set({enabled: true, deviceId: randomUUID()}),
			optOut: () => set({enabled: false, deviceId: null}),
			ensureDeviceId: () => {
				let {enabled, deviceId} = get()
				if (!enabled) {
					return null
				}
				if (deviceId) {
					return deviceId
				}
				let created = randomUUID()
				set({deviceId: created})
				return created
			},
		}),
		{
			name: 'telemetry-consent',
			storage: createJSONStorage(() => synchronousStorage),
			version: 1,
			partialize: ({enabled, deviceId}) => ({enabled, deviceId}),
		},
	),
)
