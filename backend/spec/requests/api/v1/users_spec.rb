require 'rails_helper'

RSpec.describe 'Api::V1::Users', type: :request do
  let(:user) { create(:user) }
  let(:admin) { create(:user, :admin) }
  let(:token) { user.generate_jwt }
  let(:admin_token) { admin.generate_jwt }

  describe 'GET /api/v1/users/profile' do
    it 'returns current user profile' do
      get '/api/v1/users/profile',
          headers: { 'Authorization' => token }

      expect(response).to have_http_status(:ok)
      json_response = JSON.parse(response.body)
      expect(json_response['data']['attributes']['email']).to eq(user.email)
    end
  end

  describe 'GET /api/v1/users' do
    before do
      create_list(:user, 3)
    end

    it 'returns forbidden for regular user' do
      get '/api/v1/users', headers: { 'Authorization' => token }
      expect(response).to have_http_status(:forbidden)
    end

    it 'returns users for admin' do
      get '/api/v1/users', headers: { 'Authorization' => admin_token }
      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json).to have_key('data')
    end
  end

  describe 'PATCH /api/v1/users/:id/toggle_role' do
    let(:target_user) { create(:user) }

    context 'as admin' do
      it 'toggles user role' do
        patch "/api/v1/users/#{target_user.id}/toggle_role",
              headers: { 'Authorization' => admin_token }

        expect(response).to have_http_status(:ok)
        json_response = JSON.parse(response.body)
        expect(json_response['data']['attributes']['role']).to eq('admin')
      end
    end

    context 'as regular user' do
      it 'returns forbidden' do
        patch "/api/v1/users/#{target_user.id}/toggle_role",
              headers: { 'Authorization' => token }

        expect(response).to have_http_status(:forbidden)
      end
    end
  end

  describe 'PATCH /api/v1/users/:id' do
    let(:target_user) { create(:user) }

    it 'returns validation errors for invalid update' do
      patch "/api/v1/users/#{target_user.id}",
            headers: { 'Authorization' => admin_token },
            params: { user: { email: 'invalid_email' } }

  expect(response).to have_http_status(:unprocessable_content)
  json = JSON.parse(response.body)
  expect(json['error']).to be_present
  expect(json['error']['details']).to be_present
    end

    it 'deletes user as admin' do
      delete "/api/v1/users/#{target_user.id}", headers: { 'Authorization' => admin_token }
      expect(response).to have_http_status(:no_content)
    end
  end
end
