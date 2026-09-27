/// One place on a floor. `venue` (an Hours venue's name) or `point` (a map
/// feature id) says what it opens when its name differs from its target's.
export type DirectoryEntry = {name: string; room?: string; venue?: string; point?: string}

/// A floor, as its building names it, with what is on it.
export type DirectoryFloor = {name: string; entries: Array<DirectoryEntry>}

/// What is on each floor of one building, bottom to top.
export type BuildingDirectory = {building: string; floors: Array<DirectoryFloor>}
