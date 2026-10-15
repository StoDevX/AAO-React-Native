/**
 * How long a caption, and the engine states that go with it, wait before they
 * show by default. The engine reads its own copy of the stream at the server's
 * live edge, and the radio player plays a few seconds behind that, so captions
 * shown on arrival run ahead of the sound. About 5 seconds, tuned by ear on a
 * phone; it drifts with the network, so the radio's dev settings can change it.
 */
export const CAPTION_DISPLAY_DELAY_MS = 5000
