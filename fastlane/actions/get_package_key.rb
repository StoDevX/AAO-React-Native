require 'json'

module Fastlane
  module Actions
    class GetPackageKeyAction < Action
      def self.run(params)
        key = params[:key]
        package_path = params[:package_path]

        file = File.read(package_path)
        data_hash = JSON.parse(file)

        data_hash[key]
      end

      def self.description
        "Retrieve a value from your package.json file."
      end

      def self.authors
        ["Hawken Rives"]
      end

      def self.available_options
        [
          FastlaneCore::ConfigItem.new(key: :key,
                               description: "The key to fetch",
                                      type: String),
          FastlaneCore::ConfigItem.new(key: :package_path,
                               description: "The path to the package.json file",
                                      type: String,
                             default_value: "./package.json"),
        ]
      end

      def self.is_supported?(platform)
        true
      end
    end
  end
end
