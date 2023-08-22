import {PlatformColor, Platform, OpaqueColorValue} from 'react-native'

// MARK: Label colors

/**
 * Temporary constant to get Android building
 *
 * Note: Android has issues with borderBottomColor of a view managed by RCTView
 * com.facebook.react.bridge.ReadableNativeMap cannot be cast to java.lang.Integer
 *
 * @todo: Replace these constants and make the necessary changes to align with
 *        Material You color palette. This issue is being tracked over at
 *        https://github.com/StoDevX/AAO-React-Native/issues/6919
 */
const TEMP_ANDROID_BACKGROUND = 'white' as unknown as OpaqueColorValue
const TEMP_ANDROID_FOREGROUND = 'black' as unknown as OpaqueColorValue

/**
 * The color for text labels that contain primary content.
 *
 * @see {@link secondaryLabel}, the color for text labels that contain secondary content.
 * @see {@link tertiaryLabel}, the color for text labels that contain tertiary content.
 * @see {@link quaternaryLabel}, the color for text labels that contain quaternary content.
 */
export const label = Platform.select({
	ios: PlatformColor('label'),
	android: PlatformColor('@android:color/primary_text_light'),
	default: TEMP_ANDROID_FOREGROUND,
})

/**
 * The color for text labels that contain secondary content.
 *
 * @see {@link label}, the color for text labels that contain primary content.
 * @see {@link tertiaryLabel}, the color for text labels that contain tertiary content.
 * @see {@link quaternaryLabel}, the color for text labels that contain quaternary content.
 */
export const secondaryLabel = Platform.select({
	ios: PlatformColor('secondaryLabel'),
	android: PlatformColor('@android:color/secondary_text_light'),
})

/**
 * The color for text labels that contain tertiary content.
 *
 * @see {@link label}, the color for text labels that contain primary content.
 * @see {@link secondaryLabel}, the color for text labels that contain secondary content.
 * @see {@link quaternaryLabel}, the color for text labels that contain quaternary content.
 */
export const tertiaryLabel = Platform.select({
	ios: PlatformColor('tertiaryLabel'),
	android: PlatformColor('@android:color/tertiary_text_light'),
})

/**
 * The color for text labels that contain quaternary content.
 *
 * @see {@link label}, the color for text labels that contain primary content.
 * @see {@link secondaryLabel}, the color for text labels that contain secondary content.
 * @see {@link tertiaryLabel}, the color for text labels that contain tertiary content.
 */
export const quaternaryLabel = Platform.select({
	ios: PlatformColor('quaternaryLabel'),
	android: TEMP_ANDROID_FOREGROUND,
})

// MARK: MARK: Fill colors

/**
 * An overlay fill color for thin and small shapes.
 *
 * Use system fill colors for items situated on top of an existing background color. System fill colors incorporate transparency to allow the background color to show through.
 *
 * @remarks
 * Use this color to fill thin or small shapes, such as the track of a slider.
 *
 * @see {@link secondarySystemFill}, an overlay fill color for medium-size shapes.
 * @see {@link tertiarySystemFill}, an overlay fill color for large shapes.
 * @see {@link quaternarySystemFill}, an overlay fill color for large areas that contain complex content.
 */
export const systemFill = Platform.select({
	ios: PlatformColor('systemFill'),
	android: TEMP_ANDROID_BACKGROUND,
})

/**
 * An overlay fill color for medium-size shapes.
 *
 * Use system fill colors for items situated on top of an existing background color. System fill colors incorporate transparency to allow the background color to show through.
 *
 * @remarks
 * Use this color to fill medium-size shapes, such as the background of a switch.
 *
 * @see {@link systemFill}, an overlay fill color for thin and small shapes.
 * @see {@link tertiarySystemFill}, an overlay fill color for large shapes.
 * @see {@link quaternarySystemFill}, an overlay fill color for large areas that contain complex content.
 */
export const secondarySystemFill = Platform.select({
	ios: PlatformColor('secondarySystemFill'),
	android: TEMP_ANDROID_BACKGROUND,
})

/**
 * An overlay fill color for large shapes.
 *
 * Use system fill colors for items situated on top of an existing background color. System fill colors incorporate transparency to allow the background color to show through.
 *
 * @remarks
 * Use this color to fill large shapes, such as input fields, search bars, or buttons.
 *
 * @see {@link systemFill}, an overlay fill color for thin and small shapes.
 * @see {@link secondarySystemFill}, an overlay fill color for medium-size shapes.
 * @see {@link quaternarySystemFill}, an overlay fill color for large areas that contain complex content.
 */
export const tertiarySystemFill = Platform.select({
	ios: PlatformColor('tertiarySystemFill'),
	android: TEMP_ANDROID_BACKGROUND,
})

/**
 * An overlay fill color for large areas that contain complex content.
 *
 * Use system fill colors for items situated on top of an existing background color. System fill colors incorporate transparency to allow the background color to show through.
 *
 * @remark
 * Use this color to fill large areas that contain complex content, such as an expanded table cell.
 *
 * @see {@link systemFill}, an overlay fill color for thin and small shapes.
 * @see {@link secondarySystemFill}, an overlay fill color for medium-size shapes.
 * @see {@link tertiarySystemFill}, an overlay fill color for large shapes.
 */
export const quaternarySystemFill = Platform.select({
	ios: PlatformColor('quaternarySystemFill'),
	android: TEMP_ANDROID_BACKGROUND,
})

// MARK: Text colors

/**
 * The color for placeholder text in controls or text views.
 */
export const placeholderText = Platform.select({
	ios: PlatformColor('placeholderText'),
	android: TEMP_ANDROID_FOREGROUND,
})

// MARK: Tint color

/**
 * A color value that resolves at runtime based on the current tint color of the app or trait hierarchy.
 */
export const tintColor = Platform.select({
	ios: PlatformColor('tintColor'),
	android: TEMP_ANDROID_FOREGROUND,
})

// MARK: Standard content background colors

/**
 * The color for the main background of your interface.
 *
 * Use this color for standard table views and designs that have a white primary background in a light environment.
 *
 * @see {@link secondarySystemBackground} - The color for the main background of your grouped interface.
 * @see {@link tertiarySystemBackground} - The color for content layered on top of the main background of your grouped interface.
 */
export const systemBackground = Platform.select({
	ios: PlatformColor('systemBackground'),
	android: TEMP_ANDROID_BACKGROUND,
})

/**
 * The color for content layered on top of the main background.
 *
 * Use this color for standard table views and designs that have a white primary background in a light environment.
 *
 * @see {@link systemBackground} - The color for the main background of your grouped interface.
 * @see {@link tertiarySystemBackground} - The color for content layered on top of the main background of your grouped interface.
 */
export const secondarySystemBackground = Platform.select({
	ios: PlatformColor('secondarySystemBackground'),
	android: TEMP_ANDROID_BACKGROUND,
})

/**
 * The color for content layered on top of secondary backgrounds.
 *
 * Use this color for standard table views and designs that have a white primary background in a light environment.
 *
 * @see {@link systemBackground} - The color for the main background of your grouped interface.
 * @see {@link secondarySystemBackground} - The color for content layered on top of the main background of your grouped interface.
 */
export const tertiarySystemBackground = Platform.select({
	ios: PlatformColor('tertiarySystemBackground'),
	android: TEMP_ANDROID_BACKGROUND,
})

// MARK: Grouped content background colors

/**
 * The color for the main background of your grouped interface.
 *
 * Use this color for grouped content, including table views and platter-based designs.
 *
 * @see {@link secondarySystemGroupedBackground} - The color for the main background of your grouped interface.
 * @see {@link tertiarySystemGroupedBackground} - The color for content layered on top of the main background of your grouped interface.
 */
export const systemGroupedBackground = Platform.select({
	ios: PlatformColor('systemGroupedBackground'),
	android: TEMP_ANDROID_BACKGROUND,
})

/**
 * The color for content layered on top of the main background of your grouped interface.
 *
 * Use this color for grouped content, including table views and platter-based designs.
 *
 * @see {@link systemGroupedBackground} - The color for the main background of your grouped interface.
 * @see {@link tertiarySystemGroupedBackground} - The color for content layered on top of the main background of your grouped interface.
 */
export const secondarySystemGroupedBackground = Platform.select({
	ios: PlatformColor('secondarySystemGroupedBackground'),
	android: TEMP_ANDROID_BACKGROUND,
})

/**
 * The color for content layered on top of secondary backgrounds of your grouped interface.
 *
 * Use this color for grouped content, including table views and platter-based designs.
 *
 * @see {@link systemGroupedBackground} - The color for the main background of your grouped interface.
 * @see {@link secondarySystemGroupedBackground} - The color for content layered on top of the main background of your grouped interface.
 */
export const tertiarySystemGroupedBackground = Platform.select({
	ios: PlatformColor('tertiarySystemGroupedBackground'),
	android: TEMP_ANDROID_BACKGROUND,
})

// MARK: Separator colors

/**
 * The color for thin borders or divider lines that allows some underlying content to be visible.
 *
 * @remark
 * This color may be partially transparent to allow the underlying content to show through. It adapts to the underlying trait environment.
 *
 * @see {@link opaqueSeparator} - The color for borders or divider lines that hides any underlying content.
 */
export const separator = Platform.select({
	ios: PlatformColor('separator'),
	android: TEMP_ANDROID_FOREGROUND,
})

/**
 * The color for borders or divider lines that hides any underlying content.
 *
 * @remark
 * This color is always opaque. It adapts to the underlying trait environment.
 *
 * @see {@link separator} - The color for borders or divider lines that hides any underlying content.
 */
export const opaqueSeparator = Platform.select({
	ios: PlatformColor('opaqueSeparator'),
	android: TEMP_ANDROID_FOREGROUND,
})

// MARK: Link color
/**
 * The specified color for links.
 */
export const link = Platform.select({
	ios: PlatformColor('link'),
	android: TEMP_ANDROID_FOREGROUND,
})

// MARK: Adaptable colors

/**
 * A blue color that automatically adapts to the current trait environment.
 */
export const systemBlue = Platform.select({
	ios: PlatformColor('systemBlue'),
	android: TEMP_ANDROID_FOREGROUND,
})

/**
 * A brown color that automatically adapts to the current trait environment.
 */
export const systemBrown = Platform.select({
	ios: PlatformColor('systemBrown'),
	android: TEMP_ANDROID_FOREGROUND,
})

/**
 * A cyan color that automatically adapts to the current trait environment.
 */
export const systemCyan = Platform.select({
	ios: PlatformColor('systemCyan'),
	android: TEMP_ANDROID_FOREGROUND,
})

/**
 * A green color that automatically adapts to the current trait environment.
 */
export const systemGreen = Platform.select({
	ios: PlatformColor('systemGreen'),
	android: TEMP_ANDROID_FOREGROUND,
	default: TEMP_ANDROID_FOREGROUND,
})

/**
 * An indigo color that automatically adapts to the current trait environment.
 */
export const systemIndigo = Platform.select({
	ios: PlatformColor('systemIndigo'),
	android: TEMP_ANDROID_FOREGROUND,
})

/**
 * A mint color that automatically adapts to the current trait environment.
 */
export const systemMint = Platform.select({
	ios: PlatformColor('systemMint'),
	android: TEMP_ANDROID_FOREGROUND,
})

/**
 * An orange color that automatically adapts to the current trait environment.
 */
export const systemOrange = Platform.select({
	ios: PlatformColor('systemOrange'),
	android: TEMP_ANDROID_FOREGROUND,
})

/**
 * A pink color that automatically adapts to the current trait environment.
 */
export const systemPink = Platform.select({
	ios: PlatformColor('systemPink'),
	android: TEMP_ANDROID_FOREGROUND,
})

/**
 * A purple color that automatically adapts to the current trait environment.
 */
export const systemPurple = Platform.select({
	ios: PlatformColor('systemPurple'),
	android: TEMP_ANDROID_FOREGROUND,
})

/**
 * A red color that automatically adapts to the current trait environment.
 */
export const systemRed = Platform.select({
	ios: PlatformColor('systemRed'),
	android: TEMP_ANDROID_FOREGROUND,
	default: TEMP_ANDROID_FOREGROUND,
})

/**
 * A teal color that automatically adapts to the current trait environment.
 */
export const systemTeal = Platform.select({
	ios: PlatformColor('systemTeal'),
	android: TEMP_ANDROID_FOREGROUND,
})

/**
 * A yellow color that automatically adapts to the current trait environment.
 */
export const systemYellow = Platform.select({
	ios: PlatformColor('systemYellow'),
	android: TEMP_ANDROID_FOREGROUND,
})

// MARK: Adaptable gray colors

/**
 * The standard base gray color that adapts to the environment.
 */
export const systemGray = Platform.select({
	ios: PlatformColor('systemGray'),
	android: TEMP_ANDROID_BACKGROUND,
})

/**
 * A second-level shade of gray that adapts to the environment.
 */
export const systemGray2 = Platform.select({
	ios: PlatformColor('systemGray2'),
	android: TEMP_ANDROID_BACKGROUND,
})

/**
 * A third-level shade of gray that adapts to the environment.
 */
export const systemGray3 = Platform.select({
	ios: PlatformColor('systemGray3'),
	android: TEMP_ANDROID_BACKGROUND,
})

/**
 * A fourth-level shade of gray that adapts to the environment.
 */
export const systemGray4 = Platform.select({
	ios: PlatformColor('systemGray4'),
	android: TEMP_ANDROID_BACKGROUND,
})

/**
 * A fifth-level shade of gray that adapts to the environment.
 */
export const systemGray5 = Platform.select({
	ios: PlatformColor('systemGray5'),
	android: TEMP_ANDROID_BACKGROUND,
})

/**
 * A sixth-level shade of gray that adapts to the environment.
 */
export const systemGray6 = Platform.select({
	ios: PlatformColor('systemGray6'),
	android: TEMP_ANDROID_BACKGROUND,
})

// MARK: Transparent color

/**
 * A color object with grayscale and alpha values that are both 0.0.
 */
export const clear = Platform.select({
	ios: PlatformColor('clear'),
	android: PlatformColor('@android:color/transparent'),
})

export const androidLightBackground = 'rgb(244, 244, 244)'
export const androidSeparator = 'rgb(224, 224, 224)'
export const androidDisabledIcon = 'rgb(224, 224, 224)'
export const androidTextColor = 'rgb(113, 113, 118)'
export const androidTabAccentColor = '#ffeb3b'
