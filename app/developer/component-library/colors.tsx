// imported from https://github.com/facebook/react-native/blob/main/packages/rn-tester/js/examples/PlatformColor/PlatformColorExample.js

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import * as React from 'react'
import {DynamicColorIOS, Platform, PlatformColor, StyleSheet, Text, View} from 'react-native'
import {Section} from '@expo/ui/swift-ui'
import {Stack} from 'expo-router'
import {LibraryWrapper} from '../../../source/features/developer/component-library/base/library-wrapper'

/** A swatch in a table: what it is called, and the colour. */
type Swatch = {
	color: ReturnType<typeof PlatformColor>
	label: string
}

/**
 * The Material 3 theme's colour roles, which Android's `PlatformColor` reads as
 * theme attributes, and which `@frogpond/colors` maps iOS's names onto there.
 */
const MATERIAL_ROLES = [
	'colorPrimary',
	'colorOnPrimary',
	'colorPrimaryContainer',
	'colorOnPrimaryContainer',
	'colorSecondary',
	'colorOnSecondary',
	'colorSecondaryContainer',
	'colorOnSecondaryContainer',
	'colorTertiary',
	'colorOnTertiary',
	'colorTertiaryContainer',
	'colorOnTertiaryContainer',
	'colorError',
	'colorOnError',
	'colorErrorContainer',
	'colorOnErrorContainer',
	'colorSurface',
	'colorOnSurface',
	'colorOnSurfaceVariant',
	'colorSurfaceContainerLowest',
	'colorSurfaceContainerLow',
	'colorSurfaceContainer',
	'colorSurfaceContainerHigh',
	'colorSurfaceContainerHighest',
	'colorOutline',
	'colorOutlineVariant',
]

function createTable(): Array<Swatch> {
	if (Platform.OS === 'android') {
		return MATERIAL_ROLES.map((role) => ({label: role, color: PlatformColor(`?attr/${role}`)}))
	}
	return [
		// https://developer.apple.com/documentation/uikit/uicolor/ui_element_colors
		// Label Colors
		{label: 'label', color: PlatformColor('label')},
		{
			label: 'secondaryLabel',
			color: PlatformColor('secondaryLabel'),
		},
		{
			label: 'tertiaryLabel',
			color: PlatformColor('tertiaryLabel'),
		},
		{
			label: 'quaternaryLabel',
			color: PlatformColor('quaternaryLabel'),
		},
		// Fill Colors
		{label: 'systemFill', color: PlatformColor('systemFill')},
		{
			label: 'secondarySystemFill',
			color: PlatformColor('secondarySystemFill'),
		},
		{
			label: 'tertiarySystemFill',
			color: PlatformColor('tertiarySystemFill'),
		},
		{
			label: 'quaternarySystemFill',
			color: PlatformColor('quaternarySystemFill'),
		},
		// Text Colors
		{
			label: 'placeholderText',
			color: PlatformColor('placeholderText'),
		},
		// Standard Content Background Colors
		{
			label: 'systemBackground',
			color: PlatformColor('systemBackground'),
		},
		{
			label: 'secondarySystemBackground',
			color: PlatformColor('secondarySystemBackground'),
		},
		{
			label: 'tertiarySystemBackground',
			color: PlatformColor('tertiarySystemBackground'),
		},
		// Grouped Content Background Colors
		{
			label: 'systemGroupedBackground',
			color: PlatformColor('systemGroupedBackground'),
		},
		{
			label: 'secondarySystemGroupedBackground',
			color: PlatformColor('secondarySystemGroupedBackground'),
		},
		{
			label: 'tertiarySystemGroupedBackground',
			color: PlatformColor('tertiarySystemGroupedBackground'),
		},
		// Separator Colors
		{label: 'separator', color: PlatformColor('separator')},
		{
			label: 'opaqueSeparator',
			color: PlatformColor('opaqueSeparator'),
		},
		// Link Color
		{label: 'link', color: PlatformColor('link')},
		// Nonadaptable Colors
		{label: 'darkText', color: PlatformColor('darkText')},
		{label: 'lightText', color: PlatformColor('lightText')},
		// https://developer.apple.com/documentation/uikit/uicolor/standard_colors
		// Adaptable Colors
		{label: 'systemBlue', color: PlatformColor('systemBlue')},
		{label: 'systemBrown', color: PlatformColor('systemBrown')},
		{label: 'systemGreen', color: PlatformColor('systemGreen')},
		{label: 'systemIndigo', color: PlatformColor('systemIndigo')},
		{label: 'systemOrange', color: PlatformColor('systemOrange')},
		{label: 'systemPink', color: PlatformColor('systemPink')},
		{label: 'systemPurple', color: PlatformColor('systemPurple')},
		{label: 'systemRed', color: PlatformColor('systemRed')},
		{label: 'systemTeal', color: PlatformColor('systemTeal')},
		{label: 'systemYellow', color: PlatformColor('systemYellow')},
		// Adaptable Gray Colors
		{label: 'systemGray', color: PlatformColor('systemGray')},
		{label: 'systemGray2', color: PlatformColor('systemGray2')},
		{label: 'systemGray3', color: PlatformColor('systemGray3')},
		{label: 'systemGray4', color: PlatformColor('systemGray4')},
		{label: 'systemGray5', color: PlatformColor('systemGray5')},
		{label: 'systemGray6', color: PlatformColor('systemGray6')},
		// Transparent Color
		{label: 'clear', color: PlatformColor('clear')},
		{label: 'customColor', color: PlatformColor('customColor')},
	]
}

function PlatformColorsExample() {
	return (
		<View style={styles.column}>
			{createTable().map((color) => (
				<View key={color.label} style={styles.row}>
					<Text style={styles.labelCell}>{color.label}</Text>
					<View style={{...styles.colorCell, backgroundColor: color.color}} />
				</View>
			))}
		</View>
	)
}

function FallbackColorsExample() {
	let fallback = Platform.OS === 'android' ? '?attr/colorTertiary' : 'systemGreenColor'
	let color = {
		label: `PlatformColor('bogus', '${fallback}')`,
		color: PlatformColor('bogus', fallback),
	}

	return (
		<View style={styles.column}>
			<View style={styles.row}>
				<Text style={styles.labelCell}>{color.label}</Text>
				<View
					style={{
						...styles.colorCell,
						backgroundColor: color.color,
						borderColor: color.color,
					}}
				/>
			</View>
		</View>
	)
}
function DynamicColorsExample() {
	return (
		<View style={styles.column}>
			<View style={styles.row}>
				<Text style={styles.labelCell}>
					DynamicColorIOS({'{\n'}
					{'  '}light: &apos;red&apos;, dark: &apos;blue&apos;{'\n'}
					{'}'})
				</Text>
				<View
					style={{
						...styles.colorCell,
						backgroundColor: DynamicColorIOS({light: 'red', dark: 'blue'}),
					}}
				/>
			</View>
			<View style={styles.row}>
				<Text style={styles.labelCell}>
					DynamicColorIOS({'{\n'}
					{'  '}light: &apos;red&apos;, dark: &apos;blue&apos;{'\n'}
					{'}'})
				</Text>
				<View
					style={{
						...styles.colorCell,
						borderColor: DynamicColorIOS({light: 'red', dark: 'blue'}),
						borderWidth: 1,
					}}
				/>
			</View>
			<View style={styles.row}>
				<Text style={styles.labelCell}>
					DynamicColorIOS({'{\n'}
					{'  '}light: PlatformColor(&apos;systemBlueColor&apos;),{'\n'}
					{'  '}dark: PlatformColor(&apos;systemRedColor&apos;),{'\n'}
					{'}'})
				</Text>
				<View
					style={{
						...styles.colorCell,
						backgroundColor: DynamicColorIOS({
							light: PlatformColor('systemBlueColor'),
							dark: PlatformColor('systemRedColor'),
						}),
					}}
				/>
			</View>
		</View>
	)
}

function VariantColorsExample() {
	return (
		<View style={styles.column}>
			<View style={styles.row}>
				<Text style={styles.labelCell}>{"DynamicColorIOS({light: 'red', dark: 'blue'})"}</Text>
				<View
					style={{
						...styles.colorCell,
						backgroundColor: DynamicColorIOS({light: 'red', dark: 'blue'}),
					}}
				/>
			</View>
		</View>
	)
}

const styles = StyleSheet.create({
	column: {flex: 1, flexDirection: 'column'},
	row: {flex: 0.75, flexDirection: 'row'},
	labelCell: {
		flex: 1,
		alignItems: 'stretch',
		color: Platform.select({
			android: PlatformColor('?attr/colorOnSurface'),
			default: PlatformColor('labelColor'),
		}),
	},
	colorCell: {flex: 0.25, alignItems: 'stretch'},
})

export const NavigationKey = 'ColorsInfoView'

export default function ColorsLibraryPage(): React.ReactNode {
	return (
		<>
			<Stack.Title>Colors</Stack.Title>
			<LibraryWrapper>
				<>
					<Section title={Platform.OS === 'android' ? 'Material Colors' : 'Platform Colors'}>
						<PlatformColorsExample />
					</Section>

					<Section title="Fallback Colors">
						<FallbackColorsExample />
					</Section>

					{/* DynamicColorIOS throws anywhere but iOS. */}
					{Platform.OS === 'ios' ? (
						<>
							<Section title="iOS Dynamic Colors">
								<DynamicColorsExample />
							</Section>

							<Section title="Variant Colors">
								<VariantColorsExample />
							</Section>
						</>
					) : null}
				</>
			</LibraryWrapper>
		</>
	)
}
