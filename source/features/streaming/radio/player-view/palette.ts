import {StyleSheet} from 'react-native'

/** The player's colours: white over the tint fill, as Music's full player. */
const colors = {
	primary: '#ffffff',
	secondary: 'rgba(255, 255, 255, 0.7)',
	tertiary: 'rgba(255, 255, 255, 0.4)',
	track: 'rgba(255, 255, 255, 0.25)',
}

export const palette = {
	primary: colors.primary,
	secondary: colors.secondary,
	tertiary: colors.tertiary,
	track: colors.track,
	styles: StyleSheet.create({
		primary: {color: colors.primary},
		secondary: {color: colors.secondary},
		tertiary: {color: colors.tertiary},
		track: {backgroundColor: colors.track},
	}),
}
