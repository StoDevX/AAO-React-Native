# coding: utf-8
platform :android do
  desc 'Makes a build'
  lane :build do |options|
    propagate_version(track: options[:track])

    gradle(task: 'assemble',
           build_type: 'Release',
           print_command: true,
           print_command_output: true)

    UI.message lane_context[SharedValues::GRADLE_ALL_APK_OUTPUT_PATHS]
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

    lane_context[SharedValues::GRADLE_ALL_APK_OUTPUT_PATHS] =
      lane_context[SharedValues::GRADLE_ALL_APK_OUTPUT_PATHS].select do |apk|
        apk.end_with? '-release.apk'
      end

    supply(track: track,
           check_superseded_tracks: true)

    generate_sourcemap
    upload_sourcemap_to_bugsnag
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
    # prepare for the bright future with signed android betas
    authorize_ci_for_keys

    # and run
    auto_beta
  end

  desc 'extract the android keys from the match repo'
  lane :matchesque do
    match_dir = clone_match

    # don't forget – lanes run inside of ./fastlane
    gradle_file = 'signing.properties'
    keystore_name = 'my-release-key.keystore'
    play_store_key = 'play-private-key.json'

    src = "#{match_dir}/android"

    # FastlaneCore::CommandExecutor.execute(command: "pwd", print_all: true, print_command: true)
    UI.command "cp #{src}/#{gradle_file} ../android/app/#{gradle_file}"
    FileUtils.cp("#{src}/#{gradle_file}", "../android/app/#{gradle_file}")
    UI.command "cp #{src}/#{keystore_name} ../android/app/#{keystore_name}"
    FileUtils.cp("#{src}/#{keystore_name}", "../android/app/#{keystore_name}")
    UI.command "cp #{src}/#{play_store_key} ../fastlane/#{play_store_key}"
    FileUtils.cp("#{src}/#{play_store_key}", "../fastlane/#{play_store_key}")

    remove_match_clone(dir: match_dir)
  end
end
