<?php

namespace App\Http\Controllers;

use App\Models\Department;
use App\Models\Designation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class DesignationController extends Controller
{
    public function index(Request $request)
    {
        $query = Designation::withPermissionCheck()->with(['department', 'department.branch']);

        // Handle department filter
        if ($request->has('department') && $request->department !== 'all') {
            $query->where('department_id', $request->department);
        }

        // Handle search
        if ($request->has('search') && !empty($request->search)) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', '%' . $request->search . '%')
                    ->orWhere('description', 'like', '%' . $request->search . '%');
            });
        }

        // Handle sorting
        if ($request->has('sort_field') && !empty($request->sort_field)) {
            $query->orderBy($request->sort_field, $request->sort_direction ?? 'asc');
        } else {
            $query->orderBy('created_at', 'desc');
        }

        $designations = $query->paginate($request->per_page ?? 10);

        // Get departments for dropdown
        $departments = Department::with('branch')
            ->whereIn('created_by', getCompanyAndUsersId())
            ->where('status', 'active')
            ->get();

        return Inertia::render('hr/designations/index', [
            'designations' => $designations,
            'departments' => $departments,
            'filters' => $request->all(['search', 'sort_field', 'sort_direction', 'per_page', 'department']),
        ]);
    }

    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'description' => 'nullable|string',
                'department_id' => 'required|exists:departments,id',
                'status' => 'nullable|in:active,inactive',
            ]);

            $validated['created_by'] = creatorId();

            // Check if department belongs to current company
            $department = Department::where('id', $validated['department_id'])
                ->whereIn('created_by', getCompanyAndUsersId())
                ->first();
            
            if (!$department) {
                return redirect()->back()->with('error', __('Selected department does not belong to your company'));
            }



            Designation::create($validated);

            return redirect()->back()->with('success', __('Designation created successfully'));
        } catch (\Exception $e) {
            return redirect()->back()->with('error', $e->getMessage() ?: __('Failed to create designation'));
        }
    }

    public function update(Request $request, $designationId)
    {
        $designation = Designation::where('id', $designationId)
            ->whereIn('created_by', getCompanyAndUsersId())
            ->first();

        if ($designation) {
            try {
                $validated = $request->validate([
                    'name' => 'required|string|max:255',
                    'description' => 'nullable|string',
                    'department_id' => 'required|exists:departments,id',
                    'status' => 'nullable|in:active,inactive',
                ]);

                // Check if department belongs to current company
                $department = Department::where('id', $validated['department_id'])
                    ->whereIn('created_by', getCompanyAndUsersId())
                    ->first();
                
                if (!$department) {
                    return redirect()->back()->with('error', __('Selected department does not belong to your company.'));
                }



                $designation->update($validated);

                return redirect()->back()->with('success', __('Designation updated successfully'));
            } catch (\Exception $e) {
                return redirect()->back()->with('error', $e->getMessage() ?: __('Failed to update designation'));
            }
        } else {
            return redirect()->back()->with('error', __('Designation Not Found.'));
        }
    }

    public function destroy($designationId)
    {
        $designation = Designation::where('id', $designationId)
            ->whereIn('created_by', getCompanyAndUsersId())
            ->first();

        if ($designation) {
            try {
                $designation->delete();
                return redirect()->back()->with('success', __('Designation deleted successfully'));
            } catch (\Exception $e) {
                return redirect()->back()->with('error', $e->getMessage() ?: __('Failed to delete designation'));
            }
        } else {
            return redirect()->back()->with('error', __('Designation Not Found.'));
        }
    }

    public function toggleStatus($designationId)
    {
        $designation = Designation::where('id', $designationId)
            ->whereIn('created_by', getCompanyAndUsersId())
            ->first();

        if ($designation) {
            try {
                $designation->status = $designation->status === 'active' ? 'inactive' : 'active';
                $designation->save();
                return redirect()->back()->with('success', __('Designation status updated successfully'));
            } catch (\Exception $e) {
                return redirect()->back()->with('error', $e->getMessage() ?: __('Failed to update designation status'));
            }
        } else {
            return redirect()->back()->with('error', __('Designation Not Found.'));
        }
    }
}