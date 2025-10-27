<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Spatie\Permission\Traits\HasRoles;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Lab404\Impersonate\Models\Impersonate;
use App\Models\Plan;
use App\Models\Referral;
use App\Models\PayoutRequest;
use App\Services\MailConfigService;

class User extends BaseAuthenticatable implements MustVerifyEmail
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasRoles, HasFactory, Notifiable, Impersonate;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'email_verified_at',
        'password',
        'type',
        'avatar',
        'lang',
        'delete_status',
        'is_enable_login',
        'mode',
        'created_by',
        'google2fa_enable',
        'google2fa_secret',
        'status',
        'active_module',
    ];

    /**
     * Get fillable attributes based on SaaS mode
     */
    public function getFillable()
    {
        $fillable = parent::getFillable();

        if (isSaas()) {
            $fillable = array_merge($fillable, [
                'plan_id',
                'plan_expire_date',
                'requested_plan',
                'plan_is_active',
                'storage_limit',
                'referral_code',
                'used_referral_code',
                'is_trial',
                'trial_day',
                'trial_expire_date',
                'commission_amount'
            ]);
        }
        return $fillable;
    }

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
        'google2fa_secret',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'plan_expire_date' => 'date',
            'trial_expire_date' => 'date',
            'plan_is_active' => 'integer',
            'is_active' => 'integer',
            'is_enable_login' => 'integer',
            'google2fa_enable' => 'integer',
            'storage_limit' => 'float',
        ];
    }

    /**
     * Get the creator ID based on user type
     */
    public function creatorId()
    {
        if (isSaas()) {
            if ($this->type == 'superadmin' || $this->type == 'super admin' || $this->type == 'admin') {
                return $this->id;
            } else {
                return $this->created_by;
            }
        } else {
            // Non-SaaS: Company is the top level
            if ($this->type == 'company') {
                return $this->id;
            } else {
                return $this->created_by;
            }
        }
    }

    /**
     * Check if user is super admin
     */
    public function isSuperAdmin()
    {
        if (!isSaas()) {
            return false; // No super admin in non-SaaS
        }
        return $this->type === 'superadmin' || $this->type === 'super admin';
    }

    /**
     * Check if user is admin
     */
    public function isAdmin()
    {
        return $this->type === 'admin';
    }

    // Businesses relationship removed

    /**
     * Get the plan associated with the user.
     */
    public function plan()
    {
        if (!isSaas()) {
            return null; // No plans in non-SaaS
        }
        return $this->belongsTo(Plan::class);
    }

    /**
     * Check if user is on free plan
     */
    public function isOnFreePlan()
    {
        if (!isSaas()) {
            return false; // No plans in non-SaaS
        }
        return $this->plan && $this->plan->is_default;
    }

    /**
     * Get current plan or default plan
     */
    public function getCurrentPlan()
    {
        if (!isSaas()) {
            return null; // No plans in non-SaaS
        }

        if ($this->plan) {
            return $this->plan;
        }

        return Plan::getDefaultPlan();
    }

    /**
     * Check if user has an active plan subscription
     */
    public function hasActivePlan()
    {
        if (!isSaas()) {
            return true; // Always active in non-SaaS
        }

        return $this->plan_id &&
            $this->plan_is_active &&
            ($this->plan_expire_date === null || $this->plan_expire_date > now());
    }

    /**
     * Check if user's plan has expired
     */
    public function isPlanExpired()
    {
        if (!isSaas()) {
            return false; // No expiration in non-SaaS
        }
        return $this->plan_expire_date && $this->plan_expire_date < now();
    }

    /**
     * Check if user's trial has expired
     */
    public function isTrialExpired()
    {
        if (!isSaas()) {
            return false; // No trials in non-SaaS
        }
        return $this->is_trial && $this->trial_expire_date && $this->trial_expire_date < now();
    }

    /**
     * Check if user needs to subscribe to a plan
     */
    public function needsPlanSubscription()
    {
        if (!isSaas()) {
            return false; // No subscriptions in non-SaaS
        }

        if ($this->isSuperAdmin()) {
            return false;
        }

        if ($this->type !== 'company') {
            return false;
        }

        // Check if user has no plan and no default plan exists
        if (!$this->plan_id) {
            return !Plan::getDefaultPlan();
        }

        // Check if trial is expired
        if ($this->isTrialExpired()) {
            return true;
        }

        // Check if plan is expired (but not on trial)
        if (!$this->is_trial && $this->isPlanExpired()) {
            return true;
        }

        return false;
    }

    /**
     * Check if user can be impersonated
     */
    public function canBeImpersonated()
    {
        return $this->type === 'company';
    }

    /**
     * Check if user can impersonate others
     */
    public function canImpersonate()
    {
        if (!isSaas()) {
            return false; // No impersonation in non-SaaS
        }
        return $this->isSuperAdmin();
    }

    /**
     * Get referrals made by this company
     */
    public function referrals()
    {
        if (!isSaas()) {
            return $this->hasMany(Referral::class, 'user_id')->whereRaw('1 = 0'); // Empty relation in non-SaaS
        }
        return $this->hasMany(Referral::class, 'user_id');
    }

    /**
     * Get payout requests made by this company
     */
    public function payoutRequests()
    {
        if (!isSaas()) {
            return $this->hasMany(PayoutRequest::class, 'company_id')->whereRaw('1 = 0'); // Empty relation in non-SaaS
        }
        return $this->hasMany(PayoutRequest::class, 'company_id');
    }

    /**
     * Get the user who created this user
     */
    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get the employee record associated with the user
     */
    public function employee()
    {
        return $this->hasOne(Employee::class, 'user_id');
    }

    /**
     * Get referral balance for company
     */
    public function getReferralBalance()
    {
        if (!isSaas()) {
            return 0; // No referrals in non-SaaS
        }

        $totalEarned = $this->referrals()->sum('amount');
        $totalRequested = $this->payoutRequests()->whereIn('status', ['pending', 'approved'])->sum('amount');
        return $totalEarned - $totalRequested;
    }

    /**
     * Send the email verification notification with dynamic config.
     */
    public function sendEmailVerificationNotification()
    {
        MailConfigService::setDynamicConfig();
        parent::sendEmailVerificationNotification();
    }

    /**
     * Boot method to handle model events
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($user) {
            if (isSaas() && $user->type === 'company' && !$user->referral_code) {
                // Generate referral code after the user is saved to get the ID
                static::created(function ($createdUser) {
                    if (!$createdUser->referral_code) {
                        $createdUser->referral_code = 'REF' . str_pad($createdUser->id, 6, '0', STR_PAD_LEFT);
                        $createdUser->save();
                    }
                });
            }
        });

        static::created(function ($user) {
            // Assign default plan to company users only in SaaS mode
            if (isSaas() && $user->type === 'company' && !$user->plan_id) {
                $defaultPlan = Plan::getDefaultPlan();
                if ($defaultPlan) {
                    $user->plan_id = $defaultPlan->id;
                    $user->plan_is_active = 1;
                    $user->save();
                }
            }
        });
    }

    public function planOrders()
    {
        if (!isSaas()) {
            return $this->hasMany(PlanOrder::class)->whereRaw('1 = 0'); // Empty relation in non-SaaS
        }
        return $this->hasMany(PlanOrder::class);
    }
}
