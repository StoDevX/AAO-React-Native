import type {Moment} from 'moment-timezone'
import type {BonAppCafeDay, EditedBonAppCafeInfoType} from '../types'

/** What to say about a cafe that is not serving and gave no reason of its own. */
const CLOSED_TODAY = 'Closed today'

/**
 * Whether anyone is being served at this cafe today.
 *
 * An empty `dayparts` is ccc-server's own marker rather than a guess about
 * one: its `CustomCafe()` is the only thing that produces the shape, and it is
 * what the cafe endpoint answers with when Bon Appétit's page carries no menu
 * at all -- `Café is closed` -- or when fetching it failed. A cafe that is
 * serving gets its dayparts from Bon Appétit and has at least one.
 *
 * `status` is the contract's own flag, and the schema names `closed` as one of
 * its values, but nothing in ccc-server ever assigns it -- every response takes
 * the schema's `''` default. It is honoured here for a server that starts
 * setting it; the dayparts are what actually answer today.
 */
function isClosedDay(day: BonAppCafeDay): boolean {
	return day.status === 'closed' || day.dayparts.length === 0
}

/**
 * The cafe's own account of why it has nothing on today -- `Café is closed`,
 * `Could not load café from BonApp` -- or `null` for a cafe that is serving.
 *
 * Only for a day nobody is served on. A cafe can carry a standing message
 * while serving a full menu, and Bon Appétit leaves those up for weeks; shown
 * beside a menu it would read as a closure that is not happening.
 */
export function findCafeMessage(cafeInfo: EditedBonAppCafeInfoType, now: Moment): string | null {
	let today = now.format('YYYY-MM-DD')
	let todayMenu = cafeInfo.cafe.days.find(({date}) => date === today)

	if (!todayMenu) {
		return CLOSED_TODAY
	}

	if (!isClosedDay(todayMenu)) {
		return null
	}

	// `CustomCafe()` always sets one, so the fallback is for the case it does
	// not cover: a cafe whose page loaded carrying no dayparts of its own.
	// `message` is `false` rather than empty when there is nothing to say.
	return todayMenu.message || CLOSED_TODAY
}
