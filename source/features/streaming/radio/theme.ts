/** One of a station's logos, and the colour the player takes while it shows. */
export type RadioLogo = {
	/** How VoiceOver tells this logo from the station's others. */
	name: string
	/** Read when drawn: the address depends on the server setting. */
	readonly image: {uri: string}
	/** The player's fill, darkening downward, behind white text. */
	tint: string
	/** The paper of the record's centre label, behind the logo. */
	labelColor: string
	/** How much of the label's width the logo takes; 0.8 when unset. */
	labelScale?: number
}
