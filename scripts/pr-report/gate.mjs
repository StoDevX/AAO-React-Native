/**
 * Decide whether a pull request's JS growth passes the size gate.
 */

import {formatBytes} from './format.mjs'

/**
 * How much Hermes bytecode one pull request may add before the gate fails.
 * Bytecode, not minified JS, because bytecode is what the app ships.
 */
export const HERMES_GROWTH_LIMIT_BYTES = 50 * 1024

/** The label that lets intended growth through. */
export const ACCEPT_LABEL = 'size/accepted'

/**
 * Passes growth up to and including the limit, any growth on a pull request
 * labeled ACCEPT_LABEL, and any pull request with no baseline to compare.
 */
export function decideGate({hermes, labels, limit = HERMES_GROWTH_LIMIT_BYTES}) {
	if (hermes === null) {
		return {pass: true, message: 'No baseline to compare with, so the size gate passes.'}
	}
	if (hermes.delta <= limit) {
		return {pass: true, message: `Within the ${formatBytes(limit)} limit.`}
	}
	let growth = `Hermes bytecode grew ${formatBytes(hermes.delta)}, over the ${formatBytes(limit)} limit.`
	if (labels.includes(ACCEPT_LABEL)) {
		return {pass: true, message: `${growth} Growth accepted with \`${ACCEPT_LABEL}\`.`}
	}
	return {
		pass: false,
		message: `${growth} Add the \`${ACCEPT_LABEL}\` label if the growth is intended.`,
	}
}
