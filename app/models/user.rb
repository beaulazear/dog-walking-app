class User < ApplicationRecord
    has_secure_password

    has_many :pets
    has_many :appointments, through: :pets
    has_many :invoices, through: :pets

    validates :username, uniqueness: true, presence: true
    validates :name, presence: true
    validates :email_address, presence: true

    validates :thirty, :fourty, :sixty, :solo_rate, numericality: { only_integer: true }

end
