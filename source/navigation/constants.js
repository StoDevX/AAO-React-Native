// @flow

import {IS_PRODUCTION} from '../lib/constants'

export const persistenceKey = IS_PRODUCTION ? 'NavState' : null
