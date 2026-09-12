import * as c from '@frogpond/colors'
import {ColorValue} from 'react-native'
import type {BuildingStatusType} from '../types'

const BG_COLORS: Record<BuildingStatusType, ColorValue> = {
	Open: c.systemGreen,
	'Almost Open': c.systemYellow,
	'Almost Closed': c.systemYellow,
	Chapel: c.systemYellow,
	Service: c.systemGreen,
	Closed: c.systemRed,
}

export const getAccentBackgroundColor = (status: BuildingStatusType): ColorValue =>
	BG_COLORS[status]
