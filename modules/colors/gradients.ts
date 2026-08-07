/// A card's gradient, as [inner, outer]. Shortcuts paints its cards with a
/// radial gradient anchored at the top edge's centre, so these are the colour
/// at that point and the colour it has faded to by the far corners -- not a
/// top/bottom or left/right pair.
export type Gradient = [string, string]

// MARK: gradients
//
// Sampled from the Shortcuts cards themselves, on an iPhone 14 Pro.
//
// The outer stop of every colour is the bottom edge of that colour's swatch in
// the Shortcuts colour picker: measured against eight real cards, the two agree
// to within 3/255, so the picker gives a consistent reading for all fifteen.
// The inner stop can only be read off a real card, and the captures cover
// eleven of the fifteen. The remaining four are derived from the relationship
// fitted to those eleven -- hue held, saturation x0.889, value moved 0.453 of
// the way to 1.0 -- which reproduces the measured inners to within 19/255 on
// the worst channel. Measured beats derived wherever both exist, hence the
// mixture below.
//
// Health, not Shortcuts, is the reference for the card's *shape*: see button.tsx
// for the padding and icon metrics that keep the cards at Health's compact
// height.

// measured: Directory
export const redGradient: Gradient = ['#ed7c85', '#e66369']
// derived
export const orangeGradient: Gradient = ['#f5957a', '#ed8467']
// derived
export const goldGradient: Gradient = ['#f4b46e', '#eba65a']
// measured: SIS, Save To Reader
export const yellowGradient: Gradient = ['#f8d94f', '#f0bd42']
// measured: Menus, Code Remotely
export const greenGradient: Gradient = ['#7fe07e', '#67c263']
// measured: Repeat with Each, GIF to MP4
export const mintGradient: Gradient = ['#6ae6c7', '#5bc8a9']
// measured: Streaming Media
export const lightBlueGradient: Gradient = ['#5dcbf9', '#4eadf0']
// measured: Hours
export const blueGradient: Gradient = ['#539ef7', '#3c81f5']
// measured: Map
export const indigoGradient: Gradient = ['#6079d6', '#445db8']
// measured: News, Copy Article
export const purpleGradient: Gradient = ['#966bd6', '#7950b7']
// measured: Encode Media
export const violetGradient: Gradient = ['#ca93f6', '#ac76dc']
// measured: Calendar
export const pinkGradient: Gradient = ['#f1a6ed', '#e58bcd']
// measured: Credit Cards
export const grayGradient: Gradient = ['#9fa7b2', '#828a95']
// derived
export const sageGradient: Gradient = ['#b5cdb7', '#8ea490']
// derived
export const tanGradient: Gradient = ['#cdb394', '#a38c70']
