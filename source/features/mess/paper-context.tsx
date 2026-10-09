import * as React from 'react'

import {OLAF_MESSENGER_PAPER, type Paper} from './paper'

/** The paper the reader's screens show. The Messenger's routes need no provider. */
const PaperContext = React.createContext<Paper>(OLAF_MESSENGER_PAPER)

/** Shows `children` as screens of `paper`. */
export function PaperProvider({
	paper,
	children,
}: {
	paper: Paper
	children: React.ReactNode
}): React.ReactNode {
	return <PaperContext value={paper}>{children}</PaperContext>
}

/** The paper the screen shows. */
export function usePaper(): Paper {
	return React.useContext(PaperContext)
}
