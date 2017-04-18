module Fastlane
  module Actions
    class LatestHockeyappVersionNumberAction < Action
      def self.run(params)
        require 'hockeyapp'

        HockeyApp::Config.configure do |config|
          config.token = params[:api_token]
        end

        UI.message "Fetching metadata for #{params[:app_name]} from HockeyApp"
        client = HockeyApp.build_client
        apps = client.get_apps
        app = apps.find do |a|
          a.title == params[:app_name] &&
            a.platform == params[:platform] &&
            a.release_type == params[:release_type].to_i
        end

        version = if app.nil?
                    1
                  else
                    app.versions.first.version.to_i
                  end

        UI.message "Found version #{version}"

        version
      end

      def self.description
        'Easily fetch the most recent HockeyApp version number for your app'
      end

      def self.details
        'Provides a way to have increment_build_number be based on the latest HockeyApp version'
      end

      def self.available_options
        [
          FastlaneCore::ConfigItem.new(key: :app_name,
                                       description: 'The app name to use when fetching the version number',
                                       optional: false),
          FastlaneCore::ConfigItem.new(key: :api_token,
                                       env_name: 'HOCKEYAPP_TOKEN',
                                       description: 'API Token for Hockey Access',
                                       optional: false),
          FastlaneCore::ConfigItem.new(key: :release_type,
                                       description: 'The release type to use when fetching the version number: Beta=0, Store=1, Alpha=2, Enterprise=3',
                                       default_value: '0'),
          FastlaneCore::ConfigItem.new(key: :platform,
                                       description: 'The platform to use when fetching the version number: iOS, Android, Mac OS, Windows Phone, Custom',
                                       default_value: 'iOS')
        ]
      end

      def self.return_value
        'The most recent version number for the specified app'
      end

      def self.authors
        ['Travis Palmer', 'Hawken Rives']
      end

      def self.is_supported?(platform)
        [:ios, :mac, :android].include? platform
      end
    end
  end
end
