module Fastlane
  module Actions
    class ActivateRogueTeamAction < Action
      def self.run(params)
        require 'xcodeproj'

        project = Xcodeproj::Project.open(params[:xcodeproj])

        main_target = project.targets.find { |t| t.name == params[:target] }
        main_target_uuid = main_target && main_target.uuid

        if main_target_uuid
          target_atts_obj = project.root_object.attributes['TargetAttributes']
          # puts 'Before'
          # puts target_atts_obj
          target_atts_obj[main_target_uuid] ||= {}
          target_atts_obj[main_target_uuid]['DevelopmentTeam'] = params[:team_id]
          # puts 'After'
          # puts target_atts_obj
        end

        main_target.build_configurations.each do |config|
          # puts "#{config.name}: Before"
          # puts config.build_settings
          config.build_settings['DEVELOPMENT_TEAM'] = params[:devteam]
          config.build_settings['PRODUCT_BUNDLE_IDENTIFIER'] = params[:bundle_id]
          config.build_settings['PROVISIONING_PROFILE_SPECIFIER'] = params[:profile_name]
          # puts "#{config.name}: After"
          # puts config.build_settings
        end

        project.save
      end

      def self.description
        'Activate the rogue signing team'
      end

      def self.details
        'Activate the rogue signing team'
      end

      def self.available_options
        [
          FastlaneCore::ConfigItem.new(key: :xcodeproj,
                                       default_value: ENV['GYM_PROJECT']),
          FastlaneCore::ConfigItem.new(key: :target,
                                       default_value: ENV['GYM_SCHEME']),
          FastlaneCore::ConfigItem.new(key: :team_id,
                                       default_value: 'NFMTHAZVS9'),
          FastlaneCore::ConfigItem.new(key: :devteam,
                                       default_value: 'NFMTHAZVS9'),
          FastlaneCore::ConfigItem.new(key: :bundle_id,
                                       default_value: 'com.volz.drew.aao.rogue'),
          FastlaneCore::ConfigItem.new(key: :profile_name,
                                       default_value: 'match Development com.volz.drew.aao.rogue'),
        ]
      end

      def self.return_value
        'None'
      end

      def self.authors
        ['Hawken Rives']
      end

      def self.is_supported?(platform)
        [:ios, :mac].include? platform
      end
    end
  end
end
