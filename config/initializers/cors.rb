# Be sure to restart your server when you modify this file.

# Avoid CORS issues when API is called from the frontend app.
# Handle Cross-Origin Resource Sharing (CORS) in order to accept cross-origin AJAX requests.

# Read more: https://github.com/cyu/rack-cors

Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    # Web app origins
    origins "http://localhost:4000",
            "http://localhost:5173", "http://localhost:5174", "http://localhost:5175",
            "http://192.168.1.77:5173", "http://192.168.1.77:5174", "http://192.168.1.77:5175",
            "https://beaulazear.github.io",
            "https://www.pocket-walks.com",
            "https://pocket-walks.com"

    resource "*",
             headers: :any,
             expose: [ "Authorization" ],
             methods: %i[get post put patch delete options head],
             credentials: true
  end

  # Mobile app support (React Native/Expo)
  # Mobile apps don't send Origin headers, so we need to allow requests without origin
  allow do
    origins { |source, env|
      # Allow requests with no origin (mobile apps) or any origin in development
      !source || Rails.env.development?
    }

    resource "*",
             headers: :any,
             expose: [ "Authorization" ],
             methods: %i[get post put patch delete options head],
             credentials: false  # Mobile apps don't use credentials
  end
end
