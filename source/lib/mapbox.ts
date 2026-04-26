import MapboxGL from '@rnmapbox/maps'

// TODO(map): replace with the real `pk.…` public access token from Mapbox.
// This is a build-time placeholder that lets type-checking and tests pass;
// the iOS binary will not render Mapbox tiles until this is filled in.
export const MAPBOX_PUBLIC_TOKEN = 'pk.TODO_REPLACE_BEFORE_MERGE'

MapboxGL.setAccessToken(MAPBOX_PUBLIC_TOKEN)
