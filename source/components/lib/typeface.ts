import type {ColorValue} from 'react-native'
import * as c from '@frogpond/colors'

/**
 * The type a screen is set in: a font design, and the colours that read on the screen's
 * background. A shared row or header takes one so a screen with a background of its own, like the
 * Messenger's paper, draws it in that screen's type.
 */
export type Typeface = {
	/** The font design every line is set in. */
	design: 'default' | 'rounded' | 'serif' | 'monospaced'
	/** A title or a name. */
	label: ColorValue
	/** A quieter line under it: a detail, a role. */
	secondaryLabel: ColorValue
	/** The title of a row that does something in place. */
	tint: ColorValue
}

/** The system's own type, which a shared row or header draws unless given another. */
export const SYSTEM_TYPEFACE: Typeface = {
	design: 'default',
	label: c.label,
	secondaryLabel: c.secondaryLabel,
	tint: c.systemBlue,
}
