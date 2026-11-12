import {PlatformColor} from 'react-native'

import {adaptiveColor} from './adaptive'

/// Android's half of `./platform`: the same names, as Material 3 colours.
///
/// On Android `PlatformColor` takes resource paths, not iOS's semantic names,
/// so each colour names the Material role that plays the part its iOS
/// namesake does. A `?attr/` path is read from the activity's theme, which
/// plugins/with-material-theme makes a Material 3 DayNight theme with dynamic
/// colour: on Android 12 and later every role follows the wallpaper, and below
/// that it comes from the brand gold. Either way it follows light and dark.
///
/// The roles match `SEMANTIC_ROLES` in source/android-ui/colors.ts, which
/// resolves these same paths for Jetpack Compose, so a React Native view and a
/// Compose one given the same export draw the same colour.

/** A Material 3 colour role, read from the theme by its attribute name. */
function role(attribute: string) {
	return PlatformColor(`?attr/${attribute}`)
}

// MARK: Label colors

/** Primary text: Material's `onSurface`. */
export const label = role('colorOnSurface')

/** Secondary text: Material's `onSurfaceVariant`. */
export const secondaryLabel = role('colorOnSurfaceVariant')

/** Tertiary text: Material's `outline`. */
export const tertiaryLabel = role('colorOutline')

/** Quaternary text: Material's `outlineVariant`. */
export const quaternaryLabel = role('colorOutlineVariant')

// MARK: Fill colors

/** A fill for thin and small shapes: Material's `surfaceContainerHighest`. */
export const systemFill = role('colorSurfaceContainerHighest')

/** A fill for medium-size shapes: Material's `surfaceContainerHigh`. */
export const secondarySystemFill = role('colorSurfaceContainerHigh')

/** A fill for large shapes: Material's `surfaceContainerHigh`. */
export const tertiarySystemFill = role('colorSurfaceContainerHigh')

/** A fill for large areas with complex content: Material's `surfaceContainer`. */
export const quaternarySystemFill = role('colorSurfaceContainer')

// MARK: Text colors

/** Placeholder text: Material's `onSurfaceVariant`, as a text field's hint. */
export const placeholderText = role('colorOnSurfaceVariant')

// MARK: Standard content background colors

/** The main background: Material's `surface`. */
export const systemBackground = role('colorSurface')

/** Content on the main background: Material's `surfaceContainer`. */
export const secondarySystemBackground = role('colorSurfaceContainer')

/** Content on secondary backgrounds: Material's `surfaceContainerHigh`. */
export const tertiarySystemBackground = role('colorSurfaceContainerHigh')

// MARK: Grouped content background colors

/** The main background of a grouped interface: Material's `surface`. */
export const systemGroupedBackground = role('colorSurface')

/** Rows on a grouped background: Material's `surfaceContainer`. */
export const secondarySystemGroupedBackground = role('colorSurfaceContainer')

/** Content on grouped rows: Material's `surfaceContainerHigh`. */
export const tertiarySystemGroupedBackground = role('colorSurfaceContainerHigh')

// MARK: Separator colors

/** A divider: Material's `outlineVariant`. */
export const separator = role('colorOutlineVariant')

/** An opaque divider: Material's `outlineVariant`, which is already opaque. */
export const opaqueSeparator = role('colorOutlineVariant')

// MARK: Link color

/** A link: Material's `primary`. */
export const link = role('colorPrimary')

// MARK: Adaptable colors

/** The accent: Material's `primary`, which is what iOS's blue tint stands for. */
export const systemBlue = role('colorPrimary')

/** Brown, from `ADAPTIVE_COLORS`: iOS's hue has no Material role. */
export const systemBrown = adaptiveColor('systemBrown')

/** Cyan, from `ADAPTIVE_COLORS`: iOS's hue has no Material role. */
export const systemCyan = adaptiveColor('systemCyan')

/** Green, from `ADAPTIVE_COLORS`: iOS's hue has no Material role. */
export const systemGreen = adaptiveColor('systemGreen')

/** Indigo, from `ADAPTIVE_COLORS`: iOS's hue has no Material role. */
export const systemIndigo = adaptiveColor('systemIndigo')

/** Mint, from `ADAPTIVE_COLORS`: iOS's hue has no Material role. */
export const systemMint = adaptiveColor('systemMint')

/** Orange, from `ADAPTIVE_COLORS`: iOS's hue has no Material role. */
export const systemOrange = adaptiveColor('systemOrange')

/** Pink, from `ADAPTIVE_COLORS`: iOS's hue has no Material role. */
export const systemPink = adaptiveColor('systemPink')

/** Purple, from `ADAPTIVE_COLORS`: iOS's hue has no Material role. */
export const systemPurple = adaptiveColor('systemPurple')

/** Destructive and error states: Material's `error`. */
export const systemRed = role('colorError')

/** Teal, from `ADAPTIVE_COLORS`: iOS's hue has no Material role. */
export const systemTeal = adaptiveColor('systemTeal')

/** Yellow, from `ADAPTIVE_COLORS`: iOS's hue has no Material role. */
export const systemYellow = adaptiveColor('systemYellow')

// MARK: Adaptable gray colors

/** The base gray: Material's `outline`. */
export const systemGray = role('colorOutline')

/** The second gray: Material's `outline`. */
export const systemGray2 = role('colorOutline')

/** The third gray: Material's `outlineVariant`. */
export const systemGray3 = role('colorOutlineVariant')

/** The fourth gray: Material's `surfaceContainerHighest`. */
export const systemGray4 = role('colorSurfaceContainerHighest')

/** The fifth gray: Material's `surfaceContainerHigh`. */
export const systemGray5 = role('colorSurfaceContainerHigh')

/** The sixth gray: Material's `surfaceContainer`. */
export const systemGray6 = role('colorSurfaceContainer')

// MARK: Transparent color

/** No colour at all: Android's own transparent. */
export const clear = PlatformColor('@android:color/transparent')

// MARK: Custom adaptive colors

/** Body text in posts and comments: Material's `onSurfaceVariant`. */
export const bodyText = role('colorOnSurfaceVariant')

/**
 * The wash behind a sense a suggestion adds, and the one behind a sense it
 * removes: Material's `tertiaryContainer` and `errorContainer`. Both are
 * containers, so they sit quietly under `onSurface` text in light and dark.
 */
export const diffAdditionFill = role('colorTertiaryContainer')
export const diffDeletionFill = role('colorErrorContainer')
