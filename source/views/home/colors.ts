/// Health draws a card's title in opaque white but knocks its icon back to
/// roughly 79% -- both measured off the "Heart" card by solving
/// `ink = a*white + (1-a)*card` per channel against the gradient colour in the
/// same column. The red channel is useless for that fit (the card is already
/// ~236 there), so the figure comes from green and blue.
export const homescreenTitleLight = 'rgb(255, 255, 255)'
export const homescreenIconLight = 'rgba(255, 255, 255, 0.79)'

/// Dark mode is unmeasured -- there's no Health reference capture for it yet --
/// so both keep the value the light pair used before it was split.
export const homescreenTitleDark = 'rgba(0, 0, 0, 0.65)'
export const homescreenIconDark = 'rgba(0, 0, 0, 0.65)'
