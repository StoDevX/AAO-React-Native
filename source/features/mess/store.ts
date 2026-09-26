import AsyncStorage from '@react-native-async-storage/async-storage'
import {create} from 'zustand'
import {createJSONStorage, persist} from 'zustand/middleware'
import type {ZodiacSign} from './types'

type MessStore = {
	/** The sign the reader last read; Horoscopes posts open on it */
	lastSign: ZodiacSign | null
	setSign: (sign: ZodiacSign) => void
}

export const useMessStore = create<MessStore>()(
	persist((set) => ({lastSign: null, setSign: (sign) => set({lastSign: sign})}), {
		name: 'mess-preferences',
		storage: createJSONStorage(() => AsyncStorage),
		version: 1,
	}),
)
