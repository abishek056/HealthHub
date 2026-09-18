<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class CreateUserRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'name'        => ['required', 'string', 'min:2', 'max:100'],
            'email'       => ['required', 'email', 'unique:users,email', 'max:150'],
            'password'    => ['required', Password::min(8)->letters()->numbers()],
            'role'        => ['required', 'string', 'in:super_admin,hospital_admin,hospital_staff,patient'],
            'hospital_id' => ['nullable', 'integer', 'exists:hospitals,id'],
            'phone'       => ['nullable', 'string', 'max:20'],
            'is_active'   => ['nullable', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'hospital_id.exists' => 'The specified hospital does not exist.',
            'role.in'            => 'Role must be one of: super_admin, hospital_admin, hospital_staff, patient.',
        ];
    }
}
