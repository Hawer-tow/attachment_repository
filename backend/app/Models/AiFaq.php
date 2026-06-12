<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AiFaq extends Model
{
    /**
     * Mass assignable attributes.
     */
    protected $fillable = [
        'question',
        'answer',
        'active',
        'role_id', // ✅ use foreign key instead of string
    ];

    /**
     * Relationship: FAQ belongs to a Role.
     */
    public function role()
    {
        return $this->belongsTo(Role::class);
    }
}
