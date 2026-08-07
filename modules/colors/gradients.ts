/// A card's gradient, as [inner, outer]. Shortcuts paints its cards with a
/// radial gradient anchored at the top edge's centre, so these are the colour
/// at that point and the colour it has faded to by the far corners -- not a
/// top/bottom or left/right pair.
///
/// Both are Display P3, which is the space the screenshots they were sampled
/// from are in and the space Shortcuts draws them in. They are *not* sRGB hex
/// and must not be handed to anything that will read them as such: pass them
/// through `displayP3` first. See display-p3.ts.
export type Gradient = [string, string]

// MARK: gradients
//
// Sampled from the Shortcuts cards themselves, on an iPhone 14 Pro. Every value
// below is Display P3 -- see the note on Gradient.
//
// The outer stop of every colour is the bottom edge of that colour's swatch in
// the Shortcuts colour picker: measured against eight real cards, the two agree
// to within 3/255, so the picker gives a consistent reading for all fifteen.
// The inner stop can only be read off a real card, and there is now a capture of
// all fifteen.
//
// Four of them (orange, gold, sage, tan) come from JPEGs rather than PNGs. Their
// outer stops still come from the picker, and their inner stops were derived by
// applying each card's own measured outer-to-inner transform to that exact
// outer, so the compression's colour shift largely cancels rather than being
// baked in. Orange needed one more step: its capture is shifted enough that the
// outer read 24/255 off the picker and the saturation ratio came out at 0.974,
// outside the 0.78-0.94 the other fourteen span, so it takes the fitted ratio
// and keeps only its own (unremarkable) value term.
//
// Health, not Shortcuts, is the reference for the card's *shape*: see button.tsx
// for the padding and icon metrics that keep the cards at Health's compact
// height.

// measured: Directory
export const redGradient: Gradient = ['#ed7c85', '#e66369']
// measured: Important Contacts
export const orangeGradient: Gradient = ['#f9977c', '#ed8467']
// measured: Important Contacts
export const goldGradient: Gradient = ['#f8bb77', '#eba65a']
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
// measured: Campus Dictionary
export const sageGradient: Gradient = ['#acc2ae', '#8ea490']
// measured: Map
export const tanGradient: Gradient = ['#c3ac90', '#a38c70']
