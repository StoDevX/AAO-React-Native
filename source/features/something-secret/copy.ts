import type {Stage} from './progress'

/** Carved into the slab's face, in capitals. */
export const INSCRIPTION = 'THIS IS NOT A BUTTON OF HONOR\nNO GLORIOUS DEEDS ARE CELEBRATED HERE'
/** On the red button. The question mark is the point. */
export const BUTTON_LABEL = 'do not push?'
/** What VoiceOver calls the space below the notice. */
export const SLAB_LABEL = 'Something secret'
export const SLAB_HINT = 'Double-tap repeatedly'
/** The dead screen's only line. */
export const RESTING = 'the app is resting.'
/** Shown for a moment after a shake escape. */
export const ANGERED = "you've angered it"

const ANNOUNCEMENTS: Record<Stage, string | null> = {
	blank: null,
	tremor: 'Something stirs',
	edge: 'Something rises from the ground',
	risen:
		'Words are carved into it. This is not a button of honor. No glorious deeds are celebrated here.',
	cracking: 'It is cracking',
	open: 'It has opened',
}

/** What VoiceOver says as the slab enters `stage`; nothing for the blank space. */
export function announcementFor(stage: Stage): string | null {
	return ANNOUNCEMENTS[stage]
}
