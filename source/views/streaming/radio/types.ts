export interface Viewport {width: number; height: number}

export interface HtmlAudioError {code: number; message: string}

export type PlayState = 'paused' | 'playing' | 'checking' | 'loading'
