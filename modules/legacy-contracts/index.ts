import {release as v2_0} from './releases/v2.0'
import {release as v2_1} from './releases/v2.1'
import {release as v2_2} from './releases/v2.2'
import {release as v2_3} from './releases/v2.3'
import {release as v2_4} from './releases/v2.4'
import {release as v2_5} from './releases/v2.5'
import {release as v2_6} from './releases/v2.6'
import {release as v2_7} from './releases/v2.7'
import type {Release} from './types'

export type {Contract, Release, ResponseFormat} from './types'

/** The final build of each minor version from 2.0 to 2.7, oldest first. */
export const releases: readonly Release[] = [v2_0, v2_1, v2_2, v2_3, v2_4, v2_5, v2_6, v2_7]
