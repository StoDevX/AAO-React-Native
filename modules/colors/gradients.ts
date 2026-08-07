/// A card's gradient, as [inner, outer]. Shortcuts paints its cards with a
/// radial gradient anchored at the top edge's centre, so these are the colour
/// at that point and the colour it has faded to by the far corners -- not a
/// top/bottom or left/right pair.
///
/// Both are Display P3, which is the space the screenshots they were sampled
/// from are in and the space Shortcuts draws them in, and both are written in
/// the CSS Color 4 syntax that says so. Writing them as hex would make a P3
/// value indistinguishable in source from an sRGB one, and passing one where
/// the other is expected renders the wrong colour without erroring. Pass them
/// through `displayP3` to get something a view can take. See display-p3.ts.
export type Gradient = [string, string]

// MARK: gradients
//
// Sampled from the Shortcuts cards themselves, on an iPhone 14 Pro. The
// components are eighth-bit readings off those screenshots, written as
// fractions -- so 0.9294 is 237/255, not a value measured to four places.
//
// The outer stop of every colour is the bottom edge of that colour's swatch in
// the Shortcuts colour picker: measured against eight real cards, the two agree
// to within 3/255, so the picker gives a consistent reading for all fifteen.
// The inner stop can only be read off a real card, and there is now a capture of
// all fifteen.
//
// Every inner stop is now read off a lossless capture. Four of them were
// derived from JPEGs first, by applying each card's own measured
// outer-to-inner transform to the picker's outer so the compression's colour
// shift would cancel rather than being baked in, and re-measuring them since
// says how well that worked: sage came back identical and tan within 2/255,
// while orange and gold each moved by 9. The two that moved were the two whose
// captures were shifted enough to throw their saturation ratios out of the
// range the others span -- which is the signal to distrust a reading, if this
// ever has to be done from a JPEG again.
//
// The card named against each colour is whichever shortcut happened to be that
// colour when it was captured, and is there to say where the reading came from
// rather than to describe the app. One of them was recoloured between captures,
// so it is named more than once.
//
// Health, not Shortcuts, is the reference for the card's *shape*: see button.tsx
// for the padding and icon metrics that keep the cards at Health's compact
// height.

// measured: Directory
export const redGradient: Gradient = [
	'color(display-p3 0.9294 0.4863 0.5216)',
	'color(display-p3 0.902 0.3882 0.4118)',
]
// measured: Important Contacts
export const orangeGradient: Gradient = [
	'color(display-p3 0.9451 0.6275 0.5137)',
	'color(display-p3 0.9294 0.5176 0.4039)',
]
// measured: Map
export const goldGradient: Gradient = [
	'color(display-p3 0.9608 0.7686 0.451)',
	'color(display-p3 0.9216 0.651 0.3529)',
]
// measured: SIS, Save To Reader
export const yellowGradient: Gradient = [
	'color(display-p3 0.9725 0.851 0.3098)',
	'color(display-p3 0.9412 0.7412 0.2588)',
]
// measured: Menus, Code Remotely
export const greenGradient: Gradient = [
	'color(display-p3 0.498 0.8784 0.4941)',
	'color(display-p3 0.4039 0.7608 0.3882)',
]
// measured: Repeat with Each, GIF to MP4
export const mintGradient: Gradient = [
	'color(display-p3 0.4157 0.902 0.7804)',
	'color(display-p3 0.3569 0.7843 0.6627)',
]
// measured: Streaming Media
export const lightBlueGradient: Gradient = [
	'color(display-p3 0.3647 0.7961 0.9765)',
	'color(display-p3 0.3059 0.6784 0.9412)',
]
// measured: Hours
export const blueGradient: Gradient = [
	'color(display-p3 0.3255 0.6196 0.9686)',
	'color(display-p3 0.2353 0.5059 0.9608)',
]
// measured: Map
export const indigoGradient: Gradient = [
	'color(display-p3 0.3765 0.4745 0.8392)',
	'color(display-p3 0.2667 0.3647 0.7216)',
]
// measured: News, Copy Article
export const purpleGradient: Gradient = [
	'color(display-p3 0.5882 0.4196 0.8392)',
	'color(display-p3 0.4745 0.3137 0.7176)',
]
// measured: Encode Media
export const violetGradient: Gradient = [
	'color(display-p3 0.7922 0.5765 0.9647)',
	'color(display-p3 0.6745 0.4627 0.8627)',
]
// measured: Calendar
export const pinkGradient: Gradient = [
	'color(display-p3 0.9451 0.651 0.9294)',
	'color(display-p3 0.898 0.5451 0.8039)',
]
// measured: Credit Cards
export const grayGradient: Gradient = [
	'color(display-p3 0.6235 0.6549 0.698)',
	'color(display-p3 0.5098 0.5412 0.5843)',
]
// measured: Campus Dictionary
export const sageGradient: Gradient = [
	'color(display-p3 0.6745 0.7608 0.6824)',
	'color(display-p3 0.5569 0.6431 0.5647)',
]
// measured: Map
export const tanGradient: Gradient = [
	'color(display-p3 0.7569 0.6667 0.5569)',
	'color(display-p3 0.6392 0.549 0.4392)',
]
