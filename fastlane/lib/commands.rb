# coding: utf-8

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
    if pr?
      UI.message 'just building (not signing)'
      check_build
    else
      UI.message 'signing and building, but not deploying'
      build
    end
  end
end

# Adds the github token for stodevx-bot to the CI machine
def authorize_ci_for_keys
  token = ENV['CI_USER_TOKEN']

  # see macoscope.com/blog/simplify-your-life-with-fastlane-match
  # we're allowing the CI access to the keys repo
  File.open("#{ENV['HOME']}/.netrc", 'a+') do |file|
    file << "machine github.com\n  login #{token}"
  end
end

# Clone the match repo (for Android)
def clone_match
  git_url = 'https://github.com/hawkrives/aao-keys'
  dir = Dir.mktmpdir
  command = "git clone --depth 1 '#{git_url}' '#{dir}'"

  # this block pulled from https://github.com/fastlane/fastlane/blob/master/match/lib/match/git_helper.rb
  UI.message 'Cloning remote git repo...'
  begin
    # GIT_TERMINAL_PROMPT will fail the `git clone` command if user credentials are missing
    FastlaneCore::CommandExecutor.execute(command: "GIT_TERMINAL_PROMPT=0 #{command}",
                                          print_all: true,
                                          print_command: true)
  rescue
    UI.error 'Error cloning the certificates repo. Please make sure you have read access to the repository you want to use'
    UI.error "Run the following command manually to make sure you're properly authenticated:"
    UI.command command
    UI.user_error! 'Error cloning the certificates git repo. Please make sure you have access to the repository - see instructions above'
  end

  dir
end

# remove the match cloned folder
def remove_match_clone(options)
  UI.command "removing #{options[:dir]}"
  FileUtils.remove_entry_secure options[:dir]
end
