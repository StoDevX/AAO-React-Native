import path from 'node:path'
import {fileURLToPath} from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export const DATA_BASE = path.join(__dirname, '..', 'data')
export const SCHEMA_BASE = path.join(__dirname, '..', 'data', '_schemas')
