<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class RegisterDonorRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name'               => ['required', 'string', 'min:2', 'max:100'],
            'blood_group'        => ['required', 'string', 'in:A+,A-,B+,B-,AB+,AB-,O+,O-'],
            'phone'              => ['required', 'string', 'regex:/^[6-9]\d{9}$/'],
            'city'               => ['required', 'string', 'max:100'],
            'latitude'           => ['nullable', 'numeric', 'between:-90,90'],
            'longitude'          => ['nullable', 'numeric', 'between:-180,180'],
            'date_of_birth'      => ['nullable', 'date', 'before:-18 years', 'after:-66 years'],
            'weight'             => ['nullable', 'numeric', 'min:50', 'max:200'],
            'last_donation_date' => ['nullable', 'date', 'before:today'],
        ];
    }

    public function messages(): array
    {
        return [
            'blood_group.in'          => 'Blood group must be one of: A+, A-, B+, B-, AB+, AB-, O+, O-.',
            'phone.regex'             => 'Enter a valid 10-digit Indian mobile number.',
            'date_of_birth.before'    => 'Donor must be at least 18 years old.',
            'date_of_birth.after'     => 'Donor must be 65 years old or younger.',
            'weight.min'              => 'Minimum weight required to donate is 50 kg.',
            'last_donation_date.before' => 'Last donation date cannot be in the future.',
        ];
    }
}
