# Configure session cookie settings
# This sets the session cookie to expire in 1 week (7 days)
# Users will remain logged in for a week even after closing the browser

Rails.application.config.session_store :cookie_store,
                                       key: '_dog_walking_app_session',
                                       expire_after: 1.week,
                                       secure: Rails.env.production?, # Use secure cookies in production (HTTPS only)
                                       httponly: true, # Prevent JavaScript access to cookies for security
                                       same_site: :strict # CSRF protection - already set in application.rb but reinforced here
