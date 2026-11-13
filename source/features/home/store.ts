import {createLayoutStore} from '../../lib/layout-store'

/** How home lays its tiles out: one grid of every tile, or a list of them. */
export type HomeLayout = 'tiled' | 'list'

export const useHomeLayoutStore = createLayoutStore<HomeLayout>('home-layout-preference', 'tiled')

/**
 * How Android draws Home's tiles: Material 3 Expressive shapes, or tonal
 * cards. iOS draws its gradient cards whatever this says.
 */
export type HomeTileStyle = 'shapes' | 'cards'

export const useHomeTileStyleStore = createLayoutStore<HomeTileStyle>('home-tile-style', 'shapes')
