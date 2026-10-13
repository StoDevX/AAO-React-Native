import type {CampusId} from '../../campuses/ids'

export type DictionarySection = {
	/** Whether an entry offers Suggest an Edit, which files against this dictionary's data. */
	acceptsSuggestions: boolean
	/** The campus whose server has the dictionary; the campus's own when absent. */
	server?: CampusId
}
