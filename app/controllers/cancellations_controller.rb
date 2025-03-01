class CancellationsController < ApplicationController

    def create
        cancellation = Cancellation.create(cancellation_params)
        if cancellation.valid?
            render json: cancellation.as_json(only: [ :id, :appointment_id, :date ]), status: :created
        else
            render json: { errors: cancellation.errors.full_messages }, status: :unprocessable_entity
        end
    end

    def destroy
        cancellation = Cancellation.find(params[:id])

        if cancellation
            cancellation.destroy
            render json: cancellation.as_json(only: [ :id, :appointment_id, :date ]), status: :ok
        else
            render json: { error: 'Not found' }, status: :not_found
        end
        
    end

    private

    def cancellation_params
        params.permit(:appointment_id, :date)
    end
end
