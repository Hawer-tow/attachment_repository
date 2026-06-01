<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ContactRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name'    => 'required|string|max:100',
            'email'   => 'required|email|max:150',
            'phone'   => 'nullable|string|regex:/^[+\d\s\-()]{7,20}$/|max:20',
            'subject' => 'required|string|max:200',
            'message' => 'required|string|max:2000',
        ];
    }

    public function messages(): array
    {
        return [
            'name.required'    => 'Your name is required.',
            'email.required'   => 'A valid email address is required.',
            'email.email'      => 'Please enter a valid email address.',
            'phone.regex'      => 'Please enter a valid phone number.',
            'subject.required' => 'A subject is required.',
            'message.required' => 'A message is required.',
        ];
    }

    public function attributes(): array
    {
        return [
            'name'    => 'full name',
            'email'   => 'email address',
            'phone'   => 'phone number',
            'subject' => 'subject',
            'message' => 'message',
        ];
    }
}