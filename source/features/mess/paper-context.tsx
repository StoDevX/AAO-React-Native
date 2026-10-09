import * as React from 'react'

import type {Paper} from './campus-section'

/** The paper the reader's screens show, which each paper's route files provide. */
const PaperContext = React.createContext<Paper | null>(null)

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

/** The paper the screen shows. Throws for a screen no route wrapped in a `PaperProvider`. */
export function usePaper(): Paper {
	let paper = React.useContext(PaperContext)
	if (!paper) {
		throw new Error(
			"A paper's screen rendered outside a PaperProvider; its route file provides one",
		)
	}
	return paper
}
