import {usePaper} from './paper-context'
import {paperQueries, type PaperQueries} from './query'

/** The reader's queries for the paper the screen shows. */
export function usePaperQueries(): PaperQueries {
	return paperQueries(usePaper())
}
