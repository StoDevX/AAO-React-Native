import {remoteImage, type RemoteImage} from '../../../lib/remote-images'
import type {Campus} from '../types'

/**
 * The photograph a venue's detail screen shows, if there is one.
 *
 * The photos are St. Olaf's alone, and some of its slugs collide with
 * Carleton venues that share a name -- the Bookstore, the Post Office -- or an
 * unrelated key: Carleton's Writing Center keys to `disco`, which at St. Olaf
 * is a different room entirely. So the campus gates the lookup rather than the
 * key alone.
 */
export function buildingPhoto(campus: Campus, image: string | undefined): RemoteImage | null {
	if (campus !== 'stolaf' || !image) {
		return null
	}

	return remoteImage('spaces', image)
}
