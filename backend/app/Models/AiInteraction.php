<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AiInteraction extends Model
{
    protected $fillable = ['user_id', 'prompt', 'response', 'model', 'status'];

    public function user() {
        return $this->belongsTo(User::class);
    }
}