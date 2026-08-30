import type {ItemCorIconMapType, MasterCorIconMapType} from '../types'

/**
 * The cafe's cor-icon keys that this item carries, in the cafe's own order so
 * every row lists its icons the same way round.
 */
export function dietaryIconKeys(
	corIcons: MasterCorIconMapType,
	dietary: ItemCorIconMapType,
): string[] {
	let itemKeys = new Set(Object.keys(dietary))
	return Object.keys(corIcons).filter((key) => itemKeys.has(key))
}
