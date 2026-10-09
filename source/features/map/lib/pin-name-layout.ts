import type {SymbolLayerSpecification} from '@maplibre/maplibre-react-native'

/// St. Olaf's and Carleton's styles serve Noto Sans and nothing else. A font
/// the style does not serve -- MapLibre's default stack, left unset -- 404s,
/// and the source's tiles then never finish, so the pins vanish with their
/// names. A campus whose basemap serves another names it as `labelFont`.
const PIN_FONT = 'Noto Sans Medium'

/// A place's name under its dot, shared by the pins and the selected place,
/// set in `font` or, when the campus names none, Noto Sans.
export function pinNameLayout(font: string | undefined): SymbolLayerSpecification['layout'] {
	return {
		'text-field': ['get', 'name'],
		'text-font': [font ?? PIN_FONT],
		'text-size': 12,
		'text-offset': [0, 0.9],
		'text-anchor': 'top',
	}
}
