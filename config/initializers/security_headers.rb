# frozen_string_literal: true

# Security Headers Configuration
# Protects against common web vulnerabilities

Rails.application.config.action_dispatch.default_headers.merge!(
  {
    # Prevents clickjacking attacks by disallowing the site to be framed
    "X-Frame-Options" => "SAMEORIGIN",

    # Prevents MIME-type sniffing attacks
    "X-Content-Type-Options" => "nosniff",

    # Enables XSS filter in legacy browsers (modern browsers ignore this)
    "X-XSS-Protection" => "1; mode=block",

    # Controls how much referrer information is sent with requests
    # "strict-origin-when-cross-origin" is a good balance of privacy and functionality
    "Referrer-Policy" => "strict-origin-when-cross-origin",

    # Permissions Policy (formerly Feature Policy)
    # Disables potentially dangerous browser features
    "Permissions-Policy" => "geolocation=(self), microphone=(), camera=(), payment=()"
  }
)

# HSTS (HTTP Strict Transport Security) is automatically added when force_ssl = true
# in production.rb, so we don't need to set it here

# Content Security Policy (CSP) for API
# For API-only apps, CSP is less critical since we're not serving HTML
# We'll skip CSP headers to avoid interfering with CORS and API responses
# If you later add web pages, uncomment and configure CSP:
#
# Rails.application.config.content_security_policy do |policy|
#   policy.default_src :self
#   policy.connect_src :self, "https://api.stripe.com"
#   policy.img_src     :self, "https:", "data:"
# end
