/** The tap count at which the slab splits open. */
export const OPEN_AT = 250
/** Seconds without a tap before the slab starts to sink. */
const IDLE_GRACE_SECONDS = 10
/** Taps lost per idle second once sinking. */
const DECAY_PER_SECOND = 5
/** Taps at or below this never roar; the slab has not broken the surface yet. */
const SILENT_THROUGH = 30
/** The chance that a tap past `SILENT_THROUGH` roars. */
const ROAR_CHANCE = 1 / 40

export type Stage = 'blank' | 'tremor' | 'edge' | 'risen' | 'cracking' | 'open'

/** The stages from buried to open, for telling a rise from a sink. */
export const STAGE_ORDER: Stage[] = ['blank', 'tremor', 'edge', 'risen', 'cracking', 'open']

/** The tap counts each in-between stage covers, first and last inclusive. */
const SPANS: Array<{stage: Stage; first: number; last: number}> = [
	{stage: 'tremor', first: 1, last: 30},
	{stage: 'edge', first: 31, last: 80},
	{stage: 'risen', first: 81, last: 150},
	{stage: 'cracking', first: 151, last: OPEN_AT - 1},
]

/** One tap's worth of progress, capped at open. */
export function tap(progress: number): number {
	return Math.min(progress + 1, OPEN_AT)
}

/** Progress after `idleSeconds` without a tap. An open slab stays open. */
export function decay(progress: number, idleSeconds: number): number {
	if (progress >= OPEN_AT) {
		return progress
	}
	let sinking = idleSeconds - IDLE_GRACE_SECONDS
	if (sinking <= 0) {
		return progress
	}
	return Math.max(0, progress - Math.floor(sinking * DECAY_PER_SECOND))
}

/** Which stage a tap count is in, and how far through it, from just begun to complete (1). */
export function stageFor(progress: number): {stage: Stage; fraction: number} {
	// Written as "not above zero" so NaN lands here too: a slab that cannot say how far it has
	// risen stays buried, never open on someone's home screen.
	if (!(progress > 0)) {
		return {stage: 'blank', fraction: 0}
	}
	for (let span of SPANS) {
		if (progress <= span.last) {
			return {
				stage: span.stage,
				fraction: (progress - span.first + 1) / (span.last - span.first + 1),
			}
		}
	}
	return {stage: 'open', fraction: 1}
}

/**
 * Whether the tap that brought the slab to `progress` roars. `draw` is a uniform
 * random number in [0, 1), passed in so tests can choose it.
 */
export function shouldRoar(progress: number, draw: number): boolean {
	if (progress >= OPEN_AT) {
		return true
	}
	return progress > SILENT_THROUGH && draw < ROAR_CHANCE
}
