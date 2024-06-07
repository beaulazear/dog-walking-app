class CancellationsController < ApplicationController

    def create
        cancellation = Cancellation.create(cancellation_params)
        if cancellation.valid?
            render json: cancellation, status: :ok
        else
            render json: { errors: cancellation.errors.full_messages }, status: :unprocessable_entity
        end
    end

    private

    def cancellation_params
        params.permit(:appointment_id, :date)
    end
end
