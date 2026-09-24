<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StorePatientRecordRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'patient_name' => ['required', 'string', 'min:2', 'max:150'],
            'age'          => ['required', 'integer', 'min:0', 'max:100'],
            'gender'       => ['required', 'string', 'in:male,female,other'],
            'phone'        => ['nullable', 'string', 'max:20'],
            'diagnosis'      => ['nullable', 'string'],
            'treatment'      => ['nullable', 'string'],
            'hospital_id'    => ['nullable', 'integer', 'exists:hospitals,id'],
            'appointment_id' => ['nullable', 'integer', 'exists:appointments,id'],
        ];
    }

    /**
     * Custom validation error messages.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'patient_name.required' => 'Patient name is required.',
            'patient_name.min'      => 'Patient name must be at least 2 characters.',
            'age.required'          => 'Patient age is required.',
            'age.integer'           => 'Age must be a valid whole number.',
            'age.min'               => 'Age cannot be negative.',
            'age.max'               => 'Age must not exceed 100 years.',
            'gender.required'       => 'Gender is required.',
            'gender.in'             => 'Gender must be one of: male, female, or other.',
            'hospital_id.exists'    => 'The specified hospital does not exist.',
        ];
    }
}
