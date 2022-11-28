import * as c from '@frogpond/colors'

export const BG_COLORS: Record<string, string> = {
	Open: c.moneyGreen,
	Closed: c.salmon,
}

export const FG_COLORS: Record<string, string> = {
	Open: c.hollyGreen,
	Closed: c.brickRed,
}

export let getAccentBackgroundColor = (openStatus: string): string =>
	BG_COLORS[openStatus] ?? c.goldenrod

export let getAccentTextColor = (openStatus: string): string =>
	FG_COLORS[openStatus] ?? 'rgb(130, 82, 45)'
