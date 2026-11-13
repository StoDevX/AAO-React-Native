import {MaterialSymbols_400Regular_Filled} from '@expo-google-fonts/material-symbols/400Regular_Filled'
import type {SymbolViewProps} from 'expo-symbols'

/**
 * The `weight` that draws a `SymbolView`'s Android glyph filled, for the
 * radio's Play and Pause: Android draws media controls solid, as its own
 * players do, and expo-symbols draws from Google's outlined font, where they
 * are hollow. Everything else stays outlined, Material's default.
 */
export const FILLED_SYMBOL_WEIGHT: SymbolViewProps['weight'] = {
	ios: 'unspecified',
	android: {name: 'MaterialSymbols_400Regular_Filled', font: MaterialSymbols_400Regular_Filled},
}
