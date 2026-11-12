import colors from './adaptive-colors.json'

/** A fixed colour's value in each appearance, as CSS hex (`#RRGGBB` or `#RRGGBBAA`). */
export type AdaptivePair = {light: string; dark: string}

/** The name of a colour in `ADAPTIVE_COLORS`. */
export type AdaptiveColorName = keyof typeof colors

/**
 * Fixed colours that have a light and a dark value but no system or Material
 * role to stand for: iOS's system hues on Android, and the newspaper's paper
 * and ink.
 *
 * One table for every place that needs them: `adaptiveColor` builds each for
 * iOS with `DynamicColorIOS`; app.config.ts hands them to
 * plugins/with-material-theme, which writes each as an Android colour
 * resource with a night variant; and source/android-ui resolves the same
 * names for Jetpack Compose. It is JSON so app.config.ts can read it, as
 * Expo's config loader cannot import TypeScript.
 */
export const ADAPTIVE_COLORS: Readonly<Record<AdaptiveColorName, AdaptivePair>> = colors
