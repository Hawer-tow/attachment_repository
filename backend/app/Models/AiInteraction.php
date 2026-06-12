<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AiInteraction extends Model
{
    protected $fillable = [
        'prompt',
        'response',
        'model',
        'status',
    ];
}