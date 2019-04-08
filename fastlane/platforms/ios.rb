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

	desc 'Run iOS builds or tests, as appropriate'
	lane :'ci-run' do
		# set up things so they can run
		authorize_ci_for_keys

		# and run
		auto_beta
	end

	desc 'Fetch certs for both the app and any extensions'
	lane :certificates do |options|
		app = lane_context[:APPLE_APP_ID]
		push_extension = lane_context[:APPLE_PUSH_EXTENSION_ID]

		match(app_identifier: [app, push_extension],
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
			        push_notification: 'on',
			        app_group: 'on',
		        },
		        )

		produce(
		        app_identifier: lane_context[:APPLE_PUSH_EXTENSION_ID],
		        app_name: lane_context[:APPLE_PUSH_EXTENSION_NAME],
		        language: 'English',
		        skip_itc: 'on',
		        enable_services: {
			        push_notification: 'off',
			        app_group: 'on',
		        },
		        )
	end

	desc 'Generate certs for the app and for any extensions'
	lane :generate_certificates do
		app = lane_context[:APPLE_APP_ID]
		push_extension = lane_context[:APPLE_PUSH_EXTENSION_ID]

		match(app_identifier: [app, push_extension], type: 'adhoc', readonly: false, force: true)
		match(app_identifier: [app, push_extension], type: 'appstore', readonly: false, force: true)
	end

	desc 'Generate the push notification cert and upload it to OneSignal'
	lane :generate_pem do
		password = 'password'
		env_key = 'ONESIGNAL_KEY'

		unless ENV.key?(env_key)
			raise "You do not have the #{env_key} environment variable configured. Not generating push certificate nor uploading to OneSignal."
		end

		get_push_certificate(
		                     app_identifier: lane_context[:APPLE_APP_ID],
		                     pem_name: 'push_cert',
		                     generate_p12: true,
		                     p12_password: password,
		                     new_profile: proc do |profile_path|
			                     p12 = profile_path.sub('.pem', '.p12')

			                     onesignal(
			                               auth_token: ENV[env_key],
			                               app_name: lane_context[:ONESIGNAL_APP_NAME],
			                               app_id: lane_context[:ONESIGNAL_APP_ID],
			                               apns_p12: p12,
			                               apns_p12_password: password,
			                               apns_env: 'production',
			                               )
		                     end,
		                     )
	end
end
