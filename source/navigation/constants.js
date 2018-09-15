// @flow

import {IS_PRODUCTION} from '@frogpond/constants'

export const persistenceKey = IS_PRODUCTION ? 'NavState' : null
