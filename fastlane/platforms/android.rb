require 'json'

platform :android do
	desc 'Makes a build'
	lane :build do |options|
		FileUtils.mkdir_p('../logs')

		build_status = 0
		begin
			propagate_version(track: options[:track])
			gradle(task: 'bundle',
			       build_type: 'Release',
			       print_command: true,
			       print_command_output: true)
		rescue IOError => e
			build_status = 1
			raise e
		ensure
			File.open('../logs/build-status', 'w') { |file| file.write(build_status.to_s) }
		end

		UI.message 'Generated files:'
		UI.message lane_context[SharedValues::GRADLE_ALL_AAB_OUTPUT_PATHS]

		output = lane_context[SharedValues::GRADLE_ALL_AAB_OUTPUT_PATHS].to_json
		File.open('../logs/products', 'w') { |file| file.write(output) }
	end

	desc 'Checks that the app builds'
	lane :check_build do
		build
	end

	desc 'Submit a new build to Google Play'
	private_lane :submit do |options|
		track = options[:track]

		matchesque
		build(track: track)

		lane_context[SharedValues::GRADLE_ALL_AAB_OUTPUT_PATHS] =
			lane_context[SharedValues::GRADLE_ALL_AAB_OUTPUT_PATHS].select do |apk|
				apk.end_with? '-release.aab'
			end

		supply(track: track)

		generate_sourcemap
		upload_sourcemap_to_sentry
	end

	desc 'Submit a new beta build to Google Play'
	lane :beta do
		submit(track: 'beta')
	end

	desc 'Submit a new nightly build to Google Play'
	lane :nightly do
		submit(track: 'alpha')
	end

	desc 'Bundle an Android sourcemap'
	lane :sourcemap do
		generate_sourcemap
	end

	desc 'Run the appropriate action on CI'
	lane :'ci-run' do
		if api_keys_available?
			# prepare for the bright future with signed android betas
			authorize_ci_for_keys
		end

		# and run
		auto_beta
	end

	desc 'extract the android keys from the match repo'
	lane :matchesque do
		match_dir = clone_match

		# we'll be copying files out of the tempdir from the git-clone operation
		src = "#{match_dir}/android"
		# don't forget: lanes run inside of ./fastlane, so we go up a level for our basedir
		dest = File.expand_path('..', '.')

		# we export this variable so that Gradle knows where to find the .properties file
		signing_props_dest = "#{dest}/android/app/upload-keystore.properties"
		ENV['KEYSTORE_FILE'] = signing_props_dest

		pairs = [
			{:from => "#{src}/upload-keystore.properties", :to => signing_props_dest},
			{:from => "#{src}/upload-keystore.keystore", :to => "#{dest}/android/app/upload-keystore.keystore"},
			{:from => "#{src}/play-private-key.json", :to => "#{dest}/fastlane/play-private-key.json"},
		]

		pairs.each do |pair|
			UI.command "cp #{pair[:from]} #{pair[:to]}"
			FileUtils.cp(pair[:from], pair[:to])
		end

		remove_match_clone(dir: match_dir)
	end
end
