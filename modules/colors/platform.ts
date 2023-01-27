import {PlatformColor} from 'react-native'

// MARK: Label colors

/**
 * The color for text labels that contain primary content.
 *
 * @see {@link secondaryLabel}, the color for text labels that contain secondary content.
 * @see {@link tertiaryLabel}, the color for text labels that contain tertiary content.
 * @see {@link quaternaryLabel}, the color for text labels that contain quaternary content.
 */
export const label = PlatformColor('label')

/**
 * The color for text labels that contain secondary content.
 *
 * @see {@link label}, the color for text labels that contain primary content.
 * @see {@link tertiaryLabel}, the color for text labels that contain tertiary content.
 * @see {@link quaternaryLabel}, the color for text labels that contain quaternary content.
 */
export const secondaryLabel = PlatformColor('secondaryLabel')

/**
 * The color for text labels that contain tertiary content.
 *
 * @see {@link label}, the color for text labels that contain primary content.
 * @see {@link secondaryLabel}, the color for text labels that contain secondary content.
 * @see {@link quaternaryLabel}, the color for text labels that contain quaternary content.
 */
export const tertiaryLabel = PlatformColor('tertiaryLabel')

/**
 * The color for text labels that contain quaternary content.
 *
 * @see {@link label}, the color for text labels that contain primary content.
 * @see {@link secondaryLabel}, the color for text labels that contain secondary content.
 * @see {@link tertiaryLabel}, the color for text labels that contain tertiary content.
 */
export const quaternaryLabel = PlatformColor('quaternaryLabel')

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
export const systemFill = PlatformColor('systemFill')

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
export const secondarySystemFill = PlatformColor('secondarySystemFill')

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
export const tertiarySystemFill = PlatformColor('tertiarySystemFill')

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
export const quaternarySystemFill = PlatformColor('quaternarySystemFill')

// MARK: Text colors

/**
 * The color for placeholder text in controls or text views.
 */
export const placeholderText = PlatformColor('placeholderText')

// MARK: Tint color

/**
 * A color value that resolves at runtime based on the current tint color of the app or trait hierarchy.
 */
export const tintColor = PlatformColor('tintColor')

// MARK: Standard content background colors

/**
 * The color for the main background of your interface.
 *
 * Use this color for standard table views and designs that have a white primary background in a light environment.
 *
 * @see {@link secondarySystemBackground} - The color for the main background of your grouped interface.
 * @see {@link tertiarySystemBackground} - The color for content layered on top of the main background of your grouped interface.
 */
export const systemBackground = PlatformColor('systemBackground')

/**
 * The color for content layered on top of the main background.
 *
 * Use this color for standard table views and designs that have a white primary background in a light environment.
 *
 * @see {@link systemBackground} - The color for the main background of your grouped interface.
 * @see {@link tertiarySystemBackground} - The color for content layered on top of the main background of your grouped interface.
 */
export const secondarySystemBackground = PlatformColor(
	'secondarySystemBackground',
)

/**
 * The color for content layered on top of secondary backgrounds.
 *
 * Use this color for standard table views and designs that have a white primary background in a light environment.
 *
 * @see {@link systemBackground} - The color for the main background of your grouped interface.
 * @see {@link secondarySystemBackground} - The color for content layered on top of the main background of your grouped interface.
 */
export const tertiarySystemBackground = PlatformColor(
	'tertiarySystemBackground',
)

// MARK: Grouped content background colors

/**
 * The color for the main background of your grouped interface.
 *
 * Use this color for grouped content, including table views and platter-based designs.
 *
 * @see {@link secondarySystemGroupedBackground} - The color for the main background of your grouped interface.
 * @see {@link tertiarySystemGroupedBackground} - The color for content layered on top of the main background of your grouped interface.
 */
export const systemGroupedBackground = PlatformColor('systemGroupedBackground')

/**
 * The color for content layered on top of the main background of your grouped interface.
 *
 * Use this color for grouped content, including table views and platter-based designs.
 *
 * @see {@link systemGroupedBackground} - The color for the main background of your grouped interface.
 * @see {@link tertiarySystemGroupedBackground} - The color for content layered on top of the main background of your grouped interface.
 */
export const secondarySystemGroupedBackground = PlatformColor(
	'secondarySystemGroupedBackground',
)

/**
 * The color for content layered on top of secondary backgrounds of your grouped interface.
 *
 * Use this color for grouped content, including table views and platter-based designs.
 *
 * @see {@link systemGroupedBackground} - The color for the main background of your grouped interface.
 * @see {@link secondarySystemGroupedBackground} - The color for content layered on top of the main background of your grouped interface.
 */
export const tertiarySystemGroupedBackground = PlatformColor(
	'tertiarySystemGroupedBackground',
)

// MARK: Separator colors

/**
 * The color for thin borders or divider lines that allows some underlying content to be visible.
 *
 * @remark
 * This color may be partially transparent to allow the underlying content to show through. It adapts to the underlying trait environment.
 *
 * @see {@link opaqueSeparator} - The color for borders or divider lines that hides any underlying content.
 */
export const separator = PlatformColor('separator')

/**
 * The color for borders or divider lines that hides any underlying content.
 *
 * @remark
 * This color is always opaque. It adapts to the underlying trait environment.
 *
 * @see {@link separator} - The color for borders or divider lines that hides any underlying content.
 */
export const opaqueSeparator = PlatformColor('opaqueSeparator')

// MARK: Link color
/**
 * The specified color for links.
 */
export const link = PlatformColor('link')

// MARK: Adaptable colors

/**
 * A blue color that automatically adapts to the current trait environment.
 */
export const systemBlue = PlatformColor('systemBlue')

/**
 * A brown color that automatically adapts to the current trait environment.
 */
export const systemBrown = PlatformColor('systemBrown')

/**
 * A cyan color that automatically adapts to the current trait environment.
 */
export const systemCyan = PlatformColor('systemCyan')

/**
 * A green color that automatically adapts to the current trait environment.
 */
export const systemGreen = PlatformColor('systemGreen')

/**
 * An indigo color that automatically adapts to the current trait environment.
 */
export const systemIndigo = PlatformColor('systemIndigo')

/**
 * A mint color that automatically adapts to the current trait environment.
 */
export const systemMint = PlatformColor('systemMint')

/**
 * An orange color that automatically adapts to the current trait environment.
 */
export const systemOrange = PlatformColor('systemOrange')

/**
 * A pink color that automatically adapts to the current trait environment.
 */
export const systemPink = PlatformColor('systemPink')

/**
 * A purple color that automatically adapts to the current trait environment.
 */
export const systemPurple = PlatformColor('systemPurple')

/**
 * A red color that automatically adapts to the current trait environment.
 */
export const systemRed = PlatformColor('systemRed')

/**
 * A teal color that automatically adapts to the current trait environment.
 */
export const systemTeal = PlatformColor('systemTeal')

/**
 * A yellow color that automatically adapts to the current trait environment.
 */
export const systemYellow = PlatformColor('systemYellow')

// MARK: Adaptable gray colors

/**
 * The standard base gray color that adapts to the environment.
 */
export const systemGray = PlatformColor('systemGray')

/**
 * A second-level shade of gray that adapts to the environment.
 */
export const systemGray2 = PlatformColor('systemGray2')

/**
 * A third-level shade of gray that adapts to the environment.
 */
export const systemGray3 = PlatformColor('systemGray3')

/**
 * A fourth-level shade of gray that adapts to the environment.
 */
export const systemGray4 = PlatformColor('systemGray4')

/**
 * A fifth-level shade of gray that adapts to the environment.
 */
export const systemGray5 = PlatformColor('systemGray5')

/**
 * A sixth-level shade of gray that adapts to the environment.
 */
export const systemGray6 = PlatformColor('systemGray6')

// MARK: Transparent color

/**
 * A color object with grayscale and alpha values that are both 0.0.
 */
export const clear = PlatformColor('clear')

export const androidLightBackground = 'rgb(244, 244, 244)'
export const androidSeparator = 'rgb(224, 224, 224)'
export const androidDisabledIcon = 'rgb(224, 224, 224)'
export const androidTextColor = 'rgb(113, 113, 118)'
export const androidTabAccentColor = '#ffeb3b'
