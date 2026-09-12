import type {ColorValue} from 'react-native'
import type {BuildingStatusType, ServiceStatusType} from '../types'

import {getAccentBackgroundColor} from './color-helpers'

const SYMBOLS: Record<BuildingStatusType, string> = {
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
): {symbol: string; color: ColorValue} {
	return {
		symbol: (status === 'Service' ? service?.symbol : undefined) ?? SYMBOLS[status],
		color: getAccentBackgroundColor(status),
	}
}
