import type {FaqTarget} from './types'

export const FAQ_TARGETS = {
	HOME: 'Home',
	BALANCES: 'Balances',
	SETTINGS_ROOT: 'SettingsRoot',
} satisfies Record<string, FaqTarget>
