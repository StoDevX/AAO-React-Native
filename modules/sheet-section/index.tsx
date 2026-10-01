import * as React from 'react'
import {Section} from '@expo/ui/swift-ui'
import {listRowBackground} from '@expo/ui/swift-ui/modifiers'
import * as c from '@frogpond/colors'

type Props = React.ComponentProps<typeof Section>

const OPAQUE_ROW = listRowBackground(c.secondarySystemGroupedBackground)
const OPAQUE_ROWS = [OPAQUE_ROW]

/**
 * A list section for a sheet, whose rows stay opaque at every detent.
 *
 * Below its largest detent, iOS draws a sheet as glass and gives grouped rows
 * a translucent grey to sit on it. The app's sheets paint an opaque background
 * instead, so those rows read as grey on grey; naming the row colour keeps them
 * the colour they have at the largest detent. A row that sets its own
 * background still draws it.
 */
export function SheetSection({modifiers, ...props}: Props): React.ReactNode {
	return <Section {...props} modifiers={modifiers ? [OPAQUE_ROW, ...modifiers] : OPAQUE_ROWS} />
}
