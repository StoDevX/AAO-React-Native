# Adds the github token for stodevx-bot to the CI machine
def authorize_ci_for_keys
  token = ENV['CI_USER_TOKEN']

  # see macoscope.com/blog/simplify-your-life-with-fastlane-match
  # we're allowing the CI access to the keys repo
  File.open("#{ENV['HOME']}/.netrc", 'a+') do |file|
    file << "machine github.com\n  login #{token}"
  end
end

# Get the commit of the latest build on HockeyApp
def hockeyapp_version_commit
  latest_hockeyapp_notes[:commit_hash]
end

# Gets the version, either from Travis or from Hockey
def current_build_number
  ENV['TRAVIS_BUILD_NUMBER'] if ENV.key?('TRAVIS_BUILD_NUMBER')

  begin
    (latest_hockeyapp_version_number + 1).to_s
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

# Makes a changelog from the timespan passed
def make_changelog
  to_ref = ENV['TRAVIS_COMMIT'] || 'HEAD'
  from_ref = hockeyapp_version_commit || 'HEAD~3'

  sh("git log #{from_ref}..#{to_ref} --pretty='%an, %aD (%h)%n> %s%n'")
    .lines
    .map { |line| '    ' + line }
    .join
end

# It doesn't make sense to duplicate this in both platforms, and fastlane is
# smart enough to call the appropriate platform's "beta" lane. So, let's make
# a beta build if there have been new commits since the last beta.
def auto_beta
  last_commit = hockeyapp_version_commit
  current_commit = last_git_commit[:commit_hash]

  UI.message 'In faux-git terms:'
  UI.message "origin/hockeyapp: #{last_commit}"
  UI.message "HEAD: #{current_commit}"
  will_beta = last_commit != current_commit ? 'yes' : 'no'
  UI.message "Thus, will we beta? #{will_beta}"

  beta if last_commit != current_commit
end

def codepush_cli(app:, channel: 'nightly', install_target: '~2.2 || ~2.2.0-beta')
  target = "--targetBinaryVersion '#{install_target}'"
  # `fastlane x` runs in the ./fastlane folder, so we have to go up a level
  Dir.chdir("..") do
    sh("code-push release-react '#{app}' ios -d '#{channel}' #{target}")
  end
end
