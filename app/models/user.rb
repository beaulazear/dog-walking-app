class User < ApplicationRecord
    has_secure_password

    has_many :pets
    has_many :appointments
    
    validates :username, uniqueness: true
    validates :username, presence: true
    validates :name, presence: true
    validates :email_address, presence: true

    validates :thirty, numericality: { only_integer: true }
    validates :fourty, numericality: { only_integer: true }
    validates :sixty, numericality: { only_integer: true }
    validates :solo_rate, numericality: { only_integer: true }

end
