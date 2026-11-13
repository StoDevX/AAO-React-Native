import {MaterialSymbols_400Regular_Filled} from '@expo-google-fonts/material-symbols/400Regular_Filled'
import type {SymbolViewProps} from 'expo-symbols'

/**
 * The `weight` that draws a `SymbolView`'s Android glyph filled. expo-symbols
 * draws Material Symbols from Google's outlined font, where Play and Stop are
 * hollow; this is the same weight from Google's filled font, which iOS's
 * `.fill` symbols match.
 */
export const FILLED_SYMBOL_WEIGHT: SymbolViewProps['weight'] = {
	ios: 'unspecified',
	android: {name: 'MaterialSymbols_400Regular_Filled', font: MaterialSymbols_400Regular_Filled},
}
