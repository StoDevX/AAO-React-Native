import type {ImageSourcePropType} from 'react-native'
import type {Campus} from '../query'

/**
 * The photograph a venue's detail screen shows, if there is one.
 *
 * The registry only ever holds St. Olaf's photos, and some of its slugs
 * collide with Carleton venues that share a name -- the Bookstore, the Post
 * Office -- or an unrelated key: Carleton's Writing Center keys to `disco`,
 * which at St. Olaf is a different room entirely. So the campus gates the
 * lookup rather than the key alone.
 */
export function buildingPhoto(
	campus: Campus,
	image: string | undefined,
	images: Map<string, ImageSourcePropType>,
): ImageSourcePropType | null {
	if (campus !== 'stolaf' || !image) {
		return null
	}

	return images.get(image) ?? null
}
