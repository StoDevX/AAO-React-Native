# coding: utf-8
platform :android do
  desc 'Makes a build'
  lane :build do
    # make sure we have a copy of the data files
    bundle_data

    gradle(task: 'assemble',
           build_type: 'Release',
           print_command: true,
           print_command_output: true)

    UI.message lane_context[SharedValues::GRADLE_ALL_APK_OUTPUT_PATHS]
  end

  desc 'Submit a new Beta Build to HockeyApp'
  lane :beta do
    build

      lane_context[SharedValues::GRADLE_ALL_APK_OUTPUT_PATHS] =
      lane_context[SharedValues::GRADLE_ALL_APK_OUTPUT_PATHS].select do |apk|
        apk.end_with? '-release.apk'
      end

    supply(track: 'beta')
  end

  desc 'Submit a new nightly Build to Google Play'
  lane :nightly do
    build

    lane_context[SharedValues::GRADLE_ALL_APK_OUTPUT_PATHS] =
      lane_context[SharedValues::GRADLE_ALL_APK_OUTPUT_PATHS].select do |apk|
        apk.end_with? '-release.apk'
      end

    supply(track: 'alpha')
  end

  desc 'Run the appropriate action on CI'
  lane :'ci-run' do
    # prepare for the bright future with signed android betas
    authorize_ci_for_keys
    matchesque

    # set the app version
    set_version

    # and run
    auto_beta
  end

  desc 'Set up an android emulator on TravisCI'
  lane :'ci-emulator' do
    emulator_name = "react-native"
    Dir.mkdir("$HOME/.android/avd/#{emulator_name}.avd/")
    sh("echo no | android create avd --force -n '#{emulator_name}' -t android-23 --abi google_apis/armeabi-v7a")
    sh("emulator -avd '#{emulator_name}' -no-audio -no-window &")
    sh('android-wait-for-emulator')
    sh('adb shell input keyevent 82 &')
  end

  desc 'Include the build number in the version string'
  lane :set_version do |options|
    version = options[:version] || current_bundle_version
    set_gradle_version_name(version_name: version,
                            gradle_path: lane_context[:GRADLE_FILE])
    set_package_data(data: { version: "#{version}" })
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
