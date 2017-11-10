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

  # encode build number into js-land – we've already fetched it, so we'll
  # never set the "+" into the binaries
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

# Generate argument values for the generate_sourcemap and upload_sourcemap_to_bugsnag lanes
def get_sourcemap_args
  # The cwd is /fastlane. I don't know why entry_file doesn't need to be ../, but
  # I believe that watchman finds the project root and automatically looks there
  case lane_context[:PLATFORM_NAME]
  when :android
    platform = 'android'
    entry_file = 'index.android.js'
    bundle_output = '../android-release.bundle'
    sourcemap_output = '../android-release.bundle.map'
    bundle_url = 'index.android.bundle'
  when :ios
    platform = 'ios'
    entry_file = 'index.ios.js'
    bundle_output = '../ios-release.bundle'
    sourcemap_output = '../ios-release.bundle.map'
    bundle_url = 'main.jsbundle'
  end

  {
    platform: platform,
    entry_file: entry_file,
    bundle_output: bundle_output,
    sourcemap_output: sourcemap_output,
    bundle_url: bundle_url,
  }
end

# Use react-native cli to generate the source map
def generate_sourcemap
  args = get_sourcemap_args

  cmd = [
    'npx react-native bundle',
    '--dev false',
    "--platform '#{args[:platform]}'",
    "--entry-file '#{args[:entry_file]}'",
    "--bundle-output '#{args[:bundle_output]}'",
    "--sourcemap-output '#{args[:sourcemap_output]}'",
  ].join ' '

  FastlaneCore::CommandExecutor.execute(command: cmd,
                                        print_all: true,
                                        print_command: true)
end

# Upload source map to Bugsnag
def upload_sourcemap_to_bugsnag
  args = get_sourcemap_args

  cmd = [
    'npx bugsnag-sourcemaps upload',
    "--api-key '#{ENV['BUGSNAG_KEY']}'",
    "--minified-file '#{args[:bundle_output]}'",
    "--source-map '#{args[:sourcemap_output]}'",
    "--minified-url '#{args[:bundle_url]}'",
    '--upload-sources',
  ].join ' '

  FastlaneCore::CommandExecutor.execute(command: cmd,
                                        print_all: true,
                                        print_command: true)
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
  UI.message "TRAVIS_EVENT_TYPE: #{ENV['TRAVIS_EVENT_TYPE']}"
  if should_deploy?
    if cron?
      UI.message 'building nightly'
      nightly
    else
      UI.message 'building beta'
      beta
    end
  else
    UI.message 'just building'
    build
  end
end

def should_deploy?
  cron? ||
    !ENV['TRAVIS_TAG'].empty? ||
    ENV['TRAVIS_COMMIT_MESSAGE'] =~ /\[ci run beta\]/
end

def cron?
  ENV['TRAVIS_EVENT_TYPE'] == 'cron'
end
