// @flow

import {IS_PRODUCTION} from '@frogpond/constants'

// disabling navigation persistence until we finish an audit of the app
// export const persistenceKey = IS_PRODUCTION ? 'NavState' : null
export const persistenceKey = null
