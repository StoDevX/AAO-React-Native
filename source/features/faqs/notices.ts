import {FAQ_TARGETS} from './constants'
import type {Faq} from './types'

const BANNER_TARGETS: readonly string[] = Object.values(FAQ_TARGETS)

/**
 * The entries that draw a banner on some screen: the notices currently in
 * force. A plain FAQ, or an entry aimed at a screen that draws no banners,
 * is not one.
 */
export function noticesInForce(faqs: Faq[]): Faq[] {
	return faqs.filter((faq) => faq.targets.some((target) => BANNER_TARGETS.includes(target)))
}
