# frozen_string_literal: true

# Rack::Attack Configuration
# Protects against brute force attacks, DDoS, and abusive behavior

class Rack::Attack
  ### Configure Cache ###

  # Use Rails cache store for tracking requests
  # In production, use Redis for better performance
  Rack::Attack.cache.store = ActiveSupport::Cache::MemoryStore.new

  ### Safelist (Always Allow) ###

  # Allow requests from localhost in development
  safelist("allow-localhost") do |req|
    req.ip == "127.0.0.1" || req.ip == "::1" if Rails.env.development?
  end

  ### Throttle (Rate Limiting) ###

  # Throttle login attempts by IP address
  # 5 requests per hour
  throttle("logins/ip", limit: 5, period: 1.hour) do |req|
    if req.path == "/login" && req.post?
      req.ip
    end
  end

  # Throttle client login attempts by IP address
  throttle("client-logins/ip", limit: 5, period: 1.hour) do |req|
    if req.path == "/client/login" && req.post?
      req.ip
    end
  end

  # Throttle signup attempts by IP address
  # 3 signups per day to prevent mass account creation
  throttle("signups/ip", limit: 3, period: 1.day) do |req|
    if req.path == "/users" && req.post?
      req.ip
    end
  end

  # Throttle client signup attempts
  throttle("client-signups/ip", limit: 3, period: 1.day) do |req|
    if req.path == "/client/signup" && req.post?
      req.ip
    end
  end

  # Throttle waitlist signups
  # 5 signups per hour per IP (prevents spam while allowing legitimate retries)
  throttle("waitlist/ip", limit: 5, period: 1.hour) do |req|
    if req.path == "/waitlist_signups" && req.post?
      req.ip
    end
  end

  # Throttle pledge creation
  # 10 pledges per hour per IP (prevents spam)
  throttle("pledges/ip", limit: 10, period: 1.hour) do |req|
    if req.path.start_with?("/pledges") && req.post?
      req.ip
    end
  end

  # Throttle cleanup logging
  # 50 cleanups per day per IP (generous for legitimate scoopers)
  throttle("cleanups/ip", limit: 50, period: 1.day) do |req|
    if req.path.start_with?("/cleanups") && req.post?
      req.ip
    end
  end

  # Throttle poop report creation
  # 20 reports per day per IP
  throttle("poop-reports/ip", limit: 20, period: 1.day) do |req|
    if req.path.start_with?("/poop_reports") && req.post?
      req.ip
    end
  end

  # Throttle Stripe Connect onboarding
  # 5 attempts per hour (prevents abuse of Stripe Connect account creation)
  throttle("stripe-connect/ip", limit: 5, period: 1.hour) do |req|
    if req.path.start_with?("/stripe_connect/onboard") && req.post?
      req.ip
    end
  end

  # General API throttle by IP
  # 300 requests per 5 minutes per IP (average user usage)
  throttle("req/ip", limit: 300, period: 5.minutes) do |req|
    req.ip unless req.path.start_with?("/assets")
  end

  # Throttle by authenticated user
  # 500 requests per 5 minutes per user (for mobile apps)
  throttle("req/user", limit: 500, period: 5.minutes) do |req|
    # Extract user from JWT token
    auth_header = req.get_header("HTTP_AUTHORIZATION")
    if auth_header
      token = auth_header.split(" ").last
      begin
        decoded = JWT.decode(token, Rails.application.credentials.secret_key_base.to_s, true, algorithm: "HS256")[0]
        decoded["user_id"] || decoded["client_id"]
      rescue JWT::DecodeError
        nil
      end
    end
  end

  ### Block Requests (Immediate Ban) ###

  # Block requests containing SQL injection patterns
  blocklist("sql-injection") do |req|
    # Detect common SQL injection patterns in query parameters
    Rack::Attack::Allow2Ban.filter(req.ip, maxretry: 3, findtime: 1.hour, bantime: 24.hours) do
      req.query_string.to_s.match?(/(\bUNION\b|\bSELECT\b|\bDROP\b|\bINSERT\b|\bUPDATE\b|\bDELETE\b)/i)
    end
  end

  # Block requests with suspicious user agents
  blocklist("bad-user-agents") do |req|
    user_agent = req.user_agent.to_s
    # Block known bad bots and scanners
    user_agent.match?(/sqlmap|nikto|nmap|masscan|nessus|openvas|acunetix/i)
  end

  ### Custom Throttle Responses ###

  # Customize the response for throttled requests
  self.throttled_responder = lambda do |req|
    match_data = req.env["rack.attack.match_data"]
    now = match_data[:epoch_time]

    headers = {
      "RateLimit-Limit" => match_data[:limit].to_s,
      "RateLimit-Remaining" => "0",
      "RateLimit-Reset" => (now + (match_data[:period] - (now % match_data[:period]))).to_s,
      "Content-Type" => "application/json"
    }

    body = {
      error: "Rate limit exceeded. Please try again later.",
      retry_after: match_data[:period] - (now % match_data[:period])
    }.to_json

    [ 429, headers, [ body ] ]
  end

  # Customize the response for blocked requests
  self.blocklisted_responder = lambda do |_req|
    [ 403, { "Content-Type" => "application/json" }, [ { error: "Forbidden" }.to_json ] ]
  end

  ### Logging ###

  # Log blocked requests in production
  ActiveSupport::Notifications.subscribe("rack.attack") do |name, start, finish, request_id, payload|
    req = payload[:request]

    if [ :throttle, :blocklist ].include?(req.env["rack.attack.match_type"])
      Rails.logger.warn([
        "Rack::Attack",
        req.env["rack.attack.match_type"],
        req.env["rack.attack.matched"],
        req.ip,
        req.request_method,
        req.fullpath
      ].join(" | "))
    end
  end
end
