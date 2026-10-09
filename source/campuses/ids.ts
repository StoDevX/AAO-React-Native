/** Every campus this build knows, by id, in the order the campus switcher lists them. */
export const CAMPUS_IDS = ['edu.stolaf', 'edu.carleton'] as const

/** A campus's id: its domain reversed, such as `edu.carleton`. */
export type CampusId = (typeof CAMPUS_IDS)[number]
