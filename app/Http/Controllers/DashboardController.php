<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\User;
use App\Models\Plan;
use App\Models\PlanOrder;
use App\Models\PlanRequest;


class DashboardController extends Controller
{
    public function index()
    {
        $user = auth()->user();

        // Super admin always gets dashboard
        if ($user->type === 'superadmin' || $user->type === 'super admin') {
            return $this->renderDashboard();
        }

        // Check if user has dashboard permission (skip if permission doesn't exist)
        try {
            if ($user->hasPermissionTo('manage-dashboard')) {
                return $this->renderDashboard();
            }
        } catch (\Exception $e) {
            // Permission doesn't exist, continue to dashboard for authenticated users
            return $this->renderDashboard();
        }

        // Redirect to first available page
        return $this->redirectToFirstAvailablePage();
    }

    public function redirectToFirstAvailablePage()
    {
        $user = auth()->user();

        // Define available routes with their permissions
        $routes = [
            ['route' => 'users.index', 'permission' => 'manage-users'],
            ['route' => 'roles.index', 'permission' => 'manage-roles'],

            ['route' => 'plans.index', 'permission' => 'manage-plans'],
            ['route' => 'referral.index', 'permission' => 'manage-referral'],
            ['route' => 'settings.index', 'permission' => 'manage-settings'],
        ];

        // Find first available route
        foreach ($routes as $routeData) {
            if ($user->hasPermissionTo($routeData['permission'])) {
                return redirect()->route($routeData['route']);
            }
        }

        // If no permissions found, logout user
        auth()->logout();
        return redirect()->route('login')->with('error', __('No access permissions found.'));
    }

    private function renderDashboard()
    {
        $user = auth()->user();

        if ($user->type === 'superadmin' || $user->type === 'super admin') {
            return $this->renderSuperAdminDashboard();
        } else {
            return $this->renderCompanyDashboard();
        }
    }

    private function renderSuperAdminDashboard()
    {
        // Get system-wide statistics
        $totalCompanies = User::where('type', 'company')->count();
        $totalUsers = User::where('type', '!=', 'superadmin')->where('type', '!=', 'super admin')->count();
        $totalRevenue = PlanOrder::where('status', 'approved')->sum('final_price') ?? 0;
        $activePlans = Plan::where('is_plan_enable', 'on')->count();

        $pendingRequests = PlanRequest::where('status', 'pending')->count();

        // Calculate monthly growth for companies
        $currentMonthCompanies = User::where('type', 'company')
            ->whereMonth('created_at', now()->month)
            ->whereYear('created_at', now()->year)
            ->count();
        $previousMonthCompanies = User::where('type', 'company')
            ->whereMonth('created_at', now()->subMonth()->month)
            ->whereYear('created_at', now()->subMonth()->year)
            ->count();
        $monthlyGrowth = $previousMonthCompanies > 0
            ? round((($currentMonthCompanies - $previousMonthCompanies) / $previousMonthCompanies) * 100, 1)
            : ($currentMonthCompanies > 0 ? 100 : 0);

        $dashboardData = [
            'stats' => [
                'totalCompanies' => $totalCompanies,
                'totalUsers' => $totalUsers,
                'totalRevenue' => $totalRevenue,
                'activePlans' => $activePlans,
                'pendingRequests' => $pendingRequests,
                'monthlyGrowth' => $monthlyGrowth,
            ],
            'recentActivity' => [
                ['id' => 1, 'type' => 'company', 'message' => 'New company registered', 'time' => '2 hours ago', 'status' => 'success'],
                ['id' => 2, 'type' => 'plan', 'message' => 'Plan upgrade request', 'time' => '4 hours ago', 'status' => 'warning'],
                ['id' => 3, 'type' => 'payment', 'message' => 'Payment received', 'time' => '6 hours ago', 'status' => 'success'],
            ],
            'topPlans' => Plan::withCount('users')
                ->orderBy('users_count', 'desc')
                ->take(3)
                ->get()
                ->map(function ($plan) {
                    return [
                        'name' => $plan->name,
                        'subscribers' => $plan->users_count,
                        'revenue' => $plan->users_count * $plan->price,
                    ];
                })
        ];

        return Inertia::render('superadmin/dashboard', [
            'dashboardData' => $dashboardData
        ]);
    }

    private function renderCompanyDashboard()
    {
        $user = auth()->user();

        // If user is employee, show limited dashboard
        if ($user->type === 'employee') {
            return $this->renderEmployeeDashboard();
        }

        $companyUserIds = $this->getCompanyUserIds();

        // Core HR Statistics
        $totalEmployees = User::where('type', 'employee')->whereIn('created_by', $companyUserIds)->count();
        $totalBranches = \App\Models\Branch::whereIn('created_by', $companyUserIds)->count();
        $totalDepartments = \App\Models\Department::whereIn('created_by', $companyUserIds)->count();

        // Monthly Statistics
        $newEmployeesThisMonth = \App\Models\Employee::whereIn('created_by', $companyUserIds)
            ->whereMonth('created_at', now()->month)->count();
        $jobPostsThisMonth = \App\Models\JobPosting::whereIn('created_by', $companyUserIds)
            ->whereMonth('created_at', now()->month)->count();
        $candidatesThisMonth = \App\Models\Candidate::whereIn('created_by', $companyUserIds)
            ->whereMonth('created_at', now()->month)->count();

        // Attendance Statistics
        $presentToday = \App\Models\AttendanceRecord::whereIn('created_by', $companyUserIds)
            ->whereDate('date', today())->where('status', 'present')->count();

        $attendanceRate = $totalEmployees > 0 ? round(($presentToday / $totalEmployees) * 100, 1) : 0;

        // Leave Statistics
        $pendingLeaves = \App\Models\LeaveApplication::whereIn('created_by', $companyUserIds)
            ->where('status', 'pending')->count();


        $onLeaveToday = \App\Models\LeaveApplication::whereIn('created_by', $companyUserIds)
            ->where('status', 'approved');

        if (config('app.is_demo') == true) {
            $onLeaveToday = $onLeaveToday->count();
        } else {
            $onLeaveToday = $onLeaveToday->whereDate('start_date', '<=', today())
                ->whereDate('end_date', '>=', today())->count();
        }




        // Recruitment Statistics
        $activeJobPostings = \App\Models\JobPosting::whereIn('created_by', $companyUserIds)
            ->where('status', 'Published')->count();
        $totalCandidates = \App\Models\Candidate::whereIn('created_by', $companyUserIds)->count();

        // Department Distribution for Chart
        $predefinedColors = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#3B82F6', '#D946EF'];

        $departmentStats = \App\Models\Department::whereIn('created_by', $companyUserIds)
            ->withCount('employees')
            ->with('branch')
            ->orderBy('employees_count', 'desc')
            ->when(config('app.is_demo') == true, function ($query) {
                return $query->take(6);
            })
            ->get()
            ->map(function ($dept, $index) use ($predefinedColors) {
                $displayName = $dept->name . ' (' . $dept->branch->name . ')';
                return [
                    'name' => $displayName,
                    'value' => $dept->employees_count,
                    'color' => config('app.is_demo') == true
                        ? ($predefinedColors[$index] ?? '#' . substr(md5($displayName), 0, 6))
                        : '#' . substr(md5($displayName), 0, 6)
                ];
            });


        // Monthly Hiring Trend for Chart (last 6 months)
        $hiringTrend = [];
        for ($i = 5; $i >= 0; $i--) {
            $month = now()->subMonths($i);
            $count = \App\Models\Employee::whereIn('created_by', $companyUserIds)
                ->whereMonth('created_at', $month->month)
                ->whereYear('created_at', $month->year)
                ->count();
            $hiringTrend[] = [
                'month' => $month->format('M Y'),
                'hires' => $count
            ];
        }

        // Candidate Status Distribution for Chart
        $candidateStatusStats = \App\Models\Candidate::whereIn('created_by', $companyUserIds)
            ->selectRaw('status, COUNT(*) as count')
            ->groupBy('status')
            ->get()
            ->map(function ($item) {
                $colors = [
                    'New' => '#3B82F6',
                    'Screening' => '#06B6D4',
                    'Interview' => '#6366F1',
                    'Offer' => '#F59E0B',
                    'Hired' => '#10B981',
                    'Rejected' => '#EF4444'
                ];
                return [
                    'name' => $item->status,
                    'value' => $item->count,
                    'color' => $colors[$item->status] ?? '#6b7280'
                ];
            });


        // Leave Types for Chart
        $leaveTypesStats = \App\Models\LeaveType::whereIn('created_by', $companyUserIds)
            ->get()
            ->map(function ($leaveType) {
                return [
                    'name' => $leaveType->name,
                    'value' => $leaveType->max_days_per_year,
                    'color' => $leaveType->color ?: '#' . substr(md5($leaveType->name), 0, 6)
                ];
            });

        // Employee Growth Chart (Monthly for current year)
        $employeeGrowthChart = [];
        for ($month = 1; $month <= 12; $month++) {
            $count = User::where('type', 'employee')
                ->whereIn('created_by', $companyUserIds)
                ->whereMonth('created_at', $month)
                ->whereYear('created_at', now()->year)
                ->count();
            $employeeGrowthChart[] = [
                'month' => date('F', mktime(0, 0, 0, $month, 1)),
                'employees' => $count
            ];
        }

        // Recent Activities
        $recentLeaves = \App\Models\LeaveApplication::whereIn('created_by', $companyUserIds)
            ->with(['employee', 'leaveType']);
        if (config('app.is_demo') == true) {
            $recentLeaves = $recentLeaves->whereIn('status', ['approved', 'absent'])->get();
        } else {
            $recentLeaves = $recentLeaves->whereIn('status', ['approved', 'absent'])
                ->whereDate('start_date', '<=', today())
                ->whereDate('end_date', '>=', today())
                ->get();
        }




        $recentCandidates = \App\Models\Candidate::whereIn('created_by', $companyUserIds)
            ->with(['job'])
            ->orderBy('created_at', 'desc')
            ->take(5)
            ->get();

        // Recent Announcements
        $recentAnnouncements = \App\Models\Announcement::whereIn('created_by', $companyUserIds)
            ->orderBy('created_at', 'desc')
            ->take(5)
            ->get();

        // Recent Meetings
        $recentMeetings = \App\Models\Meeting::whereIn('created_by', $companyUserIds)
            ->orderBy('created_at', 'desc')
            ->take(5)
            ->get();

        $dashboardData = [
            'stats' => [
                'totalEmployees' => $totalEmployees,
                'totalBranches' => $totalBranches,
                'totalDepartments' => $totalDepartments,
                'newEmployeesThisMonth' => $newEmployeesThisMonth,
                'jobPostsThisMonth' => $jobPostsThisMonth,
                'candidatesThisMonth' => $candidatesThisMonth,
                'attendanceRate' => $attendanceRate,
                'presentToday' => $presentToday,
                'pendingLeaves' => $pendingLeaves,
                'onLeaveToday' => $onLeaveToday,
                'activeJobPostings' => $activeJobPostings,
                'totalCandidates' => $totalCandidates
            ],
            'charts' => [
                'departmentStats' => $departmentStats,
                'hiringTrend' => $hiringTrend,
                'candidateStatusStats' => $candidateStatusStats,
                'leaveTypesStats' => $leaveTypesStats,
                'employeeGrowthChart' => $employeeGrowthChart
            ],
            'recentActivities' => [
                'leaves' => $recentLeaves,
                'candidates' => $recentCandidates,
                'announcements' => $recentAnnouncements,
                'meetings' => $recentMeetings
            ],
            'userType' => $user->type
        ];

        return Inertia::render('dashboard', [
            'dashboardData' => $dashboardData
        ]);
    }

    private function renderEmployeeDashboard()
    {
        $user = auth()->user();
        $companyUserIds = $this->getCompanyUserIds();

        // Recent Announcements
        $recentAnnouncements = \App\Models\Announcement::whereIn('created_by', $companyUserIds)
            ->orderBy('created_at', 'desc')
            ->take(5)
            ->get();

        // Recent Meetings - get meetings where user is organizer
        $recentMeetings = \App\Models\Meeting::with('attendees')
            ->whereIn('created_by', $companyUserIds)
            ->where('organizer_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->get();

        // Get meetings where user is attendee
        $meetingAttendee = \App\Models\MeetingAttendee::with('meeting')
            ->where('user_id', $user->id)
            ->get();


        // Extract meetings from attendee records
        $attendeeMeetings = $meetingAttendee->pluck(value: 'meeting')->filter();

        // Merge and remove duplicates
        $recentMeetings = $recentMeetings->merge($attendeeMeetings)
            ->unique('id')
            ->filter(function ($meeting) {
                return $meeting->meeting_date >= today();
            })
            ->sortByDesc('created_at')
            ->values();

        // Employee Stats
        $totalAwards = \App\Models\Award::where('employee_id', $user->id)->count();
        $totalWarnings = \App\Models\Warning::where('employee_id', $user->id)->count();
        $totalComplaints = \App\Models\Complaint::where('against_employee_id', $user->id)->count();

        // Get shifts and attendance policies for clock in functionality
        $shifts = \App\Models\Shift::whereIn('created_by', $companyUserIds)
            ->where('status', 'active')
            ->get(['id', 'name', 'start_time', 'end_time']);

        $attendancePolicies = \App\Models\AttendancePolicy::whereIn('created_by', $companyUserIds)
            ->where('status', 'active')
            ->get(['id', 'name']);

        // Get today's attendance for the employee
        $todayAttendance = \App\Models\AttendanceRecord::where('employee_id', $user->id)
            ->where('date', \Carbon\Carbon::today())
            ->first();

        // Get employee's assigned shift
        $employeeShift = null;
        $employee = \App\Models\Employee::where('user_id', $user->id)->first();
        if ($employee && $employee->shift_id) {
            $employeeShift = \App\Models\Shift::find($employee->shift_id);
        }

        // Auto clock out previous days if not clocked out
        $previousAttendance = \App\Models\AttendanceRecord::where('employee_id', $user->id)
            ->where('date', '<', \Carbon\Carbon::today())
            ->whereNotNull('clock_in')
            ->whereNull('clock_out')
            ->get();

        foreach ($previousAttendance as $record) {
            $recordDate = \Carbon\Carbon::parse($record->date);
            $shift = \App\Models\Shift::find($record->shift_id) ?? $employeeShift;

            if ($shift) {
                $record->update([
                    'clock_out' => $shift->end_time,
                ]);

                if (method_exists($record, 'processAttendance')) {
                    $record->processAttendance();
                }
            }
        }

        // Auto clock out if shift end time has passed for today
        if ($todayAttendance && $todayAttendance->clock_in && !$todayAttendance->clock_out && $employeeShift) {
            $now = \Carbon\Carbon::now();
            $shiftEndTime = \Carbon\Carbon::today()->setTimeFromTimeString($employeeShift->end_time);

            if ($now->greaterThan($shiftEndTime)) {
                $todayAttendance->update([
                    'clock_out' => $employeeShift->end_time,
                ]);

                if (method_exists($todayAttendance, 'processAttendance')) {
                    $todayAttendance->processAttendance();
                }

                $todayAttendance = $todayAttendance->fresh();
            }
        }

        $dashboardData = [
            'stats' => [
                'totalAwards' => $totalAwards,
                'totalWarnings' => $totalWarnings,
                'totalComplaints' => $totalComplaints
            ],
            'recentActivities' => [
                'announcements' => $recentAnnouncements,
                'meetings' => $recentMeetings
            ],
            'shifts' => $shifts,
            'attendancePolicies' => $attendancePolicies,
            'todayAttendance' => $todayAttendance,
            'currentTime' => \Carbon\Carbon::now()->format('H:i:s'),
            'employeeShift' => $employeeShift,
            'userType' => $user->type
        ];
        return Inertia::render('employee-dashboard', [
            'dashboardData' => $dashboardData
        ]);
    }

    private function getCompanyUserIds()
    {
        $user = auth()->user();
        if ($user->type === 'company') {
            $companyUserIds = User::where('created_by', $user->id)->pluck('id')->toArray();
            $companyUserIds[] = $user->id;
            return $companyUserIds;
        } else {
            $userCreatedBy = User::where('id', $user->created_by)->value('id');
            $companyUserIds = User::where('created_by', $userCreatedBy)->pluck('id')->toArray();
            $companyUserIds[] = $userCreatedBy;
            return $companyUserIds;
        }
    }
}
