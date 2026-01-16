class ClientSerializer
  class << self
    # Basic client info (for login/signup responses)
    def serialize(client)
      {
        id: client.id,
        first_name: client.first_name,
        last_name: client.last_name,
        full_name: client.full_name,
        email: client.email,
        phone_number: client.phone_number,
        notification_preferences: client.notification_preferences,
        email_verified_at: client.email_verified_at,
        phone_verified_at: client.phone_verified_at
      }
    end

    # Detailed client info (for /client/me endpoint)
    def serialize_with_details(client)
      {
        id: client.id,
        first_name: client.first_name,
        last_name: client.last_name,
        full_name: client.full_name,
        email: client.email,
        phone_number: client.phone_number,
        notification_preferences: client.notification_preferences,
        email_verified_at: client.email_verified_at,
        phone_verified_at: client.phone_verified_at,
        pets: client.pets.map { |pet| serialize_pet(pet) },
        upcoming_appointments: client.upcoming_appointments.map { |apt| serialize_appointment(apt) },
        unpaid_invoices: client.unpaid_invoices.map { |invoice| serialize_invoice(invoice) },
        total_unpaid_amount: client.total_unpaid_amount
      }
    end

    private

    def serialize_pet(pet)
      {
        id: pet.id,
        name: pet.name,
        birthdate: pet.birthdate,
        sex: pet.sex,
        spayed_neutered: pet.spayed_neutered,
        address: pet.address,
        active: pet.active
      }
    end

    def serialize_appointment(appointment)
      {
        id: appointment.id,
        pet: {
          id: appointment.pet.id,
          name: appointment.pet.name
        },
        appointment_date: appointment.appointment_date,
        start_time: appointment.start_time,
        end_time: appointment.end_time,
        duration: appointment.duration,
        recurring: appointment.recurring,
        monday: appointment.monday,
        tuesday: appointment.tuesday,
        wednesday: appointment.wednesday,
        thursday: appointment.thursday,
        friday: appointment.friday,
        saturday: appointment.saturday,
        sunday: appointment.sunday,
        walker: {
          first_name: appointment.user.name.split(' ').first
        }
      }
    end

    def serialize_invoice(invoice)
      {
        id: invoice.id,
        pet: {
          id: invoice.pet.id,
          name: invoice.pet.name
        },
        date_completed: invoice.date_completed,
        compensation: invoice.compensation,
        title: invoice.title,
        paid: invoice.paid,
        pending: invoice.pending
      }
    end
  end
end
