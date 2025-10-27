<?php

namespace App\Http\Controllers;

use App\Models\MeetingMinute;
use App\Models\Meeting;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;

class MeetingMinuteController extends Controller
{
    public function index(Request $request)
    {
        $query = MeetingMinute::withPermissionCheck()->with(['meeting.type', 'recorder']);

        if ($request->has('search') && !empty($request->search)) {
            $query->where(function ($q) use ($request) {
                $q->where('topic', 'like', '%' . $request->search . '%')
                    ->orWhere('content', 'like', '%' . $request->search . '%')
                    ->orWhereHas('meeting', function ($mq) use ($request) {
                        $mq->where('title', 'like', '%' . $request->search . '%');
                    });
            });
        }

        if ($request->has('type') && !empty($request->type) && $request->type !== 'all') {
            $query->where('type', $request->type);
        }

        if ($request->has('meeting_id') && !empty($request->meeting_id) && $request->meeting_id !== 'all') {
            $query->where('meeting_id', $request->meeting_id);
        }

        if ($request->has('recorded_by') && !empty($request->recorded_by) && $request->recorded_by !== 'all') {
            $query->where('recorded_by', $request->recorded_by);
        }

        $query->orderBy('id', 'desc');
        $meetingMinutes = $query->paginate($request->per_page ?? 10);

        $meetings = Meeting::whereIn('created_by', getCompanyAndUsersId())
            ->select('id', 'title', 'meeting_date')
            ->orderBy('meeting_date', 'desc')
            ->get();

        $employees = User::whereIn('created_by', getCompanyAndUsersId())
            ->where('type', 'employee')
            ->select('id', 'name')
            ->get();

        return Inertia::render('meetings/meeting-minutes/index', [
            'meetingMinutes' => $meetingMinutes,
            'meetings' => $meetings,
            'employees' => $employees,
            'filters' => $request->all(['search', 'type', 'meeting_id', 'recorded_by', 'per_page']),
        ]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'meeting_id' => 'required|exists:meetings,id',
            'topic' => 'required|string|max:255',
            'content' => 'required|string',
            'type' => 'required|in:Discussion,Decision,Action Item,Note',
            'recorded_by' => 'required|exists:users,id',
            'recorded_at' => 'nullable|date',
        ]);

        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator)->withInput();
        }

        MeetingMinute::create([
            'meeting_id' => $request->meeting_id,
            'topic' => $request->topic,
            'content' => $request->content,
            'type' => $request->type,
            'recorded_by' => $request->recorded_by,
            'recorded_at' => $request->recorded_at ?? now(),
            'created_by' => creatorId(),
        ]);

        return redirect()->back()->with('success', __('Meeting minute created successfully'));
    }

    public function update(Request $request, MeetingMinute $meetingMinute)
    {
        if (!in_array($meetingMinute->created_by, getCompanyAndUsersId())) {
            return redirect()->back()->with('error', __('You do not have permission to update this minute'));
        }

        $validator = Validator::make($request->all(), [
            'meeting_id' => 'required|exists:meetings,id',
            'topic' => 'required|string|max:255',
            'content' => 'required|string',
            'type' => 'required|in:Discussion,Decision,Action Item,Note',
            'recorded_by' => 'required|exists:users,id',
            'recorded_at' => 'nullable|date',
        ]);

        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator)->withInput();
        }

        $meetingMinute->update([
            'meeting_id' => $request->meeting_id,
            'topic' => $request->topic,
            'content' => $request->content,
            'type' => $request->type,
            'recorded_by' => $request->recorded_by,
            'recorded_at' => $request->recorded_at ?? $meetingMinute->recorded_at,
        ]);

        return redirect()->back()->with('success', __('Meeting minute updated successfully'));
    }

    public function destroy(MeetingMinute $meetingMinute)
    {
        if (!in_array($meetingMinute->created_by, getCompanyAndUsersId())) {
            return redirect()->back()->with('error', __('You do not have permission to delete this minute'));
        }

        $meetingMinute->delete();
        return redirect()->back()->with('success', __('Meeting minute deleted successfully'));
    }
}