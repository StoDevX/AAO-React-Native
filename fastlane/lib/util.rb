# Adds the github token for stodevx-bot to the CI machine
def authorize_ci_for_keys
  token = ENV['CI_USER_TOKEN']

  # see macoscope.com/blog/simplify-your-life-with-fastlane-match
  # we're allowing the CI access to the keys repo
  File.open("#{ENV['HOME']}/.netrc", 'a+') do |file|
    file << "machine github.com\n  login #{token}"
  end
end

# Get the hockeyapp version
def get_hockeyapp_version(options)
  latest_hockeyapp_version_number(
    api_token: ENV['HOCKEYAPP_TOKEN'],
    app_name: 'All About Olaf',
    platform: options[:platform]
  )
end

# Get the commit of the latest build on HockeyApp
def get_hockeyapp_version_commit(options)
  latest_hockeyapp_notes(
    api_token: ENV['HOCKEYAPP_TOKEN'],
    app_name: 'All About Olaf',
    platform: options[:platform]
  )[:commit_hash]
end

# Gets the version, either from Travis or from Hockey
def get_current_build_number(options)
  ENV['TRAVIS_BUILD_NUMBER'] || get_hockeyapp_version(platform: options[:platform]) + 1
end

# Build up the release notes for Hockey
def build_notes(options)
  branch = git_branch
  sha = last_git_commit[:commit_hash]
  changelog = make_changelog(platform: options[:platform])
  "branch: #{branch}\ngit commit: #{sha}\n\n## Changelog\n#{changelog}"
end

# Get the current "app bundle" version
def get_current_bundle_version(options)
  if options[:platform] == 'Android'
    get_gradle_version_name(gradle_path: 'android/app/build.gradle')
  elsif options[:platform] == 'iOS'
    get_info_plist_value(path: 'ios/AllAboutOlaf/Info.plist',
                         key: 'CFBundleShortVersionString')
  end
end

# Makes a changelog from the timespan passed
def make_changelog(options)
  to_ref = ENV['TRAVIS_COMMIT'] || 'HEAD'
  from_ref = get_hockeyapp_version_commit(platform: options[:platform]) || 'HEAD~3'

  sh("git log #{from_ref}..#{to_ref} --pretty='%an, %aD (%h)%n> %s%n'")
    .lines
    .map { |line| '    ' + line }
    .join
end

# It doesn't make sense to duplicate this in both platforms, and fastlane is
# smart enough to call the appropriate platform's "beta" lane. So, let's make
# a beta build if there have been new commits since the last beta.
def auto_beta(options)
  last_commit = hockeyapp_version_commit(platform: options[:platform])
  current_commit = last_git_commit[:commit_hash]

  UI.message 'In faux-git terms:'
  UI.message "origin/hockeyapp: #{last_commit}"
  UI.message "HEAD: #{current_commit}"
  will_beta = last_commit != current_commit ? 'yes' : 'no'
  UI.message "Thus, will we beta? #{will_beta}"

  beta if last_commit != current_commit
end
