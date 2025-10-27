<?php

namespace App\Http\Controllers;

use App\Models\EmployeeSalary;
use App\Models\SalaryComponent;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class EmployeeSalaryController extends Controller
{
    public function index(Request $request)
    {
        // Auto-create salary records for employees who don't have one
        $companyEmployees = User::where('type', 'employee')
            ->whereIn('created_by', getCompanyAndUsersId())
            ->get();

        foreach ($companyEmployees as $employee) {
            $exists = EmployeeSalary::where('employee_id', $employee->id)->exists();
            if (!$exists) {
                EmployeeSalary::create([
                    'employee_id' => $employee->id,
                    'basic_salary' => 0,
                    'components' => null,
                    'is_active' => true,
                    'created_by' => creatorId(),
                ]);
            }
        }

        $query = EmployeeSalary::withPermissionCheck()
            ->with(['employee', 'creator']);

        // Handle search
        if ($request->has('search') && !empty($request->search)) {
            $query->where(function ($q) use ($request) {
                $q->whereHas('employee', function ($subQ) use ($request) {
                    $subQ->where('name', 'like', '%' . $request->search . '%');
                });
            });
        }

        // Handle employee filter
        if ($request->has('employee_id') && !empty($request->employee_id) && $request->employee_id !== 'all') {
            $query->where('employee_id', $request->employee_id);
        }



        // Handle active status filter
        if ($request->has('is_active') && !empty($request->is_active) && $request->is_active !== 'all') {
            $query->where('is_active', $request->is_active === 'active');
        }

        // Handle sorting
        if ($request->has('sort_field') && !empty($request->sort_field)) {
            $query->orderBy($request->sort_field, $request->sort_direction ?? 'asc');
        } else {
            $query->orderBy('id', 'desc');
        }

        $employeeSalaries = $query->paginate($request->per_page ?? 10);

        // Load component names and types for each salary record
        $employeeSalaries->getCollection()->transform(function ($salary) {
            if ($salary->components) {
                $components = SalaryComponent::whereIn('id', $salary->components)
                    ->get(['id', 'name', 'type']);
                $salary->component_names = $components->pluck('name')->toArray();
                $salary->component_types = $components->pluck('type')->toArray();
            } else {
                $salary->component_names = [];
                $salary->component_types = [];
            }
            return $salary;
        });


        // Get employees for filter dropdown
        $employees = User::where('type', 'employee')
            ->whereIn('created_by', getCompanyAndUsersId())
            ->get(['id', 'name']);

        // Get salary components for form
        $salaryComponents = SalaryComponent::where('status', 'active')
            ->whereIn('created_by', getCompanyAndUsersId())
            ->get(['id', 'name', 'type', 'calculation_type', 'default_amount', 'percentage_of_basic']);

        return Inertia::render('hr/employee-salaries/index', [
            'employeeSalaries' => $employeeSalaries,
            'employees' => $employees,
            'salaryComponents' => $salaryComponents,
            'filters' => $request->all(['search', 'employee_id', 'is_active', 'sort_field', 'sort_direction', 'per_page']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'employee_id' => 'required|exists:users,id',
            'basic_salary' => 'required|numeric|min:0',
            'components' => 'nullable|array',
            'components.*' => 'exists:salary_components,id',
            'notes' => 'nullable|string',
        ]);

        // Check if employee already has salary
        $exists = EmployeeSalary::where('employee_id', $validated['employee_id'])
            ->whereIn('created_by', getCompanyAndUsersId())
            ->exists();

        if ($exists) {
            return redirect()->back()->with('error', __('Employee already has a salary record. Please update the existing one.'));
        }

        $validated['created_by'] = creatorId();
        $validated['is_active'] = true;

        EmployeeSalary::create($validated);

        return redirect()->back()->with('success', __('Employee salary created successfully.'));
    }



    public function update(Request $request, $employeeSalaryId)
    {
        $employeeSalary = EmployeeSalary::where('id', $employeeSalaryId)
            ->whereIn('created_by', getCompanyAndUsersId())
            ->first();

        if ($employeeSalary) {
            try {
                $validated = $request->validate([
                    'employee_id' => 'required|exists:users,id',
                    'basic_salary' => 'required|numeric|min:0',
                    'components' => 'nullable|array',
                    'components.*' => 'exists:salary_components,id',
                    'is_active' => 'boolean',
                    'notes' => 'nullable|string',
                ]);

                $employeeSalary->update($validated);

                return redirect()->back()->with('success', __('Employee salary updated successfully'));
            } catch (\Exception $e) {
                return redirect()->back()->with('error', $e->getMessage() ?: __('Failed to update employee salary'));
            }
        } else {
            return redirect()->back()->with('error', __('Employee salary Not Found.'));
        }
    }

    public function destroy($employeeSalaryId)
    {
        $employeeSalary = EmployeeSalary::where('id', $employeeSalaryId)
            ->whereIn('created_by', getCompanyAndUsersId())
            ->first();

        if ($employeeSalary) {
            try {
                $employeeSalary->delete();
                return redirect()->back()->with('success', __('Employee salary deleted successfully'));
            } catch (\Exception $e) {
                return redirect()->back()->with('error', $e->getMessage() ?: __('Failed to delete employee salary'));
            }
        } else {
            return redirect()->back()->with('error', __('Employee salary Not Found.'));
        }
    }

    public function toggleStatus($employeeSalaryId)
    {
        $employeeSalary = EmployeeSalary::where('id', $employeeSalaryId)
            ->whereIn('created_by', getCompanyAndUsersId())
            ->first();

        if ($employeeSalary) {
            try {
                $employeeSalary->is_active = !$employeeSalary->is_active;
                $employeeSalary->save();

                return redirect()->back()->with('success', __('Employee salary status updated successfully'));
            } catch (\Exception $e) {
                return redirect()->back()->with('error', $e->getMessage() ?: __('Failed to update employee salary status'));
            }
        } else {
            return redirect()->back()->with('error', __('Employee salary Not Found.'));
        }
    }

    public function showPayroll($employeeSalaryId)
    {
        try {
            $employeeSalary = EmployeeSalary::where('id', $employeeSalaryId)
                ->whereIn('created_by', getCompanyAndUsersId())
                ->with('employee')
                ->first();

            if (!$employeeSalary) {
                return redirect()->route('hr.employee-salaries.index')
                    ->with('error', __('Employee salary record not found.'));
            }

            // Get payroll runs for this employee
            $payrollRuns = \App\Models\PayrollRun::whereIn('created_by', getCompanyAndUsersId())
                ->whereHas('payrollEntries', function($query) use ($employeeSalary) {
                    $query->where('employee_id', $employeeSalary->employee_id);
                })
                ->orderBy('pay_period_end', 'desc')
                ->get(['id', 'title', 'pay_period_start', 'pay_period_end', 'status']);

            if ($payrollRuns->isEmpty()) {
                return redirect()->route('hr.employee-salaries.index')
                    ->with('error', __('No payroll runs found for this employee.'));
            }

            // Get the latest payroll run
            $latestPayrollRun = $payrollRuns->first();

            return Inertia::render('hr/employee-salaries/payroll-calculation', [
                'employeeSalary' => $employeeSalary,
                'payrollRuns' => $payrollRuns,
                'selectedPayrollRun' => $latestPayrollRun,
                'payrollData' => $this->getPayrollCalculationData($employeeSalary, $latestPayrollRun)
            ]);
        } catch (\Exception $e) {
            return redirect()->route('hr.employee-salaries.index')
                ->with('error', __('Failed to load payroll calculation.'));
        }
    }

    public function getPayrollCalculation($employeeSalaryId, $payrollRunId)
    {
        try {
            $employeeSalary = EmployeeSalary::where('id', $employeeSalaryId)
                ->whereIn('created_by', getCompanyAndUsersId())
                ->with('employee')
                ->first();

            $payrollRun = \App\Models\PayrollRun::where('id', $payrollRunId)
                ->whereIn('created_by', getCompanyAndUsersId())
                ->first();

            if (!$employeeSalary || !$payrollRun) {
                return response()->json(['error' => 'Record not found'], 404);
            }

            $payrollData = $this->getPayrollCalculationData($employeeSalary, $payrollRun);

            return response()->json($payrollData);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to calculate payroll'], 500);
        }
    }

    private function getPayrollCalculationData($employeeSalary, $payrollRun)
    {
        // Get payroll entry for this employee and payroll run
        $payrollEntry = \App\Models\PayrollEntry::where('employee_id', $employeeSalary->employee_id)
            ->where('payroll_run_id', $payrollRun->id)
            ->first();

        if (!$payrollEntry) {
            return [
                'payrollEntry' => null,
                'salaryBreakdown' => ['earnings' => [], 'deductions' => []],
                'attendanceSummary' => [],
                'payrollCalculation' => ['net_salary' => 0, 'total_earnings' => 0, 'total_deductions' => 0],
                'attendanceRecords' => []
            ];
        }

        // Get attendance records for the payroll period
        $attendanceRecords = \App\Models\AttendanceRecord::where('employee_id', $employeeSalary->employee_id)
        ->whereBetween('date', [$payrollRun->pay_period_start, $payrollRun->pay_period_end])
        ->orderBy('date')
        ->get();

        // Calculate attendance summary from payroll entry
        $attendanceSummary = [
            'total_working_days' => $payrollEntry->working_days,
            'present_days' => $payrollEntry->present_days,
            'absent_days' => $payrollEntry->absent_days,
            'half_days' => $payrollEntry->half_days,
            'leave_days' => $payrollEntry->paid_leave_days,
            'holiday_days' => $payrollEntry->holiday_days,
            'overtime_hours' => $payrollEntry->overtime_hours,
            'unpaid_leave_days' => $payrollEntry->unpaid_leave_days,
            'unpaid_leave_from_leave' => $payrollEntry->unpaid_leave_days - $payrollEntry->absent_days - ($payrollEntry->half_days * 0.5)
        ];

        // Get salary breakdown from payroll entry
        $salaryBreakdown = [
            'earnings' => is_array($payrollEntry->earnings_breakdown) ? $payrollEntry->earnings_breakdown : json_decode($payrollEntry->earnings_breakdown ?? '{}', true),
            'deductions' => is_array($payrollEntry->deductions_breakdown) ? $payrollEntry->deductions_breakdown : json_decode($payrollEntry->deductions_breakdown ?? '{}', true)
        ];

        $payrollCalculation = [
            'net_salary' => $payrollEntry->net_pay,
            'total_earnings' => $payrollEntry->total_earnings,
            'total_deductions' => $payrollEntry->total_deductions,
            'per_day_salary' => $payrollEntry->per_day_salary ?? 0,
            'overtime_amount' => $payrollEntry->overtime_amount ?? 0
        ];

        return [
            'payrollEntry' => $payrollEntry,
            'salaryBreakdown' => $salaryBreakdown,
            'attendanceSummary' => $attendanceSummary,
            'payrollCalculation' => $payrollCalculation,
            'attendanceRecords' => $attendanceRecords,
            'currentMonth' => $payrollRun->pay_period_end
        ];
    }

    private function calculateAttendanceSummary($attendanceRecords, $payrollRun)
    {
        $summary = [
            'total_working_days' => 0,
            'present_days' => 0,
            'absent_days' => 0,
            'half_days' => 0,
            'leave_days' => 0,
            'holiday_days' => 0,
            'overtime_hours' => 0,
            'unpaid_leave_days' => 0,
            'unpaid_leave_from_leave' => 0
        ];

        foreach ($attendanceRecords as $record) {
            switch ($record->status) {
                case 'present':
                    $summary['present_days']++;
                    break;
                case 'absent':
                    $summary['absent_days']++;
                    break;
                case 'half_day':
                    $summary['half_days']++;
                    break;
                case 'on_leave':
                    $summary['leave_days']++;
                    break;
                case 'holiday':
                    $summary['holiday_days']++;
                    break;
            }

            if ($record->overtime_hours > 0) {
                $summary['overtime_hours'] += $record->overtime_hours;
            }
        }

        // Calculate total working days (excluding holidays)
        $summary['total_working_days'] = $summary['present_days'] + $summary['absent_days'] + $summary['half_days'] + $summary['leave_days'];

        // Calculate unpaid leave days
        $summary['unpaid_leave_days'] = $summary['absent_days'] + ($summary['half_days'] * 0.5);

        return $summary;
    }
}
