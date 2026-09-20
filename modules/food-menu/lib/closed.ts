/**
 * Whether a label is BonApp's own word for a cafe that is not serving.
 *
 * BonApp shuts a cafe by publishing one daypart holding one station holding
 * one item, each labelled `Closed`, rather than by any flag we could read --
 * so the word is the signal, and it is read in one place rather than matched
 * wherever it is needed.
 */
export function isClosedLabel(label: string): boolean {
	return label.toUpperCase() === 'CLOSED'
}
