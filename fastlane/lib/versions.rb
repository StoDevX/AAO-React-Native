# coding: utf-8

# Gets the version, be it from Travis, Testflight, or Google Play
def current_build_number(**args)
  return build_number if build_number != nil

  begin
    case lane_context[:PLATFORM_NAME]
    when :android
      (google_play_track_version_codes(track: args[:track]) + 1).to_s
    when :ios
      (latest_testflight_build_number + 1).to_s
    end
  rescue
    '1'
  end
end

# get the current build number from the environment
def build_number
  travis = ENV['TRAVIS_BUILD_NUMBER']
  # bring circle's build numbers up to pass Travis'?
  circle = (ENV['CIRCLE_BUILD_NUM'].to_i + 3250).to_s
  travis || circle
end

# Get the current "app bundle" version
def current_bundle_version
  case lane_context[:PLATFORM_NAME]
  when :android
    get_gradle_version_name(gradle_path: lane_context[:GRADLE_FILE])
  when :ios
    get_info_plist_value(path: 'ios/AllAboutOlaf/Info.plist',
                         key: 'CFBundleShortVersionString')
  else
    get_package_key(key: :version)
  end
end

# Copy the package.json version into the other version locations
def propagate_version(**args)
  return unless ENV.key? 'CI'

  version = get_package_key(key: :version)
  build = current_build_number(track: args[:track] || nil)

  UI.message "Propagating version: #{version}"
  UI.message 'into the Info.plist and build.gradle files'
  
  UI.message "Setting build number to #{build}"

  # android's build number goes way up because we need to exceed the old build
  # numbers generated for the x86 build.
  build = (2 * 1048576) + build if lane_context[:PLATFORM_NAME] == :android
  UI.message "Actually setting build number to #{build} because we're on android"

  version = "#{version.split('-')[0]}-pre" if should_nightly?
  UI.message "Actually putting #{version} into the binaries (because we're doing a nightly)"

  # encode build number into js-land – we've already fetched it, so we'll
  # never set the "+" into the binaries
  unless version.include? '+'
    set_package_data(data: { version: "#{version}+#{build}" })
  end

  case lane_context[:PLATFORM_NAME]
  when :android
    set_gradle_version_name(version_name: version, gradle_path: lane_context[:GRADLE_FILE])
    set_gradle_version_code(version_code: build, gradle_path: lane_context[:GRADLE_FILE])
  when :ios
    # we're splitting here because iTC can't handle versions with dashes in them
    increment_version_number(version_number: version.split('-')[0], xcodeproj: ENV['GYM_PROJECT'])
    increment_build_number(build_number: build, xcodeproj: ENV['GYM_PROJECT'])
  end
end
