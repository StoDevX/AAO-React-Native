const blacklist = require('metro-config/src/defaults/blacklist')

module.exports = {
	resolver: {
		blacklistRE: blacklist([/react-native\/local-cli\/core\/__fixtures__.*/u]),
	},
}
