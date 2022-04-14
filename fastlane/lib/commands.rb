require 'netrc'

# Pick what to do - build + deploy, build + sign, skip, or just plain build.
def auto_beta
	if should_nightly?
		UI.message 'building nightly'
		nightly
		return
	elsif should_beta?
		UI.message 'building beta'
		beta
		return
	end

	if simulator_also?
		UI.message 'skipping non-simulator build on CI'
		return
	end

	if api_keys_available?
		UI.message 'signing and building, but not deploying'
		build
		return
	end

	UI.message 'just building (not signing)'
	check_build
end

# Adds the github token for stodevx-bot to the CI machine
def authorize_ci_for_keys
	token = ENV['GITHUB_KEYS_REPOSITORY_TOKEN']

	# Ensure an entry for github.com exists in ~/.netrc
	netrc = Netrc.read
	unless netrc["github.com"]
		UI.message "An entry for github.com was not found in ~/.netrc; setting..."
		netrc["github.com"] = token, ''
		netrc.save
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
	rescue StandardError
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
