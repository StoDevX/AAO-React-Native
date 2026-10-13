import type {CampusId} from '../../campuses/ids'

/** Webcams and streamed events, as St. Olaf's server lists them. */
export type StreamingSection = {
	/** The campus whose server lists them; the campus's own when absent. */
	server?: CampusId
}
