import type {ComponentProps} from 'react'
import type {ColorValue} from 'react-native'
import type {Image} from '@expo/ui/swift-ui'
import type {BuildingStatusType, ServiceStatusType} from '../types'

import {getAccentBackgroundColor} from './color-helpers'

/** The SF Symbol names `Image` will accept, taken from its own prop rather than
 * from a second copy of Apple's catalogue. */
type SymbolName = NonNullable<ComponentProps<typeof Image>['systemName']>

const SYMBOLS: Record<BuildingStatusType, SymbolName> = {
	Open: 'circle.fill',
	'Almost Open': 'circle.lefthalf.filled',
	'Almost Closed': 'circle.righthalf.filled',
	Chapel: 'bell.circle',
	// Replaced by the set's own symbol whenever one reaches us; this is only
	// what a service falls back to.
	Service: 'circle.fill',
	Closed: 'circle',
}

/**
 * The SF Symbol and colour a status shows on a row.
 *
 * Every symbol shares the circle silhouette, so the column stays aligned and
 * shape carries what colour could not: yellow alone means three different
 * things, and means nothing at all to a colourblind reader.
 */
export function statusGlyph(
	status: BuildingStatusType,
	service?: ServiceStatusType,
): {symbol: SymbolName; color: ColorValue} {
	// A symbol out of the data is an unchecked string: the schema can say it is
	// a string but not that Apple ships it, so a name with a typo in it draws
	// nothing. Ours are checked, because `SYMBOLS` is typed.
	let fromData = status === 'Service' ? (service?.symbol as SymbolName | undefined) : undefined

	return {
		symbol: fromData ?? SYMBOLS[status],
		color: getAccentBackgroundColor(status),
	}
}
