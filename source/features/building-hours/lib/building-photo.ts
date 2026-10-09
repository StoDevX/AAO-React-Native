import {remoteImage, type RemoteImage} from '../../../lib/remote-images'
import type {HoursSection} from '../campus-section'

/**
 * The photograph a venue's detail screen shows, if there is one: only on a
 * campus whose venues' `image` keys name published `spaces` pictures. Keys
 * collide across campuses -- Carleton's Writing Center keys to `disco`, at St.
 * Olaf a different room -- so the campus gates the lookup, not the key alone.
 */
export function buildingPhoto(
	hours: HoursSection | undefined,
	image: string | undefined,
): RemoteImage | null {
	if (!hours?.photos || !image) {
		return null
	}
	return remoteImage('spaces', image)
}
