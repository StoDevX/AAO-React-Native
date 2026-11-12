// node:fs/promises for the helper in JavaScriptCore: the same calls as the
// fs stand-in, answered at once, since the host's file calls are synchronous.
import * as fs from './fs.js'

const later =
	(call) =>
	(...args) => {
		try {
			return Promise.resolve(call(...args))
		} catch (error) {
			return Promise.reject(error)
		}
	}

export const readFile = later(fs.readFileSync)
export const writeFile = later(fs.writeFileSync)
export const readdir = later(fs.readdirSync)
export const stat = later(fs.statSync)
export const mkdir = later(fs.mkdirSync)
export const rm = later(fs.rmSync)
export const rename = later(fs.renameSync)
export const copyFile = later(fs.copyFileSync)
export const mkdtemp = later(fs.mkdtempSync)
export const realpath = later(fs.realpathSync)
/** Only the helper's Node server opens files, and the app serves the build itself. */
export const open = later(() => {
	throw new Error('fs/promises open has no stand-in: the Mac app serves the build')
})

export default {
	readFile,
	writeFile,
	readdir,
	stat,
	mkdir,
	rm,
	rename,
	copyFile,
	mkdtemp,
	realpath,
	open,
}
