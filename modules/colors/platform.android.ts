import {Appearance, PlatformColor, type ColorValue} from 'react-native'

/// Android's half of `./platform`: the same names, from colours any Android
/// theme has.
///
/// iOS's `PlatformColor` names (`label`, `systemBackground`, …) don't resolve
/// on Android, and `DynamicColorIOS` throws there as soon as it is called, so
/// loading `./platform` on Android would crash the app before its first screen.
/// This file stands in until the app has a Material theme: text and
/// backgrounds come from the platform theme's own attributes, which follow
/// light and dark, and the fixed hues are iOS's, picked for the appearance the
/// app launched in.

/** A colour the platform theme defines, read by its attribute name. */
function themed(attribute: string): ColorValue {
	return PlatformColor(`?android:attr/${attribute}`)
}

/** iOS's light or dark value, for the appearance the app launched in. */
function fixed(light: string, dark: string): ColorValue {
	return Appearance.getColorScheme() === 'dark' ? dark : light
}

// MARK: Label colors

export const label = themed('textColorPrimary')
export const secondaryLabel = themed('textColorSecondary')
export const tertiaryLabel = themed('textColorTertiary')
export const quaternaryLabel = themed('textColorHint')

// MARK: Fill colors

export const systemFill = fixed('#78788033', '#7878805C')
export const secondarySystemFill = fixed('#78788029', '#78788052')
export const tertiarySystemFill = fixed('#7676801F', '#7676803D')
export const quaternarySystemFill = fixed('#74748014', '#7676802E')

// MARK: Text colors

export const placeholderText = themed('textColorHint')

// MARK: Standard content background colors

export const systemBackground = themed('colorBackground')
export const secondarySystemBackground = fixed('#F2F2F7', '#1C1C1E')
export const tertiarySystemBackground = fixed('#FFFFFF', '#2C2C2E')

// MARK: Grouped content background colors

export const systemGroupedBackground = themed('colorBackground')
export const secondarySystemGroupedBackground = fixed('#FFFFFF', '#1C1C1E')
export const tertiarySystemGroupedBackground = fixed('#F2F2F7', '#2C2C2E')

// MARK: Separator colors

export const separator = fixed('#3C3C4349', '#54545899')
export const opaqueSeparator = fixed('#C6C6C8', '#38383A')

// MARK: Link color

export const link = themed('colorAccent')

// MARK: Adaptable colors

export const systemBlue = themed('colorAccent')
export const systemBrown = fixed('#A2845E', '#AC8E68')
export const systemCyan = fixed('#32ADE6', '#64D2FF')
export const systemGreen = fixed('#34C759', '#30D158')
export const systemIndigo = fixed('#5856D6', '#5E5CE6')
export const systemMint = fixed('#00C7BE', '#63E6E2')
export const systemOrange = fixed('#FF9500', '#FF9F0A')
export const systemPink = fixed('#FF2D55', '#FF375F')
export const systemPurple = fixed('#AF52DE', '#BF5AF2')
export const systemRed = fixed('#FF3B30', '#FF453A')
export const systemTeal = fixed('#30B0C7', '#40C8E0')
export const systemYellow = fixed('#FFCC00', '#FFD60A')

// MARK: Adaptable gray colors

export const systemGray = fixed('#8E8E93', '#8E8E93')
export const systemGray2 = fixed('#AEAEB2', '#636366')
export const systemGray3 = fixed('#C7C7CC', '#48484A')
export const systemGray4 = fixed('#D1D1D6', '#3A3A3C')
export const systemGray5 = fixed('#E5E5EA', '#2C2C2E')
export const systemGray6 = fixed('#F2F2F7', '#1C1C1E')

// MARK: Transparent color

export const clear = PlatformColor('@android:color/transparent')

// MARK: Custom adaptive colors

export const bodyText = fixed('#555555', '#DDDDDD')
export const diffAdditionFill = fixed('#E4F5E9', '#12351F')
export const diffDeletionFill = fixed('#FBE9E7', '#3B1513')
