/**
 * Decide whether a pull request's growth passes the size gates.
 */

import {formatBytes} from './format.mjs'

/**
 * How much Hermes bytecode one pull request may add before the gate fails.
 * Bytecode is what the app ships, so it is what the gate measures.
 */
export const HERMES_GROWTH_LIMIT_BYTES = 10 * 1024

/** The label that lets intended growth through. */
export const ACCEPT_LABEL = 'size/accepted'

/**
 * Passes growth up to and including the limit, any growth on a pull request
 * labeled ACCEPT_LABEL, and any pull request with no baseline to compare.
 * `kind` says which: `within`, `accepted`, `over` (failed) or `unchecked`
 * (nothing to compare), so the report can say why it passed; all but
 * `unchecked` carry the `limit` they were held to.
 */
export function decideGate({hermes, labels, limit = HERMES_GROWTH_LIMIT_BYTES}) {
	if (hermes === null) {
		return {
			kind: 'unchecked',
			pass: true,
			message: 'No baseline to compare with, so the size gate passes.',
		}
	}
	if (hermes.delta <= limit) {
		return {kind: 'within', pass: true, limit, message: `Within the ${formatBytes(limit)} limit.`}
	}
	let growth = `Hermes bytecode grew ${formatBytes(hermes.delta)}, over the ${formatBytes(limit)} limit.`
	if (labels.includes(ACCEPT_LABEL)) {
		return {
			kind: 'accepted',
			pass: true,
			limit,
			message: `${growth} Growth accepted with \`${ACCEPT_LABEL}\`.`,
		}
	}
	return {
		kind: 'over',
		pass: false,
		limit,
		message: `${growth} Add the \`${ACCEPT_LABEL}\` label if the growth is intended.`,
	}
}

/**
 * How much one pull request may grow the app an iPhone installs, native
 * code and assets, before the app size gate fails. A placeholder until
 * master's reports give real deltas to set it from.
 */
export const APP_GROWTH_LIMIT_BYTES = 500 * 1024

/**
 * Whether a failed app size gate fails the check. Until it is, the comment
 * warns instead, while master's reports collect the deltas the limit is set
 * from.
 */
export const APP_GATE_ENFORCED = false

/**
 * Passes growth up to and including the limit, any growth on a pull request
 * labeled ACCEPT_LABEL, and any pull request with nothing to compare. Growth
 * over the limit warns instead of failing while the gate is not enforced.
 * `kind` says which, as `decideGate`'s does.
 */
export function decideAppGate({
	install,
	labels,
	limit = APP_GROWTH_LIMIT_BYTES,
	enforced = APP_GATE_ENFORCED,
}) {
	if (install === null) {
		return {
			kind: 'unchecked',
			pass: true,
			warn: false,
			message: 'No app size to compare with, so the app size gate passes.',
		}
	}
	if (install.delta <= limit) {
		return {
			kind: 'within',
			pass: true,
			warn: false,
			message: `Within the ${formatBytes(limit)} limit.`,
		}
	}
	let growth = `App install size grew ${formatBytes(install.delta)}, over the ${formatBytes(limit)} limit.`
	if (labels.includes(ACCEPT_LABEL)) {
		return {
			kind: 'accepted',
			pass: true,
			warn: false,
			message: `${growth} Growth accepted with \`${ACCEPT_LABEL}\`.`,
		}
	}
	if (!enforced) {
		return {
			kind: 'over',
			pass: true,
			warn: true,
			message: `${growth} The app size gate is report-only for now, so this passes.`,
		}
	}
	return {
		kind: 'over',
		pass: false,
		warn: false,
		message: `${growth} Add the \`${ACCEPT_LABEL}\` label if the growth is intended.`,
	}
}
