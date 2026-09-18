<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class UpdateUserRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        $userId = $this->route('id');

        return [
            'name'        => ['sometimes', 'string', 'min:2', 'max:100'],
            'email'       => ['sometimes', 'email', "unique:users,email,{$userId}", 'max:150'],
            'password'    => ['nullable', Password::min(8)->letters()->numbers()],
            'role'        => ['sometimes', 'string', 'in:super_admin,hospital_admin,hospital_staff,patient'],
            'hospital_id' => ['nullable', 'integer', 'exists:hospitals,id'],
            'phone'       => ['nullable', 'string', 'max:20'],
            'is_active'   => ['nullable', 'boolean'],
        ];
    }
}
