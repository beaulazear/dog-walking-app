# frozen_string_literal: true

namespace :stripe do
  namespace :monitor do
    desc "Check Stripe integration health"
    task health: :environment do
      puts "🔍 Stripe Integration Health Check"
      puts "=" * 60

      # Check API key configuration
      check_api_keys

      # Check webhook configuration
      check_webhook_config

      # Check Connect account status
      check_connect_accounts

      # Check recent errors
      check_recent_errors

      # Check active subscriptions
      check_active_subscriptions

      puts "=" * 60
      puts "✅ Health check complete"
    end

    desc "Report on recent Stripe errors"
    task errors: :environment do
      puts "📊 Stripe Error Report (Last 24 Hours)"
      puts "=" * 60

      # Read from critical errors log
      log_file = Rails.root.join("log", "stripe_critical_errors.log")
      if File.exist?(log_file)
        errors = File.read(log_file).split("=" * 80).reject(&:blank?)
        puts "Total critical errors: #{errors.count}"
        puts
        puts errors.last(5).join("\n")
      else
        puts "No critical errors logged"
      end

      puts "=" * 60
    end

    desc "Validate all active scoopers' Stripe Connect accounts"
    task validate_scoopers: :environment do
      puts "🔍 Validating Scooper Stripe Connect Accounts"
      puts "=" * 60

      scoopers = User.where.not(stripe_connect_account_id: nil)
      total = scoopers.count
      disabled = 0
      errors = 0

      scoopers.find_each.with_index do |scooper, index|
        print "\rChecking #{index + 1}/#{total}..."

        begin
          account = Stripe::Account.retrieve(scooper.stripe_connect_account_id)

          unless account.charges_enabled
            disabled += 1
            puts "\n⚠️  Scooper ##{scooper.id} (#{scooper.name}) has disabled account!"
            puts "   Account ID: #{account.id}"
            puts "   Status: #{account.status}"
          end
        rescue Stripe::StripeError => e
          errors += 1
          puts "\n❌ Error checking scooper ##{scooper.id}: #{e.message}"
        end
      end

      puts "\n"
      puts "=" * 60
      puts "Summary:"
      puts "  Total scoopers: #{total}"
      puts "  Disabled accounts: #{disabled}"
      puts "  Errors: #{errors}"
      puts "=" * 60
    end

    desc "Check for failed subscription cancellations"
    task check_cancelled_subscriptions: :environment do
      puts "🔍 Checking Cancelled Subscriptions"
      puts "=" * 60

      # Find pledges marked as cancelled in DB
      cancelled_pledges = Pledge.where(status: "cancelled")
                                .where.not(stripe_subscription_id: nil)

      total = cancelled_pledges.count
      mismatches = 0

      puts "Checking #{total} cancelled pledges..."
      puts

      cancelled_pledges.find_each do |pledge|
        begin
          subscription = Stripe::Subscription.retrieve(pledge.stripe_subscription_id)

          # Check if subscription is actually cancelled in Stripe
          unless subscription.status == "canceled"
            mismatches += 1
            puts "⚠️  MISMATCH: Pledge ##{pledge.id}"
            puts "   DB status: cancelled"
            puts "   Stripe status: #{subscription.status}"
            puts "   Subscription ID: #{subscription.id}"
            puts "   Action: Cancel in Stripe now? (This is a manual check)"
            puts
          end
        rescue Stripe::InvalidRequestError => e
          # Subscription already deleted - this is good
          puts "✅ Pledge ##{pledge.id} - Subscription not found (deleted)"
        rescue Stripe::StripeError => e
          puts "❌ Error checking pledge ##{pledge.id}: #{e.message}"
        end
      end

      puts "=" * 60
      puts "Summary:"
      puts "  Total cancelled pledges: #{total}"
      puts "  Mismatches found: #{mismatches}"
      puts "=" * 60

      if mismatches > 0
        puts "⚠️  WARNING: Found #{mismatches} pledges that are cancelled in DB but active in Stripe!"
        puts "   This represents a financial liability."
      else
        puts "✅ All cancelled pledges are properly cancelled in Stripe"
      end
    end

    private

    def check_api_keys
      puts "\n📋 API Keys Configuration"
      puts "-" * 60

      config = Rails.configuration.stripe

      if config[:secret_key].present?
        puts "✅ Secret key: Configured (#{config[:secret_key][0...7]}...)"
      else
        puts "❌ Secret key: NOT CONFIGURED"
      end

      if config[:publishable_key].present?
        puts "✅ Publishable key: Configured (#{config[:publishable_key][0...7]}...)"
      else
        puts "⚠️  Publishable key: NOT CONFIGURED"
      end

      if config[:connect_client_id].present?
        puts "✅ Connect client ID: Configured"
      else
        puts "⚠️  Connect client ID: NOT CONFIGURED"
      end
    end

    def check_webhook_config
      puts "\n📋 Webhook Configuration"
      puts "-" * 60

      webhook_secret = Rails.application.credentials.dig(:stripe, :webhook_secret)

      if webhook_secret.present?
        puts "✅ Webhook secret: Configured"
      else
        puts "❌ Webhook secret: NOT CONFIGURED (CRITICAL!)"
      end

      # Check webhook events
      if defined?(WebhookEvent)
        recent_webhooks = WebhookEvent.where("processed_at > ?", 24.hours.ago).count
        puts "✅ Recent webhooks processed: #{recent_webhooks} (last 24h)"
      end
    end

    def check_connect_accounts
      puts "\n📋 Stripe Connect Accounts"
      puts "-" * 60

      scoopers = User.where(is_scooper: true)
      total_scoopers = scoopers.count
      with_connect = scoopers.where.not(stripe_connect_account_id: nil).count
      onboarded = scoopers.where(stripe_connect_onboarded: true).count

      puts "Total scoopers: #{total_scoopers}"
      puts "With Connect account: #{with_connect}"
      puts "Fully onboarded: #{onboarded}"

      if with_connect < total_scoopers
        puts "⚠️  #{total_scoopers - with_connect} scoopers don't have Connect accounts"
      end
    end

    def check_recent_errors
      puts "\n📋 Recent Errors"
      puts "-" * 60

      # Check critical errors log
      log_file = Rails.root.join("log", "stripe_critical_errors.log")
      if File.exist?(log_file)
        recent_errors = File.read(log_file).scan(/CRITICAL STRIPE ERROR - (.+)$/)
        if recent_errors.any?
          puts "❌ Found #{recent_errors.count} critical errors in log"
        else
          puts "✅ No critical errors in log"
        end
      else
        puts "✅ No critical errors log file"
      end
    end

    def check_active_subscriptions
      puts "\n📋 Active Subscriptions"
      puts "-" * 60

      active_pledges = Pledge.where(status: "active")
                             .where.not(stripe_subscription_id: nil)

      puts "Active pledges with subscriptions: #{active_pledges.count}"

      if active_pledges.any?
        total_mrr = active_pledges.sum(:amount)
        puts "Monthly Recurring Revenue: $#{total_mrr.round(2)}"
        puts "Platform Revenue (15%): $#{(total_mrr * 0.15).round(2)}"
      end
    end
  end
end
