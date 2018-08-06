// @flow

export type Viewport = {width: number, height: number}

export type HtmlAudioError = {code: number, message: string}

export type PlayState = 'paused' | 'playing' | 'checking' | 'loading'

export type PlayerTheme = {|
	tintColor: ?string,
	buttonTextColor: ?string,
	textColor: ?string,
	imageBorderColor: ?string,
	imageBackgroundColor: ?string,
|}
