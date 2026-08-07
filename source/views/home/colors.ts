import {displayP3} from '@frogpond/colors'

/// Health draws a card's title in opaque white but knocks its icon back to
/// roughly 79% -- both measured off the "Heart" card by solving
/// `ink = a*white + (1-a)*card` per channel against the gradient colour in the
/// same column. The red channel is useless for that fit (the card is already
/// ~236 there), so the figure comes from green and blue.
///
/// Dark mode mirrors it, measured the same way over four cards: the title is
/// opaque black and the icon lands within a couple of points of the light
/// mode's knock-back.
///
/// White and black are the same colour in sRGB and Display P3, so unlike the
/// card gradients these need no conversion -- but they go through the same
/// helper so every colour on this screen reaches SwiftUI by one route.
export const homescreenTitleLight = displayP3('color(display-p3 1 1 1)')
export const homescreenIconLight = displayP3('color(display-p3 1 1 1 / 0.79)')

export const homescreenTitleDark = displayP3('color(display-p3 0 0 0)')
export const homescreenIconDark = displayP3('color(display-p3 0 0 0 / 0.81)')

/// The disc behind the corner badge. Shortcuts sits its play button on a wash
/// of the foreground colour rather than a solid fill -- measured off a gold
/// card, the disc lifts the card's own colour by about a fifth of the way to
/// white without changing its hue.
export const homescreenBadgeLight = displayP3('color(display-p3 1 1 1 / 0.2)')
export const homescreenBadgeDark = displayP3('color(display-p3 0 0 0 / 0.2)')
