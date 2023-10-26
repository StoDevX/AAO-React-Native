import IoniconsGlyphs from 'react-native-vector-icons/glyphmaps/Ionicons.json'
import * as Ionicons from 'react-native-vector-icons/Ionicons'

type IoniconsGlyphKey = keyof typeof IoniconsGlyphs

export const Icon = Ionicons.default
export type Glyphs = IoniconsGlyphKey
