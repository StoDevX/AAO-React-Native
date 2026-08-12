/**
 * The MapLibre style JSON the campus map renders.
 *
 * TODO(map): point this at the self-hosted style on GitHub Pages once the tile
 * repo exists. It needs to serve, as static files: the style JSON, the vector
 * tiles it references, the glyph ranges (fonts) and the sprite sheet -- a
 * style that names a font or icon it cannot fetch renders without labels
 * rather than failing loudly.
 *
 * MapLibre's demo style is a global, low-zoom basemap: it proves the renderer
 * is wired up, but it has nothing at campus zoom levels.
 */
export const MAP_STYLE_URL = 'https://demotiles.maplibre.org/style.json'
