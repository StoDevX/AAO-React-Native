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
// the Shortcuts colour picker, which agrees with a real card to within 3/255.
// The inner stop can only be read off a card, at the top edge's centre where
// the radial starts.
//
// A colour sampled from a lossy capture cannot be trusted directly, but the
// ratio between its two stops largely can: applying a card's own outer-to-inner
// transform to the picker's exact outer cancels most of the shift. The signal
// that a capture is too far gone for even that is a saturation ratio outside
// the 0.78-0.94 the fifteen span.
//
// Health, not Shortcuts, is the reference for the card's *shape*: see button.tsx
// for the padding and icon metrics that keep the cards at Health's compact
// height.

export const redGradient: Gradient = [
	'color(display-p3 0.9294 0.4863 0.5216)',
	'color(display-p3 0.902 0.3882 0.4118)',
]
export const orangeGradient: Gradient = [
	'color(display-p3 0.9451 0.6275 0.5137)',
	'color(display-p3 0.9294 0.5176 0.4039)',
]
export const goldGradient: Gradient = [
	'color(display-p3 0.9608 0.7686 0.451)',
	'color(display-p3 0.9216 0.651 0.3529)',
]
export const yellowGradient: Gradient = [
	'color(display-p3 0.9725 0.851 0.3098)',
	'color(display-p3 0.9412 0.7412 0.2588)',
]
export const greenGradient: Gradient = [
	'color(display-p3 0.498 0.8784 0.4941)',
	'color(display-p3 0.4039 0.7608 0.3882)',
]
export const mintGradient: Gradient = [
	'color(display-p3 0.4157 0.902 0.7804)',
	'color(display-p3 0.3569 0.7843 0.6627)',
]
export const lightBlueGradient: Gradient = [
	'color(display-p3 0.3647 0.7961 0.9765)',
	'color(display-p3 0.3059 0.6784 0.9412)',
]
export const blueGradient: Gradient = [
	'color(display-p3 0.3255 0.6196 0.9686)',
	'color(display-p3 0.2353 0.5059 0.9608)',
]
export const indigoGradient: Gradient = [
	'color(display-p3 0.3765 0.4745 0.8392)',
	'color(display-p3 0.2667 0.3647 0.7216)',
]
export const purpleGradient: Gradient = [
	'color(display-p3 0.5882 0.4196 0.8392)',
	'color(display-p3 0.4745 0.3137 0.7176)',
]
export const violetGradient: Gradient = [
	'color(display-p3 0.7922 0.5765 0.9647)',
	'color(display-p3 0.6745 0.4627 0.8627)',
]
export const pinkGradient: Gradient = [
	'color(display-p3 0.9451 0.651 0.9294)',
	'color(display-p3 0.898 0.5451 0.8039)',
]
export const grayGradient: Gradient = [
	'color(display-p3 0.6235 0.6549 0.698)',
	'color(display-p3 0.5098 0.5412 0.5843)',
]
export const sageGradient: Gradient = [
	'color(display-p3 0.6745 0.7608 0.6824)',
	'color(display-p3 0.5569 0.6431 0.5647)',
]
export const tanGradient: Gradient = [
	'color(display-p3 0.7569 0.6667 0.5569)',
	'color(display-p3 0.6392 0.549 0.4392)',
]

// MARK: derived gradients
//
// Derived from a sampled gradient by preserving its inner-to-outer HSB
// saturation ratio: paleGoldGradient's ratio is 0.859 against goldGradient's
// 0.860, both inside the 0.78-0.94 band the sampled fifteen span.

/// Derived from goldGradient.
export const paleGoldGradient: Gradient = [
	'color(display-p3 0.8627 0.7765 0.5804)',
	'color(display-p3 0.7412 0.6549 0.4588)',
]
