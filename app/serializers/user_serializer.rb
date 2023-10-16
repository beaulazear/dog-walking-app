class UserSerializer < ActiveModel::Serializer
  attributes :id, :username, :password_digest, :name, :email_address, :pets

  has_many :pets
  has_many :appointments
  has_many :invoices
end
