import type {BalancesShapeType} from '../types'

/**
 * Balances for UI testing.
 *
 * There is no other way to see this screen: St. Olaf moved the balances login
 * behind Google sign-in, which the app cannot do, so every real run shows N/A
 * in each tile and the FAQ banner explaining why. Without fixtures the layout
 * can only ever be photographed empty.
 *
 * The figures are deliberately awkward -- a four-figure balance, a zero, and a
 * half meal -- so a tile that cannot fit its number, or that treats zero as
 * missing, shows up rather than passing on tidy round data.
 */
export const UITEST_BALANCES: BalancesShapeType = {
	flex: '$1,234.56',
	ole: '$0.00',
	print: '$12.34',
	daily: '2',
	weekly: '10.5',
	plan: 'Ole Unlimited',
}
