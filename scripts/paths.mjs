import path from 'path'

import findUp from 'find-up'

const root = path.dirname(findUp.sync('package.json'))

export const DATA_BASE = path.join(root, 'data')
export const SCHEMA_BASE = path.join(root, 'data', '_schema')
