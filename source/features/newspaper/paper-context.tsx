import * as React from 'react'

import type {CampusId} from '../../campuses'
import type {Paper} from './campus-section'

type PaperOnCampus = {paper: Paper; campus: CampusId}

/** The paper the reader's screens show, and its campus, which `newspaperRoute` provides. */
const PaperContext = React.createContext<PaperOnCampus | null>(null)

/** Shows `children` as screens of `campus`'s `paper`. */
export function PaperProvider({
	paper,
	campus,
	children,
}: {
	paper: Paper
	campus: CampusId
	children: React.ReactNode
}): React.ReactNode {
	let value = React.useMemo(() => ({paper, campus}), [paper, campus])
	return <PaperContext value={value}>{children}</PaperContext>
}

function usePaperContext(): PaperOnCampus {
	let value = React.useContext(PaperContext)
	if (!value) {
		throw new Error(
			"A paper's screen rendered outside a PaperProvider; its route file provides one",
		)
	}
	return value
}

/** The paper the screen shows. Throws for a screen no route wrapped in a `PaperProvider`. */
export function usePaper(): Paper {
	return usePaperContext().paper
}

/** The campus whose paper the screen shows; every link inside the reader carries it. */
export function usePaperCampus(): CampusId {
	return usePaperContext().campus
}
