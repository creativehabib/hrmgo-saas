import React from 'react';
import { PageTemplate } from '@/components/page-template';
import { RefreshCw, Users, Building2, Briefcase, UserPlus, Calendar, Clock, TrendingUp, BarChart3, Bell } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';
import { usePage } from '@inertiajs/react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, LineChart, Line, AreaChart, Area } from 'recharts';
import { format } from 'date-fns';

interface CompanyDashboardData {
  stats: {
    totalEmployees: number;
    totalBranches: number;
    totalDepartments: number;
    newEmployeesThisMonth: number;
    jobPostsThisMonth: number;
    candidatesThisMonth: number;
    attendanceRate: number;
    presentToday: number;
    pendingLeaves: number;
    onLeaveToday: number;
    activeJobPostings: number;
    totalCandidates: number;
  };
  charts: {
    departmentStats: Array<{name: string; value: number; color: string}>;
    hiringTrend: Array<{month: string; hires: number}>;
    candidateStatusStats: Array<{name: string; value: number; color: string}>;
    leaveTypesStats: Array<{name: string; value: number; color: string}>;
    employeeGrowthChart: Array<{month: string; employees: number}>;
  };
  recentActivities: {
    leaves: Array<any>;
    candidates: Array<any>;
    announcements: Array<any>;
    meetings: Array<any>;
  };
  userType: string;
}

interface PageAction {
  label: string;
  icon: React.ReactNode;
  variant: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  onClick: () => void;
}

export default function Dashboard({ dashboardData }: { dashboardData: CompanyDashboardData }) {
  const { t } = useTranslation();
  const { auth } = usePage().props as any;

  const pageActions: PageAction[] = [
    {
      label: t('Refresh'),
      icon: <RefreshCw className="h-4 w-4" />,
      variant: 'outline',
      onClick: () => window.location.reload()
    }
  ];

  const stats = dashboardData?.stats || {
    totalEmployees: 0,
    totalBranches: 0,
    totalDepartments: 0,
    newEmployeesThisMonth: 0,
    jobPostsThisMonth: 0,
    candidatesThisMonth: 0,
    attendanceRate: 0,
    presentToday: 0,
    pendingLeaves: 0,
    onLeaveToday: 0,
    activeJobPostings: 0,
    totalCandidates: 0
  };

  const charts = dashboardData?.charts || {
    departmentStats: [],
    hiringTrend: [],
    candidateStatusStats: [],
    leaveTypesStats: [],
    employeeGrowthChart: []
  };



  const recentActivities = dashboardData?.recentActivities || {
    leaves: [],
    candidates: [],
    announcements: [],
    meetings: []
  };

  const userType = dashboardData?.userType || 'employee';
  const isCompanyUser = userType === 'company';
  
  const getStatusColor = (status: string) => {
    const colors = {
      'approved': 'bg-green-50 text-green-700 ring-green-600/20',
      'pending': 'bg-yellow-50 text-yellow-700 ring-yellow-600/20',
      'rejected': 'bg-red-50 text-red-700 ring-red-600/20',
      'New': 'bg-blue-50 text-blue-700 ring-blue-600/20',
      'Screening': 'bg-yellow-50 text-yellow-700 ring-yellow-600/20',
      'Interview': 'bg-purple-50 text-purple-700 ring-purple-600/20',
      'Hired': 'bg-green-50 text-green-700 ring-green-600/20',
      'Rejected': 'bg-red-50 text-red-700 ring-red-600/20'
    };
    return colors[status] || 'bg-gray-50 text-gray-700 ring-gray-600/20';
  };

  return (
    <PageTemplate 
      title={t('Dashboard')}
      url="/dashboard"
      actions={pageActions}
    >
      <div className="space-y-6">
        {/* Key Metrics */}
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t('Total Employees')}</p>
                  <p className="mt-2 text-2xl font-bold">{stats.totalEmployees}</p>
                  {isCompanyUser && (
                    <p className="text-xs text-green-600 mt-1">+{stats.newEmployeesThisMonth} {t('this month')}</p>
                  )}
                </div>
                <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-900">
                  <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t('Branches')}</p>
                  <p className="mt-2 text-2xl font-bold">{stats.totalBranches}</p>
                  <p className="text-xs text-muted-foreground mt-1">{stats.totalDepartments} {t('departments')}</p>
                </div>
                <div className="rounded-full bg-green-100 p-3 dark:bg-green-900">
                  <Building2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t('Attendance Rate')}</p>
                  <p className="mt-2 text-2xl font-bold">{stats.attendanceRate}%</p>
                  <p className="text-xs text-muted-foreground mt-1">{stats.presentToday} {t('present today')}</p>
                </div>
                <div className="rounded-full bg-purple-100 p-3 dark:bg-purple-900">
                  <Clock className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t('Pending Leaves')}</p>
                  <p className="mt-2 text-2xl font-bold">{stats.pendingLeaves}</p>
                  <p className="text-xs text-muted-foreground mt-1">{stats.onLeaveToday} {t('on leave today')}</p>
                </div>
                <div className="rounded-full bg-yellow-100 p-3 dark:bg-yellow-900">
                  <Calendar className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t('Active Jobs')}</p>
                  <p className="mt-2 text-2xl font-bold">{stats.activeJobPostings}</p>
                  <p className="text-xs text-green-600 mt-1">+{stats.jobPostsThisMonth} {t('this month')}</p>
                </div>
                <div className="rounded-full bg-orange-100 p-3 dark:bg-orange-900">
                  <Briefcase className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t('Total Candidates')}</p>
                  <p className="mt-2 text-2xl font-bold">{stats.totalCandidates}</p>
                  <p className="text-xs text-green-600 mt-1">+{stats.candidatesThisMonth} {t('this month')}</p>
                </div>
                <div className="rounded-full bg-indigo-100 p-3 dark:bg-indigo-900">
                  <UserPlus className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Department Distribution Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                <BarChart3 className="h-5 w-5" />
                {t('Department Distribution')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {charts.departmentStats.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={charts.departmentStats}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      dataKey="value"
                    >
                      {charts.departmentStats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  {t('No department data available')}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Hiring Trend Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                <TrendingUp className="h-5 w-5" />
                {t('Hiring Trend (6 Months)')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {charts.hiringTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={charts.hiringTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="hires" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  {t('No hiring data available')}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Candidate Status Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                <UserPlus className="h-5 w-5" />
                {t('Candidate Status')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {charts.candidateStatusStats.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={charts.candidateStatusStats}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                    >
                      {charts.candidateStatusStats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  {t('No candidate data available')}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Leave Types Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                <Calendar className="h-5 w-5" />
                {t('Leave Types')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {charts.leaveTypesStats.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={charts.leaveTypesStats}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      dataKey="value"
                    >
                      {charts.leaveTypesStats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  {t('No leave types available')}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Activities */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent Leave Applications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-lg font-semibold">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  {t('Recent Leave Applications')}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{recentActivities.leaves.length}</Badge>
                  <button 
                    onClick={() => window.location.href = route('hr.leave-applications.index')}
                    className="px-2 py-1 text-xs bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-md font-medium transition-colors"
                  >
                    {t('View All')}
                  </button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentActivities.leaves.length > 0 ? (
                <div className="space-y-3 max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                  {recentActivities.leaves.map((leave, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium">{leave.employee?.name || 'Employee'}</p>
                          <Badge variant="outline" className={`text-xs ring-1 ring-inset ${getStatusColor(leave.status)}`}>
                            {leave.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {leave.leave_type?.name || 'Leave'} • {(() => {
                            try {
                              return leave.start_date ? format(new Date(leave.start_date), 'MMM dd') : 'N/A';
                            } catch {
                              return 'Invalid date';
                            }
                          })()} - {(() => {
                            try {
                              return leave.end_date ? format(new Date(leave.end_date), 'MMM dd') : 'N/A';
                            } catch {
                              return 'Invalid date';
                            }
                          })()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  {t('No recent leave applications')}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Candidates */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-lg font-semibold">
                <div className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5" />
                  {t('Recent Candidates')}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{recentActivities.candidates.length}</Badge>
                  <button 
                    onClick={() => window.location.href = route('hr.recruitment.candidates.index')}
                    className="px-2 py-1 text-xs bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-md font-medium transition-colors"
                  >
                    {t('View All')}
                  </button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentActivities.candidates.length > 0 ? (
                <div className="space-y-3 max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                  {recentActivities.candidates.map((candidate, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium">{candidate.first_name} {candidate.last_name}</p>
                          <Badge variant="outline" className={`text-xs ring-1 ring-inset ${getStatusColor(candidate.status)}`}>
                            {candidate.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {candidate.job?.title || 'Job'} • {(() => {
                            try {
                              return candidate.created_at ? format(new Date(candidate.created_at), 'MMM dd, yyyy') : 'N/A';
                            } catch {
                              return 'Invalid date';
                            }
                          })()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  {t('No recent candidates')}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Announcements */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-lg font-semibold">
                <div className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  {t('Recent Announcements')}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{recentActivities.announcements.length}</Badge>
                  <button 
                    onClick={() => window.location.href = route('hr.announcements.index')}
                    className="px-2 py-1 text-xs bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-md font-medium transition-colors"
                  >
                    {t('View All')}
                  </button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentActivities.announcements.length > 0 ? (
                <div className="space-y-3 max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                  {recentActivities.announcements.map((announcement, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium">{announcement.title}</p>
                          {announcement.is_high_priority && (
                            <Badge variant="outline" className="text-xs ring-1 ring-inset bg-red-50 text-red-700 ring-red-600/20">
                              High Priority
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {announcement.category} • {(() => {
                            try {
                              return announcement.created_at ? format(new Date(announcement.created_at), 'MMM dd, yyyy') : 'N/A';
                            } catch {
                              return 'Invalid date';
                            }
                          })()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  {t('No recent announcements')}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Meetings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-lg font-semibold">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  {t('Recent Meetings')}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{recentActivities.meetings.length}</Badge>
                  <button 
                    onClick={() => window.location.href = route('meetings.meetings.index')}
                    className="px-2 py-1 text-xs bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-md font-medium transition-colors"
                  >
                    {t('View All')}
                  </button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentActivities.meetings.length > 0 ? (
                <div className="space-y-3 max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                  {recentActivities.meetings.map((meeting, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium">{meeting.title}</p>
                          <Badge variant="outline" className={`text-xs ring-1 ring-inset ${getStatusColor(meeting.status)}`}>
                            {meeting.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {(() => {
                            try {
                              if (!meeting.meeting_date) return 'No date set';
                              const date = new Date(meeting.meeting_date);
                              if (isNaN(date.getTime())) return 'Invalid date';
                              const dateStr = format(date, 'MMM dd, yyyy');
                              const timeStr = meeting.start_time && meeting.end_time ? ` • ${meeting.start_time} - ${meeting.end_time}` : '';
                              return dateStr + timeStr;
                            } catch {
                              return 'Invalid date';
                            }
                          })()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  {t('No recent meetings')}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Employee Growth Chart - Full Width */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <TrendingUp className="h-5 w-5" />
              {t('Employee Growth')} ({new Date().getFullYear()})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {charts.employeeGrowthChart.length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={charts.employeeGrowthChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#ffffff', 
                      border: '1px solid #e5e7eb', 
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }} 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="employees" 
                    stroke="#3b82f6" 
                    strokeWidth={3}
                    fillOpacity={0.2} 
                    fill="#3b82f6"
                    dot={{ fill: '#3b82f6', strokeWidth: 2, r: 5 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                {t('No employee growth data available')}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageTemplate>
  );
}