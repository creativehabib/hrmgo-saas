<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\EmployeeGoal;
use App\Models\GoalType;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;

class EmployeeGoalController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = EmployeeGoal::withPermissionCheck()->with(['employee', 'goalType']);

        // Handle search
        if ($request->has('search') && !empty($request->search)) {
            $query->where(function ($q) use ($request) {
                $q->where('title', 'like', '%' . $request->search . '%')
                    ->orWhere('description', 'like', '%' . $request->search . '%')
                    ->orWhere('target', 'like', '%' . $request->search . '%')
                    ->orWhereHas('employee', function ($q) use ($request) {
                        $q->where('name', 'like', '%' . $request->search . '%')
                            ->orWhere('employee_id', 'like', '%' . $request->search . '%');
                    });
            });
        }

        // Handle employee filter
        if ($request->has('employee_id') && !empty($request->employee_id)) {
            $query->where('employee_id', $request->employee_id);
        }

        // Handle goal type filter
        if ($request->has('goal_type_id') && !empty($request->goal_type_id)) {
            $query->where('goal_type_id', $request->goal_type_id);
        }

        // Handle status filter
        if ($request->has('status') && !empty($request->status) && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        // Handle sorting
        if ($request->has('sort_field') && !empty($request->sort_field)) {
            $query->orderBy($request->sort_field, $request->sort_direction ?? 'asc');
        } else {
            $query->orderBy('created_at', 'desc');
        }

        $goals = $query->paginate($request->per_page ?? 10);

        // Get employees for filter dropdown
        $employees = User::with('employee')
            ->where('type', 'employee')
            ->whereIn('created_by', getCompanyAndUsersId())
            ->where('status', 'active')
            ->orderBy('name')
            ->get()
            ->map(function ($user) {
                return [
                    'id' =>  $user->id,
                    'name' => $user->name,
                    'employee_id' => $user->employee->employee_id ?? $user->id
                ];
            });
        

        // Get goal types for filter dropdown
        $goalTypes = GoalType::whereIn('created_by', getCompanyAndUsersId())
            ->where('status', 'active')
            ->orderBy('name')
            ->get(['id', 'name']);

        return Inertia::render('hr/performance/employee-goals/index', [
            'goals' => $goals,
            'employees' => $employees,
            'goalTypes' => $goalTypes,
            'filters' => $request->all(['search', 'employee_id', 'goal_type_id', 'status', 'sort_field', 'sort_direction', 'per_page']),
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'employee_id' => 'required|exists:users,id',
            'goal_type_id' => 'required|exists:goal_types,id',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'target' => 'nullable|string|max:255',
            'progress' => 'nullable|integer|min:0|max:100',
            'status' => 'nullable|string|in:not_started,in_progress,completed',
        ]);

        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator)->withInput();
        }

        // Verify employee belongs to current company
        $employee = User::find($request->employee_id);
        if (!$employee || !in_array($employee->created_by, getCompanyAndUsersId())) {
            return redirect()->back()->with('error', __('Invalid employee selected'))->withInput();
        }

        // Verify goal type belongs to current company
        $goalType = GoalType::find($request->goal_type_id);
        if (!$goalType || !in_array($goalType->created_by, getCompanyAndUsersId())) {
            return redirect()->back()->with('error', __('Invalid goal type selected'))->withInput();
        }

        EmployeeGoal::create([
            'employee_id' =>  $employee->id,
            'goal_type_id' => $request->goal_type_id,
            'title' => $request->title,
            'description' => $request->description,
            'start_date' => $request->start_date,
            'end_date' => $request->end_date,
            'target' => $request->target,
            'progress' => $request->progress ?? 0,
            'status' => $request->status ?? 'not_started',
            'created_by' => creatorId(),
        ]);

        return redirect()->back()->with('success', __('Employee goal created successfully'));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, EmployeeGoal $employeeGoal)
    {
        // Check if goal belongs to current company
        if (!in_array($employeeGoal->created_by, getCompanyAndUsersId())) {
            return redirect()->back()->with('error', __('You do not have permission to update this goal'));
        }

        $validator = Validator::make($request->all(), [
            'employee_id' => 'required|exists:users,id',
            'goal_type_id' => 'required|exists:goal_types,id',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'target' => 'nullable|string|max:255',
            'progress' => 'nullable|integer|min:0|max:100',
            'status' => 'nullable|string|in:not_started,in_progress,completed',
        ]);

        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator)->withInput();
        }

        // Verify employee belongs to current company
        $employee = User::find($request->employee_id);
        if (!$employee || !in_array($employee->created_by, getCompanyAndUsersId())) {
            return redirect()->back()->with('error', __('Invalid employee selected'))->withInput();
        }

        // Verify goal type belongs to current company
        $goalType = GoalType::find($request->goal_type_id);
        if (!$goalType || !in_array($goalType->created_by, getCompanyAndUsersId())) {
            return redirect()->back()->with('error', __('Invalid goal type selected'))->withInput();
        }

        $employeeGoal->update([
            'employee_id' => $employee->id,
            'goal_type_id' => $request->goal_type_id,
            'title' => $request->title,
            'description' => $request->description,
            'start_date' => $request->start_date,
            'end_date' => $request->end_date,
            'target' => $request->target,
            'progress' => $request->progress ?? $employeeGoal->progress,
            'status' => $request->status ?? $employeeGoal->status,
        ]);

        return redirect()->back()->with('success', __('Employee goal updated successfully'));
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(EmployeeGoal $employeeGoal)
    {
        // Check if goal belongs to current company
        if (!in_array($employeeGoal->created_by, getCompanyAndUsersId())) {
            return redirect()->back()->with('error', __('You do not have permission to delete this goal'));
        }

        $employeeGoal->delete();

        return redirect()->back()->with('success', __('Employee goal deleted successfully'));
    }

    /**
     * Update the progress of the specified resource.
     */
    public function updateProgress(Request $request, EmployeeGoal $employeeGoal)
    {
        // Check if goal belongs to current company
        if (!in_array($employeeGoal->created_by, getCompanyAndUsersId())) {
            return redirect()->back()->with('error', __('You do not have permission to update this goal'));
        }

        $validator = Validator::make($request->all(), [
            'progress' => 'required|integer|min:0|max:100',
        ]);

        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator)->withInput();
        }

        // Update progress and status based on progress value
        $status = $employeeGoal->status;
        if ($request->progress == 100) {
            $status = 'completed';
        } elseif ($request->progress > 0) {
            $status = 'in_progress';
        } elseif ($request->progress == 0) {
            $status = 'not_started';
        }

        $employeeGoal->update([
            'progress' => $request->progress,
            'status' => $status,
        ]);

        return redirect()->back()->with('success', __('Goal progress updated successfully'));
    }
}
