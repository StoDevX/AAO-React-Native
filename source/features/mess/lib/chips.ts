import {shortSection} from './byline'
import {MAIN_SECTIONS} from './posts'

/** A chip on the Mess front page: the newest issue, every issue, or one section, by its full name. */
export type MessChip = {kind: 'top'} | {kind: 'issues'} | {kind: 'section'; name: string}

/** The front page's chips, in the order they sit. */
export const MESS_CHIPS: MessChip[] = [
	{kind: 'top'},
	{kind: 'issues'},
	...MAIN_SECTIONS.map((name): MessChip => ({kind: 'section', name})),
]

/**
 * What the news filter store keeps for a chip: `Top`, `Issues`, or the section's full name, which
 * is also what the old filter saved for a section.
 */
export function chipKey(chip: MessChip): string {
	switch (chip.kind) {
		case 'top':
			return 'Top'
		case 'issues':
			return 'Issues'
		case 'section':
			return chip.name
		default: {
			// Every chip is named above; a new kind stops the compiler here.
			let _unhandled: never = chip
			return 'Top'
		}
	}
}

/** The chip a saved key names; Top for none, and for anything no chip has, such as a column. */
export function chipOf(saved: string | null): MessChip {
	return MESS_CHIPS.find((chip) => chipKey(chip) === saved) ?? {kind: 'top'}
}

/** A chip's label: "A&E" for Arts & Entertainment, as the paper shortens it. */
export function chipLabel(chip: MessChip): string {
	return chip.kind === 'section' ? shortSection(chip.name) : chipKey(chip)
}
