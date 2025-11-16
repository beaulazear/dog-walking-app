# Be sure to restart your server when you modify this file.

# Avoid CORS issues when API is called from the frontend app.
# Handle Cross-Origin Resource Sharing (CORS) in order to accept cross-origin AJAX requests.

# Read more: https://github.com/cyu/rack-cors

Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    origins 'http://localhost:4000',
            'http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175',
            'http://192.168.1.77:5173', 'http://192.168.1.77:5174', 'http://192.168.1.77:5175',
            'https://beaulazear.github.io',
            'https://www.pocket-walks.com',
            'https://pocket-walks.com'

    resource '*',
             headers: :any,
             expose: ['Authorization'],
             methods: %i[get post put patch delete options head],
             credentials: true
  end
end
