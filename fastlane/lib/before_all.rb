before_all do
  # too lazy to change the name in travis, so we jut copy it here
  ENV['FL_HOCKEY_API_TOKEN'] = ENV['HOCKEY_TOKEN'] if ENV.key?('HOCKEY_TOKEN')

  # set up global info for `gym`
  ENV['GYM_PROJECT'] = './ios/AllAboutOlaf.xcodeproj'
  ENV['GYM_SCHEME'] = 'AllAboutOlaf'
  ENV['GYM_OUTPUT_DIRECTORY'] = './ios/build'
  ENV['GYM_OUTPUT_NAME'] = 'AllAboutOlaf'

  # set up global info for `gradle`
  ENV['FL_GRADLE_PROJECT_DIR'] = './android'

  # set up other global shared values
  lane_context[:PRETTY_APP_NAME] = 'All About Olaf'
  ENV['FL_HOCKEY_PUBLIC_IDENTIFIER'] = lane_context[:PRETTY_APP_NAME]

  lane_context[:GRADLE_FILE] = "#{ENV['FL_GRADLE_PROJECT_DIR']}/app/build.gradle"

  lane_context[:VERSION_NUMBER] =
    case lane_context[:PLATFORM_NAME]
    when 'ios' then
      get_info_plist_value(path: './ios/AllAboutOlaf/Info.plist', key: 'CFBundleShortVersionString')
    when 'android' then
      get_gradle_version_name(gradle_path: lane_context[:GRADLE_FILE])
    else
      package_get_data(key: :version)
    end

  lane_context[:BUILD_NUMBER] = current_build_number.to_s
end
