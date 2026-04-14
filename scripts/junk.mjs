// Inline replacement for the 'junk' package — filters out OS-generated files
const JUNK_REGEX =
	/^npm-debug\.log$|^\..+\.swp$|^\.DS_Store$|^\.AppleDouble$|^\.LSOverride$|^Icon\r$|^\._.*|^\.Spotlight-V100(?:$|\/)|\.Trashes|^__MACOSX$|~$|^Thumbs\.db$|^ehthumbs\.db$|^[Dd]esktop\.ini$|@eaDir$/u

export const isNotJunk = (filename) => !JUNK_REGEX.test(filename)
