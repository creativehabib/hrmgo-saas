<?php

namespace App\Http\Controllers;

use App\Models\AwardType;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;

class AwardTypeController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = AwardType::withPermissionCheck();

        // Handle search
        if ($request->has('search') && !empty($request->search)) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', '%' . $request->search . '%')
                    ->orWhere('description', 'like', '%' . $request->search . '%');
            });
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

        $awardTypes = $query->paginate($request->per_page ?? 10);

        return Inertia::render('hr/award-types/index', [
            'awardTypes' => $awardTypes,
            'filters' => $request->all(['search', 'status', 'sort_field', 'sort_direction', 'per_page']),
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'status' => 'nullable|string|in:active,inactive',
        ]);

        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator)->withInput();
        }

        AwardType::create([
            'name' => $request->name,
            'description' => $request->description,
            'status' => $request->status ?? 'active',
            'created_by' => creatorId(),
        ]);

        return redirect()->back()->with('success', __('Award type created successfully'));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, $awardTypeId)
    {
        $awardType = AwardType::where('id', $awardTypeId)
            ->whereIn('created_by', getCompanyAndUsersId())
            ->first();

        if ($awardType) {

            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:255',
                'description' => 'nullable|string',
                'status' => 'nullable|string|in:active,inactive',
            ]);

            if ($validator->fails()) {
                return redirect()->back()->withErrors($validator)->withInput();
            }

            $awardType->update([
                'name' => $request->name,
                'description' => $request->description,
                'status' => $request->status ?? 'active',
            ]);

            return redirect()->back()->with('success', __('Award type updated successfully'));
        } else {
            return redirect()->back()->with('error', __('Award Type Not Found.'));
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($awardTypeId)
    {
        $awardType = AwardType::where('id', $awardTypeId)
            ->whereIn('created_by', getCompanyAndUsersId())
            ->first();

        if ($awardType) {
            try {
                // Check if award type is being used in awards
                if ($awardType->awards()->count() > 0) {
                    return redirect()->back()->with('error', __('Cannot delete award type as it is being used in awards'));
                }

                $awardType->delete();
                return redirect()->back()->with('success', __('Award type deleted successfully'));
            } catch (\Exception $e) {
                return redirect()->back()->with('error', $e->getMessage() ?: __('Failed to delete award type'));
            }
        } else {
            return redirect()->back()->with('error', __('Award Type Not Found.'));
        }
    }

    /**
     * Toggle the status of the specified resource.
     */
    public function toggleStatus($awardTypeId)
    {
        $awardType = AwardType::where('id', $awardTypeId)
            ->whereIn('created_by', getCompanyAndUsersId())
            ->first();

        if ($awardType) {
            try {
                $awardType->status = $awardType->status === 'active' ? 'inactive' : 'active';
                $awardType->save();

                return redirect()->back()->with('success', __('Award type status updated successfully'));
            } catch (\Exception $e) {
                return redirect()->back()->with('error', $e->getMessage() ?: __('Failed to update award type status'));
            }
        } else {
            return redirect()->back()->with('error', __('Award Type Not Found.'));
        }
    }
}
