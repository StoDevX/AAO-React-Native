// The helper as the Mac app loads it: its handlers, and the protocol they speak.
import {PROTOCOL, createHandlers} from '../data-editor-helper.mjs'

globalThis.dataEditorHelper = {PROTOCOL, createHandlers}
