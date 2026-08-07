/// Health draws a card's title in opaque white but knocks its icon back to
/// roughly 79% -- both measured off the "Heart" card by solving
/// `ink = a*white + (1-a)*card` per channel against the gradient colour in the
/// same column. The red channel is useless for that fit (the card is already
/// ~236 there), so the figure comes from green and blue.
export const homescreenTitleLight = 'rgb(255, 255, 255)'
export const homescreenIconLight = 'rgba(255, 255, 255, 0.79)'

/// Dark mode mirrors it, measured the same way over four cards: the title is
/// opaque black and the icon lands within a couple of points of the light
/// mode's knock-back. Health keeps the same card gradients in both schemes --
/// across the Heart card they differ by at most 6/255 -- so only these two
/// colours change.
export const homescreenTitleDark = 'rgb(0, 0, 0)'
export const homescreenIconDark = 'rgba(0, 0, 0, 0.81)'
