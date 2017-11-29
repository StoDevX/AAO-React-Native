# coding: utf-8

# Gets the version, be it from Travis, Testflight, or Google Play
def current_build_number(**args)
  return ENV['TRAVIS_BUILD_NUMBER'] if ENV.key?('TRAVIS_BUILD_NUMBER')

  begin
    case lane_context[:PLATFORM_NAME]
    when :android
      (google_play_track_version_codes(track: args[:track]) + 1).to_s
    when :ios
      (latest_testflight_build_number + 1).to_s
    else
      UI.input 'Please enter a build number: '
    end
  rescue
    '1'
  end
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
  version = get_package_key(key: :version)
  build = current_build_number(track: args[:track] || nil)

  UI.message "Propagating version: #{version}"
  UI.message 'into the Info.plist and build.gradle files'

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
