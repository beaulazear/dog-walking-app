class UserSerializer < ActiveModel::Serializer
  attributes :id, :username, :password_digest, :name, :email_address, :pets, :thirty, :fourty, :sixty, :solo_rate

  has_many :pets
  has_many :appointments
end
