module Fastlane
  module Actions
    class LatestHockeyappNotesAction < Action
      def self.run(params)
        require 'hockeyapp'
        HockeyApp::Config.configure { |config| config.token = params[:api_token] }

        UI.message "Fetching latest version of #{params[:app_name]} from HockeyApp"

        client = HockeyApp.build_client
        app = client.get_apps.find { |a| a.title == params[:app_name] &&
                                         a.platform == params[:platform] &&
                                         a.release_type == params[:release_type].to_i }

        parsed = app.versions.map { |version| self.parse_notes(version.notes) }

        data = parsed.find { |version| info[:branch] == params[:release_branch] }
        data = parsed.find { |version| info[:branch] == "master" } unless data
        data = parsed.first unless data

        UI.message "Last build branch: #{data[:branch]}"
        UI.message "Last build hash: #{data[:commit_hash]}"
        UI.message "Last changelog: #{data[:changelog]}"

        data
      end

      def self.parse_notes(notes)
        lines = notes.split "\n"

        branch = lines[0].split(/: +/).last.split('<').first
        commit_hash = lines[1].split(/: +/).last.split('<').first
        changelog = lines.drop(2).join "\n"

        {
            :branch => branch,
            :commit_hash => commit_hash,
            :changelog => changelog,
        }
      end

      def self.description
        "Easily fetch the most recent HockeyApp version for your app"
      end

      def self.details
        "Allows increment_build_number to increment from the latest HockeyApp version"
      end

      def self.available_options
        [
          FastlaneCore::ConfigItem.new(key: :app_name,
                                       env_name: "FL_LATEST_HOCKEYAPP_NOTES_APP_NAME",
                                       description: "The app name to use when fetching the notes",
                                       optional: false),
          FastlaneCore::ConfigItem.new(key: :api_token,
                                       env_name: "FL_HOCKEY_API_TOKEN",
                                       description: "API Token for Hockey Access",
                                       optional: false),
          FastlaneCore::ConfigItem.new(key: :release_type,
                                       env_name: "FL_LATEST_HOCKEYAPP_NOTES_RELEASE_TYPE",
                                       description: "The release type to use when fetching the notes: Beta=0, Store=1, Alpha=2, Enterprise=3",
                                       default_value: "0"),
          FastlaneCore::ConfigItem.new(key: :platform,
                                       env_name: "FL_LATEST_HOCKEYAPP_NOTES_PLATFORM",
                                       description: "The platform to use when fetching the notes: iOS, Android, Mac OS, Windows Phone, Custom",
                                       default_value: "iOS"),
          FastlaneCore::ConfigItem.new(key: :release_branch,
                                       env_name: "FL_LATEST_HOCKEYAPP_NOTES_RELEASE_BRANCH",
                                       description: "The branch to look for when fetching the notes (falls back to `master` or, failing that, to the latest build)",
                                       default_value: "master"),
        ]
      end

      def self.return_value
        "Parsed notes field for the most recent version of the specified app"
      end

      def self.authors
        ["Hawken Rives"]
      end

      def self.is_supported?(platform)
        [:ios, :mac, :android].include? platform
      end
    end
  end
end
