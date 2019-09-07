require 'json'

platform :ios do
	desc 'Runs all the tests'
	lane :test do
		scan(scheme: ENV['GYM_SCHEME'], project: ENV['GYM_PROJECT'])
	end

	desc 'Take screenshots'
	lane :screenshot do
		devices = [
		           'iPhone 7 Plus',
		           'iPhone 6',
		           'iPhone 5s',
		           # 'iPhone 4s',
		           'iPad Pro (9.7-inch)',
		           'iPad Pro (12.9-inch)',
		          ]
		snapshot(devices: devices,
		         languages: ['en-US'],
		         scheme: ENV['GYM_SCHEME'],
		         project: ENV['GYM_PROJECT'],
		         # concurrent_simulators: false,
		         number_of_retries: 0)
	end

	desc 'Checks that the app can be built'
	lane :check_build do
		# fetch the directory where Xcode will put the .app
		settings = FastlaneCore::Helper.backticks(%(xcodebuild -showBuildSettings -configuration Debug -scheme "#{ENV['GYM_SCHEME']}" -project "../#{ENV['GYM_PROJECT']}" -destination 'generic/platform=iOS'))
		products_dir = settings.split("\n").select { |line| line =~ /\bBUILT_PRODUCTS_DIR =/ }.uniq
		products_dir = products_dir.map { |entry| entry.gsub(/.*BUILT_PRODUCTS_DIR = /, '') }
		products = products_dir.map { |entry| entry + "/#{ENV['GYM_OUTPUT_NAME']}.app/" }

		# save it to a log file for later use
		FileUtils.mkdir_p('../logs')
		File.open('../logs/products', 'w') { |file| file.write(products.to_json) }

		# build the .app
		build_status = 0
		begin
			propagate_version
			xcodebuild(
			           build: true,
			           scheme: ENV['GYM_SCHEME'],
			           project: ENV['GYM_PROJECT'],
			           destination: 'generic/platform=iOS',
			           xcargs: %(CODE_SIGNING_REQUIRED=NO CODE_SIGN_IDENTITY=""),
			           )
		rescue IOError => e
			build_status = 1
			raise e
		ensure
			File.open('../logs/build-status', 'w') { |file| file.write(build_status.to_s) }
		end
	end

	desc 'Builds and exports the app'
	lane :build do
		certificates(type: 'appstore')
		propagate_version

		# save it to a log file for later use
		FileUtils.mkdir_p('../logs')
		File.open('../logs/products', 'w') { |file| file.write('[]') }
		build_status = 0
		begin
			gym(include_bitcode: true,
			    include_symbols: true)
		rescue IOError => e
			build_status = 1
			raise e
		ensure
			File.open('../logs/build-status', 'w') { |file| file.write(build_status.to_s) }
		end
	end

	desc 'Submit a new Beta Build to Testflight'
	lane :beta do
		build
		testflight
	end

	desc 'Submit a new nightly Beta Build to Testflight'
	lane :nightly do
		build

		testflight(changelog: make_changelog,
		           distribute_external: false)

		generate_sourcemap
		upload_sourcemap_to_sentry
	end

	desc 'Bundle an iOS sourcemap'
	lane :sourcemap do
		generate_sourcemap
	end

	# N.B.: This is sourced primarily from the setup_ci action:
	#
	#   https://github.com/fastlane/fastlane/blob/de70231fe13f/fastlane/lib/fastlane/actions/setup_ci.rb#L23-L45,
	#
	# which does not support GitHub actions. Hence this setup_keychain lane
	# is required to get promptless access to the keychain for signing stuff.
	desc 'Create a temporary fastlane keychain'
	lane :setup_keychain do
		keychain_name = "fastlane_tmp_keychain"
		ENV["MATCH_KEYCHAIN_NAME"] = keychain_name
		ENV["MATCH_KEYCHAIN_PASSWORD"] = ""

		UI.message("Creating temporary keychain: \"#{keychain_name}\".")
		Actions::CreateKeychainAction.run(
			name: keychain_name,
			default_keychain: true,
			unlock: true,
			timeout: 3600,
			lock_when_sleeps: true,
			password: ""
		)

		UI.message("Enabling match readonly mode.")
		ENV["MATCH_READONLY"] = true.to_s
	end

	desc 'Run iOS builds or tests, as appropriate'
	lane :'ci-run' do
		# set up a temporary keychain for signing
		setup_keychain

		# set up things so they can run
		authorize_ci_for_keys

		# and run
		auto_beta
	end

	desc 'Fetch certs for both the app and any extensions'
	lane :certificates do |options|
		app = lane_context[:APPLE_APP_ID]

		match(app_identifier: [app],
		      type: options[:type],
		      readonly: true)
	end

	desc 'Ensure that everything is set up (must be run manually, as it needs a 2FA code)'
	lane :bootstrap do
		generate_apps
		generate_certificates
		generate_pem
	end

	desc 'Generate the app and any extensions on the Apple Developer Portal / App Store Connect'
	private_lane :generate_apps do
		produce(
		        app_identifier: lane_context[:APPLE_APP_ID],
		        app_name: lane_context[:APPLE_APP_NAME],
		        language: 'English',
		        enable_services: {
			        app_group: 'on',
		        },
		        )
	end

	desc 'Generate certs for the app and for any extensions'
	lane :generate_certificates do
		app = lane_context[:APPLE_APP_ID]

		match(app_identifier: [app], type: 'adhoc', readonly: false, force: true)
		match(app_identifier: [app], type: 'appstore', readonly: false, force: true)
	end
end
