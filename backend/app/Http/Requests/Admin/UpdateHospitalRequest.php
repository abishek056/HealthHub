<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class UpdateHospitalRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'name'      => ['sometimes', 'string', 'min:3', 'max:150'],
            'address'   => ['sometimes', 'string', 'max:300'],
            'phone'     => ['sometimes', 'string', 'max:20'],
            'email'     => ['nullable', 'email', 'max:150'],
            'latitude'  => ['nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['nullable', 'numeric', 'between:-180,180'],
            'city'      => ['nullable', 'string', 'max:100'],
            'state'     => ['nullable', 'string', 'max:100'],
            'type'      => ['nullable', 'string', 'in:government,private,trust,clinic'],
            'beds_total'=> ['nullable', 'integer', 'min:0'],
            'is_active' => ['nullable', 'boolean'],
        ];
    }
}
