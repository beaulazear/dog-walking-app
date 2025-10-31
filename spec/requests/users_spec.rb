require 'rails_helper'

RSpec.describe 'Users API', type: :request do
  describe 'POST /users (User Registration)' do
    let(:valid_params) do
      {
        username: 'newuser',
        password: 'password123',
        password_confirmation: 'password123',
        name: 'New User',
        email_address: 'newuser@example.com',
        thirty: 30,
        fortyfive: 40,
        sixty: 60,
        solo_rate: 35
      }
    end

    context 'with valid parameters' do
      it 'creates a new user and returns user data' do
        post '/users', params: valid_params

        expect(response).to have_http_status(:created)
        expect(json_response).to include(
          'username' => 'newuser',
          'name' => 'New User',
          'email_address' => 'newuser@example.com'
        )
        expect(json_response).to have_key('pets')
        expect(json_response).to have_key('appointments')
        expect(json_response).to have_key('invoices')
      end

      it 'logs the user in after registration' do
        post '/users', params: valid_params

        get '/me'
        expect(response).to have_http_status(:ok)
      end
    end

    context 'with invalid parameters' do
      it 'returns errors for missing username' do
        post '/users', params: valid_params.except(:username)

        expect(response).to have_http_status(:unprocessable_entity)
        expect(json_response).to have_key('errors')
        expect(json_response['errors']).to include("Username can't be blank")
      end

      it 'returns errors for duplicate username' do
        User.create!(valid_params)
        post '/users', params: valid_params

        expect(response).to have_http_status(:unprocessable_entity)
        expect(json_response['errors']).to include('Username has already been taken')
      end

      it 'returns errors for password mismatch' do
        post '/users', params: valid_params.merge(password_confirmation: 'different')

        expect(response).to have_http_status(:unprocessable_entity)
        expect(json_response['errors']).to include("Password confirmation doesn't match Password")
      end
    end
  end

  describe 'GET /users (Index)' do
    context 'when user is logged in' do
      let!(:user) { create_and_login_user }
      let!(:other_user) do
        User.create!(username: 'other', password: 'pass', name: 'Other', email_address: 'other@test.com', thirty: 30,
                     fortyfive: 40, sixty: 60, solo_rate: 35)
      end

      it 'returns all users' do
        get '/users'

        expect(response).to have_http_status(:ok)
        expect(json_response).to be_an(Array)
        expect(json_response.length).to be >= 2
      end
    end

    context 'when user is not logged in' do
      it 'returns unauthorized' do
        get '/users'

        expect(response).to have_http_status(:unauthorized)
      end
    end
  end

  describe 'GET /me (Show Current User)' do
    context 'when user is logged in' do
      let!(:user) { create_and_login_user }
      let!(:pet) { create_test_pet(user) }
      let!(:appointment) { create_test_appointment(user, pet) }

      it 'returns current user with associated data' do
        get '/me'

        expect(response).to have_http_status(:ok)
        expect(json_response).to include(
          'id' => user.id,
          'username' => user.username,
          'name' => user.name
        )
        expect(json_response['pets']).to be_an(Array)
        expect(json_response['appointments']).to be_an(Array)
        expect(json_response['invoices']).to be_an(Array)
      end
    end

    context 'when user is not logged in' do
      it 'returns unauthorized' do
        get '/me'

        expect(response).to have_http_status(:unauthorized)
      end
    end
  end

  describe 'PATCH /change_rates' do
    context 'when user is logged in' do
      let!(:user) { create_and_login_user }

      it 'updates user rates' do
        patch '/change_rates', params: {
          thirty: 35,
          fortyfive: 45,
          sixty: 65,
          solo_rate: 40
        }

        expect(response).to have_http_status(:ok)
        expect(json_response).to include(
          'thirty' => 35,
          'fortyfive' => 45,
          'sixty' => 65,
          'solo_rate' => 40
        )
      end

      it 'returns errors for invalid rates' do
        patch '/change_rates', params: {
          thirty: 'invalid',
          fortyfive: 45
        }

        expect(response).to have_http_status(:unprocessable_entity)
        expect(json_response).to have_key('errors')
      end
    end

    context 'when user is not logged in' do
      it 'returns unauthorized' do
        patch '/change_rates', params: { thirty: 35 }

        expect(response).to have_http_status(:unauthorized)
      end
    end
  end
end
