# Configure session cookie settings
# This sets the session cookie to expire in 1 week (7 days)
# Users will remain logged in for a week even after closing the browser

Rails.application.config.session_store :cookie_store,
                                       key: '_dog_walking_app_session',
                                       expire_after: 1.week,
                                       secure: true, # Required for same_site: :none
                                       httponly: true, # Prevent JavaScript access to cookies for security
                                       same_site: :none # Allow cross-origin cookies for GitHub Pages frontend
# Force Render redeploy Thu Nov  6 20:24:06 EST 2025
