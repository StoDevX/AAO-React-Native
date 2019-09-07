# N.B.: This is sourced primarily from the setup_ci action:
#
#   https://github.com/fastlane/fastlane/blob/de70231fe13f/fastlane/lib/fastlane/actions/setup_ci.rb#L23-L45,
#
# which does not support GitHub actions. Hence this setup_keychain lane
# is required to get promptless access to the keychain for signing stuff.

require 'fastlane'

def init_keychain()
	keychain_name = "fastlane_tmp_keychain"
	keychain_password = ""

	puts "MATCH_KEYCHAIN_NAME=fastlane_tmp_keychain"
	puts "MATCH_KEYCHAIN_PASSWORD="

	STDERR.puts("Creating temporary keychain: \"#{keychain_name}\".")
	Actions::CreateKeychainAction.run(
		name: keychain_name,
		default_keychain: true,
		unlock: true,
		timeout: 3600,
		lock_when_sleeps: true,
		password: keychain_password,
	)
end

init_keychain()
