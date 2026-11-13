import type {ImageSourcePropType} from 'react-native'

import {SYMBOL_ASSETS} from '../symbol-assets'
import {FALLBACK_SYMBOL, materialSymbolFor} from '../symbol-table'

/**
 * The bundled Material Symbol drawable for an SF Symbol name, ready for
 * Compose's `Icon`. Never throws: an unknown name draws `FALLBACK_SYMBOL`.
 */
export function symbolSource(sfName: string | undefined | null): ImageSourcePropType {
	let symbol = materialSymbolFor(sfName)
	let assets = SYMBOL_ASSETS[symbol.name] ?? SYMBOL_ASSETS[FALLBACK_SYMBOL]
	return (symbol.filled ? assets[1] : undefined) ?? assets[0]
}
