Rails.configuration.stripe = {
  publishable_key: Rails.application.credentials.dig(:stripe, :publishable_key),
  secret_key: Rails.application.credentials.dig(:stripe, :secret_key),
  connect_client_id: Rails.application.credentials.dig(:stripe, :connect_client_id) # Optional for now
}

Stripe.api_key = Rails.configuration.stripe[:secret_key]

# Warn if Connect is not configured (for development)
if Rails.env.development? && Rails.configuration.stripe[:connect_client_id].nil?
  puts "\n⚠️  WARNING: Stripe Connect not configured yet!"
  puts "   Stripe Connect features (scooper payments) will not work."
  puts "   Other API endpoints will work normally."
  puts "   See STRIPE_SETUP_INSTRUCTIONS.md to enable Connect.\n\n"
end
