# frozen_string_literal: true

# Stripe Error Monitoring Service
# Tracks and alerts on Stripe API errors
class StripeErrorMonitor
  # Error severity levels
  SEVERITY = {
    critical: "CRITICAL",
    high: "HIGH",
    medium: "MEDIUM",
    low: "LOW"
  }.freeze

  class << self
    # Track a Stripe error
    # @param error [Stripe::StripeError] The Stripe error
    # @param context [Hash] Additional context (user_id, pledge_id, etc.)
    # @param severity [Symbol] Error severity level
    def track_error(error, context: {}, severity: :medium)
      error_data = build_error_data(error, context, severity)

      # Log to Rails logger
      log_error(error_data)

      # Send to error tracking service (e.g., Sentry, Rollbar, Honeybadger)
      send_to_error_tracker(error_data) if should_alert?(severity)

      # Store in database for analytics
      store_error(error_data) if Rails.env.production?

      # Send critical alerts immediately
      send_critical_alert(error_data) if severity == :critical

      error_data
    end

    # Track successful Stripe operations for monitoring
    def track_success(operation_type, context: {})
      return unless Rails.env.production?

      Rails.logger.info({
        event: "stripe_operation_success",
        operation: operation_type,
        context: context,
        timestamp: Time.current
      }.to_json)
    end

    # Get error statistics
    def error_stats(time_range: 24.hours)
      return {} unless Rails.env.production?

      # This would query your database/error tracking service
      {
        total_errors: 0, # Placeholder
        critical_errors: 0,
        failed_subscriptions: 0,
        failed_charges: 0,
        webhook_failures: 0
      }
    end

    private

    def build_error_data(error, context, severity)
      {
        error_type: error.class.name,
        error_code: error.code,
        error_message: error.message,
        http_status: error.http_status,
        request_id: error.request_id,
        severity: SEVERITY[severity],
        context: context,
        timestamp: Time.current,
        environment: Rails.env,
        json_body: error.json_body
      }
    end

    def log_error(error_data)
      log_message = "[STRIPE ERROR] #{error_data[:severity]} - #{error_data[:error_type]}"
      log_details = {
        message: error_data[:error_message],
        code: error_data[:error_code],
        request_id: error_data[:request_id],
        context: error_data[:context]
      }

      case error_data[:severity]
      when "CRITICAL", "HIGH"
        Rails.logger.error("#{log_message}: #{log_details.to_json}")
      when "MEDIUM"
        Rails.logger.warn("#{log_message}: #{log_details.to_json}")
      else
        Rails.logger.info("#{log_message}: #{log_details.to_json}")
      end
    end

    def should_alert?(severity)
      # Alert on high and critical errors
      [ :critical, :high ].include?(severity) || Rails.env.production?
    end

    def send_to_error_tracker(error_data)
      # Integration with error tracking services
      # Uncomment and configure based on your service:

      # Sentry
      # Sentry.capture_message(
      #   "Stripe Error: #{error_data[:error_type]}",
      #   level: error_data[:severity].downcase,
      #   extra: error_data
      # )

      # Rollbar
      # Rollbar.error(
      #   "Stripe Error: #{error_data[:error_type]}",
      #   error_data
      # )

      # Honeybadger
      # Honeybadger.notify(
      #   error_class: error_data[:error_type],
      #   error_message: error_data[:error_message],
      #   context: error_data
      # )

      # For now, just log
      Rails.logger.info("[ERROR TRACKER] Would send to error tracking service: #{error_data[:error_type]}")
    end

    def store_error(error_data)
      # Store in database for analytics
      # You might create a StripeError model for this
      # StripeError.create!(error_data)

      # For now, just log
      Rails.logger.debug("[DB] Would store error: #{error_data[:error_type]}")
    end

    def send_critical_alert(error_data)
      # Send immediate alerts for critical errors
      # Options:
      # 1. Email to admin
      # 2. SMS via Twilio
      # 3. Slack notification
      # 4. PagerDuty alert

      Rails.logger.error("🚨 CRITICAL STRIPE ERROR 🚨")
      Rails.logger.error(error_data.to_json)

      # Example: Send Slack notification
      # SlackNotifier.notify_critical_error(error_data)

      # Example: Send email
      # AdminMailer.critical_stripe_error(error_data).deliver_later

      # Example: Log to a critical errors file
      log_critical_error(error_data)
    end

    def log_critical_error(error_data)
      log_file = Rails.root.join("log", "stripe_critical_errors.log")
      File.open(log_file, "a") do |f|
        f.puts("=" * 80)
        f.puts("CRITICAL STRIPE ERROR - #{Time.current}")
        f.puts("-" * 80)
        f.puts(JSON.pretty_generate(error_data))
        f.puts("=" * 80)
        f.puts
      end
    end
  end

  # Stripe error type mapping to severity
  ERROR_SEVERITY_MAP = {
    # Critical - Money/payment failures
    "Stripe::CardError" => :high,                    # Card declined
    "Stripe::InvalidRequestError" => :high,          # Invalid API request
    "Stripe::AuthenticationError" => :critical,      # API key issue
    "Stripe::PermissionError" => :critical,          # Insufficient permissions
    "Stripe::RateLimitError" => :high,               # Too many requests

    # Medium - Temporary issues
    "Stripe::APIConnectionError" => :medium,         # Network issue
    "Stripe::APIError" => :medium,                   # Stripe server error

    # High - Signature verification
    "Stripe::SignatureVerificationError" => :critical # Webhook security
  }.freeze

  # Get severity for error type
  def self.severity_for(error)
    ERROR_SEVERITY_MAP[error.class.name] || :medium
  end

  # Wrap Stripe operations with error handling
  # @example
  #   StripeErrorMonitor.safe_stripe_call(context: { user_id: 123 }) do
  #     Stripe::Subscription.create(params)
  #   end
  def self.safe_stripe_call(context: {}, reraise: true, &block)
    result = yield
    track_success(caller_locations(1, 1)[0].label, context: context)
    result
  rescue Stripe::StripeError => e
    severity = severity_for(e)
    track_error(e, context: context, severity: severity)
    raise e if reraise

    nil
  end
end
