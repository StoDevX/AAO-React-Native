class Build

	def initialize(env = ENV)
		@env ||= env
	end

	def should_deploy?
		cron? ||
			!ENV['TRAVIS_TAG'].empty? ||
			ENV['TRAVIS_COMMIT_MESSAGE'] =~ /\[ci run beta\]/
	end

	protected

	def cron?
		ENV['TRAVIS_EVENT_TYPE'] == 'cron'
	end

end
