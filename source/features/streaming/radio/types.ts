export type HtmlAudioError = {code: number; message: string}

export type PlayState = 'paused' | 'playing' | 'checking' | 'loading'

/** What the app-wide radio is doing. A live stream has no pause: it plays or it stops. */
export type RadioPlayState = 'stopped' | 'starting' | 'playing'
