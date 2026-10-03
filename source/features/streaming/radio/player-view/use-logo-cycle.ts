import type {Station} from '../stations'
import {useRadioStore} from '../store'
import type {RadioLogo} from '../theme'

/**
 * The station's logo on show, and how to move to the next. Each station keeps
 * the logo it was left on, across sheet opens and app launches. A saved logo
 * the station no longer has reads as the first.
 */
export function useLogoCycle(station: Station): {logo: RadioLogo; showNextLogo?: () => void} {
	let {logos} = station
	let logo = useSelectedLogo(station)
	let index = logos.indexOf(logo)
	let setLogoIndex = useRadioStore((state) => state.setLogoIndex)
	let showNextLogo =
		logos.length > 1 ? () => setLogoIndex(station.id, (index + 1) % logos.length) : undefined
	return {logo, showNextLogo}
}

/**
 * The logo the station is left on, for anywhere that draws it beside the
 * sheet, such as the Now Playing bar, so the two never show different ones.
 */
export function useSelectedLogo(station: Station): RadioLogo {
	let {logos} = station
	let saved = useRadioStore((state) => state.logoIndexes[station.id]) ?? 0
	return logos[saved < logos.length ? saved : 0]
}
