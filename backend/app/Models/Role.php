<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Role extends Model
{
    /**
     * Mass assignable attributes.
     */
    protected $fillable = [
        'name',
        'description', // ✅ include description column
    ];

    /**
     * Relationship: A role can have many users.
     */
    public function users()
    {
        return $this->hasMany(User::class);
    }

    /**
     * Relationship: A role can have many FAQs.
     */
    public function faqs()
    {
        return $this->hasMany(AiFaq::class);
    }
}
