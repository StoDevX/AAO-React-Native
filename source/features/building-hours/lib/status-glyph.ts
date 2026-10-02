import type {ComponentProps} from 'react'
import type {ColorValue} from 'react-native'
import type {Image} from '@expo/ui/swift-ui'
import type {BuildingStatusType} from '../types'

import {getAccentBackgroundColor} from './color-helpers'

/** The SF Symbol names `Image` will accept, taken from its own prop rather than
 * from a second copy of Apple's catalogue. */
type SymbolName = NonNullable<ComponentProps<typeof Image>['systemName']>

const SYMBOLS: Record<BuildingStatusType, SymbolName> = {
	Open: 'circle.fill',
	'Almost Open': 'record.circle',
	'Almost Closed': 'record.circle',
	Chapel: 'bell.circle',
	Closed: 'circle',
}

/**
 * The SF Symbol and colour a status shows on a row.
 *
 * Every symbol shares the circle silhouette, so the column stays aligned, and
 * each status has its own shape as well as its own colour, so neither has to
 * carry the meaning alone for a colourblind reader. Almost Open and Almost
 * Closed share a dot in a ring, between the full and empty circles; the row's
 * text says which way the change goes.
 */
export function statusGlyph(status: BuildingStatusType): {symbol: SymbolName; color: ColorValue} {
	return {
		symbol: SYMBOLS[status],
		color: getAccentBackgroundColor(status),
	}
}
