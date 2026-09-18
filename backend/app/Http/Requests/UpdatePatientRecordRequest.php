<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdatePatientRecordRequest extends FormRequest
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
            'patient_name' => ['sometimes', 'required', 'string', 'min:2', 'max:150'],
            'age'          => ['sometimes', 'required', 'integer', 'min:0', 'max:130'],
            'gender'       => ['sometimes', 'required', 'string', 'in:male,female,other'],
            'phone'        => ['nullable', 'string', 'max:20'],
            'diagnosis'    => ['nullable', 'string'],
            'treatment'    => ['nullable', 'string'],
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
            'patient_name.required' => 'Patient name cannot be empty when provided.',
            'patient_name.min'      => 'Patient name must be at least 2 characters.',
            'age.required'          => 'Age cannot be empty when provided.',
            'age.integer'           => 'Age must be a valid whole number.',
            'age.min'               => 'Age cannot be negative.',
            'age.max'               => 'Age must not exceed 130 years.',
            'gender.required'       => 'Gender cannot be empty when provided.',
            'gender.in'             => 'Gender must be one of: male, female, or other.',
        ];
    }
}
