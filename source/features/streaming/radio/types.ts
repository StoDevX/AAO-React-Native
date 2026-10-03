export type HtmlAudioError = {code: number; message: string}

export type PlayState = 'paused' | 'playing' | 'checking' | 'loading'

/**
 * What the app-wide radio is doing with its station. A paused station stays
 * loaded, but a live stream has no place to resume from, so playing it again
 * starts the stream afresh.
 */
export type RadioPlayState = 'stopped' | 'starting' | 'playing' | 'paused'
