module Fastlane
  module Actions
    class GetGradleVersionCodeAction < Action
      def self.run(params)
        gradle_path = params[:gradle_path]
        version_code = nil

        File.foreach(gradle_path) do |line|
          if line.include? 'versionCode '
            components = line.strip.split(' ')
            version_code = components[1].tr('"', '')
          end
        end

        if version_code.nil?
          UI.user_error! "Could not find the version code in #{gradle_path}"
        else
          UI.success "Version code: #{version_code}"
        end

        version_code.to_i
      end

      def self.description
        'Get the version code of your android project.'
      end

      def self.authors
        ['Hawken Rives']
      end

      def self.available_options
        [
          FastlaneCore::ConfigItem.new(key: :gradle_path,
                                       description: 'The path to the build.gradle file',
                                       type: String),
        ]
      end

      def self.is_supported?(platform)
        [:android].include?(platform)
      end
    end
  end
end
