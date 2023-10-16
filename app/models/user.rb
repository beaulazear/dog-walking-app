class User < ApplicationRecord
    has_secure_password

    has_many :pets
    has_many :appointments
    has_many :invoices
    
    validates :username, uniqueness: true
    validates :username, presence: true
    validates :name, presence: true
    validates :email_address, presence: true
end
