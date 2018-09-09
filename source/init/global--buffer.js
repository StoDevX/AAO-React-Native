// @flow

/*
 * Put `Buffer` into the global namespace for nodejs code that expects it to
 * exist there.
 */

import {Buffer} from 'buffer'

global.Buffer = Buffer
