import type {ComponentProps} from 'react'
import type {ColorSchemeName, ColorValue} from 'react-native'
import type {Image} from '@expo/ui/swift-ui'
import type {BuildingStatusType} from '../types'

import {getAccentBackgroundColor} from './color-helpers'

/** The SF Symbol names `Image` will accept, taken from its own prop rather than
 * from a second copy of Apple's catalogue. */
type SymbolName = NonNullable<ComponentProps<typeof Image>['systemName']>

const SYMBOLS: Record<BuildingStatusType, SymbolName> = {
	Open: 'circle.fill',
	'Almost Open': 'circle.lefthalf.filled',
	'Almost Closed': 'circle.righthalf.filled',
	Chapel: 'bell.circle',
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
	scheme?: ColorSchemeName,
): {symbol: SymbolName; color: ColorValue} {
	let symbol = SYMBOLS[status]

	if (scheme === 'dark' && status === 'Almost Open') {
		symbol = 'circle.lefthalf.filled.inverse'
	}

	if (scheme === 'dark' && status === 'Almost Closed') {
		symbol = 'circle.righthalf.filled.inverse'
	}

	return {
		symbol,
		color: getAccentBackgroundColor(status),
	}
}
