# coding: utf-8
# Adds the github token for stodevx-bot to the CI machine
def authorize_ci_for_keys
  token = ENV['CI_USER_TOKEN']

  # see macoscope.com/blog/simplify-your-life-with-fastlane-match
  # we're allowing the CI access to the keys repo
  File.open("#{ENV['HOME']}/.netrc", 'a+') do |file|
    file << "machine github.com\n  login #{token}"
  end
end

# Gets the version, either from Travis or from Hockey
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

  # encode build number into js-land
  set_package_data(data: { version: "#{version}+#{build}" })

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

# last_git_tag returns the most recent tag, chronologically.
# newest_tag returns the most recent tag *on this branch*.
def newest_tag
  # we chomp to remove the newline
  sh('git describe --tags --abbrev=0').chomp
end

def git_changelog
  to_ref = ENV['TRAVIS_COMMIT'] || 'HEAD'
  from_ref = newest_tag

  graph = sh("git log #{from_ref}..#{to_ref} --oneline --graph")

  # make sure to trim off whitespace from the graph lines
  # to keep the character count down
  graph
    .lines
    .map { |line| line.chomp }
    .join "\n"
end

# Makes a changelog from the timespan passed
def make_changelog
  sh('git fetch --unshallow')
  log = git_changelog

  limit = 4_000
  ending = '…'

  if log.length <= limit
    log
  else
    log[0, log.rindex(/\s/, limit - ending.length)].rstrip + ending
  end
end

# It doesn't make sense to duplicate this in both platforms, and fastlane is
# smart enough to call the appropriate platform's "beta" lane. So, let's make
# a beta build if there have been new commits since the last beta.
def auto_beta
  UI.message "run_deploy: #{ENV['run_deploy']}"
  UI.message "TRAVIS_EVENT_TYPE: #{ENV['TRAVIS_EVENT_TYPE']}"
  if ENV['run_deploy'] == '1'
    if ENV['TRAVIS_EVENT_TYPE'] == 'cron'
      UI.message 'nightly'
      nightly
    else
      UI.message 'beta'
      beta
    end
  else
    UI.message 'just build'
    build
  end
end
