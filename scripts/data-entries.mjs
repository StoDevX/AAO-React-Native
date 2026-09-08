import {isNotJunk} from './junk.mjs'

/**
 * Whether a directory entry is part of the data set.
 *
 * Excludes OS junk and `_`-prefixed entries, which are conventions rather than
 * content -- `data/_schemas/` holds the schemas the data is validated against.
 * Every script reading a data directory has to agree on this, or one of them
 * trips over a file the others quietly ignore.
 */
export const isDataEntry = (filename) => isNotJunk(filename) && !filename.startsWith('_')
