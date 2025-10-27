<?php

namespace App\Http\Controllers;

use App\Models\PayrollRun;
use App\Models\PayrollEntry;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Carbon\Carbon;

class PayrollRunController extends Controller
{
    public function index(Request $request)
    {
        $query = PayrollRun::withPermissionCheck()
            ->with(['creator']);

        // Handle search
        if ($request->has('search') && !empty($request->search)) {
            $query->where(function ($q) use ($request) {
                $q->where('title', 'like', '%' . $request->search . '%')
                    ->orWhere('notes', 'like', '%' . $request->search . '%');
            });
        }

        // Handle status filter
        if ($request->has('status') && !empty($request->status) && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        // Handle date range filter
        if ($request->has('date_from') && !empty($request->date_from)) {
            $query->where('pay_period_start', '>=', $request->date_from);
        }
        if ($request->has('date_to') && !empty($request->date_to)) {
            $query->where('pay_period_end', '<=', $request->date_to);
        }

        // Handle sorting
        if ($request->has('sort_field') && !empty($request->sort_field)) {
            $query->orderBy($request->sort_field, $request->sort_direction ?? 'asc');
        } else {
            $query->orderBy('pay_period_start', 'desc');
        }

        $payrollRuns = $query->paginate($request->per_page ?? 10);

        return Inertia::render('hr/payroll-runs/index', [
            'payrollRuns' => $payrollRuns,
            'filters' => $request->all(['search', 'status', 'date_from', 'date_to', 'sort_field', 'sort_direction', 'per_page']),
        ]);
    }

    public function show($payrollRunId)
    {
        $payrollRun = PayrollRun::where('id', $payrollRunId)
            ->whereIn('created_by', getCompanyAndUsersId())
            ->with(['payrollEntries.employee'])
            ->first();

        if (!$payrollRun) {
            return redirect()->back()->with('error', __('Payroll run not found.'));
        }

        return Inertia::render('hr/payroll-runs/show', [
            'payrollRun' => $payrollRun,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'payroll_frequency' => 'required|in:weekly,biweekly,monthly',
            'pay_period_start' => 'required|date',
            'pay_period_end' => 'required|date|after:pay_period_start',
            'pay_date' => 'required|date|after_or_equal:pay_period_end',
            'notes' => 'nullable|string',
        ]);

        $validated['created_by'] = creatorId();
        $validated['status'] = 'draft';

        // Check if payroll run already exists for this period
        $exists = PayrollRun::where('pay_period_start', $validated['pay_period_start'])
            ->where('pay_period_end', $validated['pay_period_end'])
            ->whereIn('created_by', getCompanyAndUsersId())
            ->exists();

        if ($exists) {
            return redirect()->back()->with('error', __('Payroll run already exists for this period.'));
        }

        PayrollRun::create($validated);

        return redirect()->back()->with('success', __('Payroll run created successfully.'));
    }

    public function update(Request $request, $payrollRunId)
    {
        $payrollRun = PayrollRun::where('id', $payrollRunId)
            ->whereIn('created_by', getCompanyAndUsersId())
            ->first();

        if ($payrollRun) {
            try {
                $validated = $request->validate([
                    'title' => 'required|string|max:255',
                    'payroll_frequency' => 'required|in:weekly,biweekly,monthly',
                    'pay_period_start' => 'required|date',
                    'pay_period_end' => 'required|date|after:pay_period_start',
                    'pay_date' => 'required|date|after_or_equal:pay_period_end',
                    'notes' => 'nullable|string',
                ]);

                // Only allow updates if status is draft
                if ($payrollRun->status !== 'draft') {
                    return redirect()->back()->with('error', __('Cannot update processed payroll run.'));
                }

                $payrollRun->update($validated);

                return redirect()->back()->with('success', __('Payroll run updated successfully'));
            } catch (\Exception $e) {
                return redirect()->back()->with('error', $e->getMessage() ?: __('Failed to update payroll run'));
            }
        } else {
            return redirect()->back()->with('error', __('Payroll run Not Found.'));
        }
    }

    public function destroy($payrollRunId)
    {
        $payrollRun = PayrollRun::where('id', $payrollRunId)
            ->whereIn('created_by', getCompanyAndUsersId())
            ->first();

        if ($payrollRun) {
            try {
                // Only allow deletion if status is draft
                if ($payrollRun->status !== 'draft') {
                    return redirect()->back()->with('error', __('Cannot delete processed payroll run.'));
                }

                $payrollRun->delete();
                return redirect()->back()->with('success', __('Payroll run deleted successfully'));
            } catch (\Exception $e) {
                return redirect()->back()->with('error', $e->getMessage() ?: __('Failed to delete payroll run'));
            }
        } else {
            return redirect()->back()->with('error', __('Payroll run Not Found.'));
        }
    }

    public function process($payrollRunId)
    {
        $payrollRun = PayrollRun::where('id', $payrollRunId)
            ->whereIn('created_by', getCompanyAndUsersId())
            ->first();

        if ($payrollRun) {
            try {
                if ($payrollRun->status !== 'draft') {
                    return redirect()->back()->with('error', __('Payroll run is not in draft status.'));
                }

                $success = $payrollRun->processPayroll();

                if ($success) {
                    return redirect()->back()->with('success', __('Payroll run processed successfully'));
                } else {
                    return redirect()->back()->with('error', __('Failed to process payroll run'));
                }
            } catch (\Exception $e) {
                return redirect()->back()->with('error', $e->getMessage() ?: __('Failed to process payroll run'));
            }
        } else {
            return redirect()->back()->with('error', __('Payroll run Not Found.'));
        }
    }
}
