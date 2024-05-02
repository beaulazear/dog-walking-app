class UserSerializer < ActiveModel::Serializer
  attributes :id, :username, :password_digest, :name, :email_address, :pets, :thirty, :fourty, :sixty

  has_many :pets
  has_many :appointments
end
