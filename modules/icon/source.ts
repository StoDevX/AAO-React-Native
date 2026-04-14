import {Ionicons} from '@react-native-vector-icons/ionicons'
import IoniconsGlyphs from '@react-native-vector-icons/ionicons/glyphmaps/Ionicons.json'

type IoniconsGlyphKey = keyof typeof IoniconsGlyphs

export const Icon = Ionicons
export type Glyphs = IoniconsGlyphKey
