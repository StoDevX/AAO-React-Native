import type {SourceCampus} from './types'

/** The server that publishes the sources manifest; the app sets it at boot. */
let manifestServer: SourceCampus | undefined

export function setManifestServer(id: SourceCampus): void {
	manifestServer = id
}

/** The server that publishes the manifest, which a source naming no campus is fetched from. */
export function requireManifestServer(): SourceCampus {
	if (manifestServer === undefined) {
		throw new Error('setManifestServer has not run; source/init/api.ts calls it at boot')
	}
	return manifestServer
}
