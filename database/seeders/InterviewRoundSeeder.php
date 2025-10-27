<?php

namespace Database\Seeders;

use App\Models\InterviewRound;
use App\Models\JobPosting;
use App\Models\User;
use Illuminate\Database\Seeder;

class InterviewRoundSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get all companies
        $companies = User::where('type', 'company')->get();

        if ($companies->isEmpty()) {
            $this->command->warn('No company users found. Please run DefaultCompanySeeder first.');
            return;
        }

        // Fixed interview rounds for different job types
        $interviewRounds = [
            'technical' => [
                ['name' => 'Phone Screening', 'sequence' => 1, 'description' => 'Initial phone screening to assess basic qualifications and interest'],
                ['name' => 'Technical Assessment', 'sequence' => 2, 'description' => 'Technical skills evaluation and coding assessment'],
                ['name' => 'Technical Interview', 'sequence' => 3, 'description' => 'In-depth technical discussion with senior developers'],
                ['name' => 'Final Interview', 'sequence' => 4, 'description' => 'Final interview with hiring manager and team lead']
            ],
            'management' => [
                ['name' => 'HR Screening', 'sequence' => 1, 'description' => 'Initial HR screening for basic qualifications and cultural fit'],
                ['name' => 'Behavioral Interview', 'sequence' => 2, 'description' => 'Assessment of leadership skills and behavioral competencies'],
                ['name' => 'Case Study Presentation', 'sequence' => 3, 'description' => 'Business case study analysis and presentation'],
                ['name' => 'Panel Interview', 'sequence' => 4, 'description' => 'Final panel interview with senior management team']
            ],
            'sales' => [
                ['name' => 'Phone Interview', 'sequence' => 1, 'description' => 'Initial phone interview to assess communication and sales aptitude'],
                ['name' => 'Sales Presentation', 'sequence' => 2, 'description' => 'Sales pitch presentation and role-playing exercise'],
                ['name' => 'Manager Interview', 'sequence' => 3, 'description' => 'Interview with sales manager for final assessment']
            ],
            'general' => [
                ['name' => 'Initial Screening', 'sequence' => 1, 'description' => 'Basic qualification and interest assessment'],
                ['name' => 'Competency Interview', 'sequence' => 2, 'description' => 'Skills and competency evaluation interview'],
                ['name' => 'Final Interview', 'sequence' => 3, 'description' => 'Final interview with hiring manager']
            ]
        ];

        foreach ($companies as $company) {
            // Get job postings for this company
            $jobPostings = JobPosting::where('created_by', $company->id)->get();

            if ($jobPostings->isEmpty()) {
                $this->command->warn('No job postings found for company: ' . $company->name . '. Please run JobPostingSeeder first.');
                continue;
            }

            foreach ($jobPostings as $index => $jobPosting) {
                // Determine interview round type based on job title
                $roundType = 'general';
                $jobTitle = strtolower($jobPosting->title);

                if (str_contains($jobTitle, 'developer') || str_contains($jobTitle, 'engineer') || str_contains($jobTitle, 'technical')) {
                    $roundType = 'technical';
                } elseif (str_contains($jobTitle, 'manager') || str_contains($jobTitle, 'lead') || str_contains($jobTitle, 'director')) {
                    $roundType = 'management';
                } elseif (str_contains($jobTitle, 'sales') || str_contains($jobTitle, 'business development')) {
                    $roundType = 'sales';
                }

                $rounds = $interviewRounds[$roundType];

                foreach ($rounds as $roundData) {
                    try {
                        InterviewRound::create([
                            'job_id' => $jobPosting->id,
                            'name' => $roundData['name'],
                            'sequence_number' => $roundData['sequence'],
                            'description' => $roundData['description'],
                            'status' => 'active',
                            'created_by' => $company->id,
                        ]);
                    } catch (\Exception $e) {
                        $this->command->error('Failed to create interview round: ' . $roundData['name'] . ' for job: ' . $jobPosting->title . ' in company: ' . $company->name);
                        continue;
                    }
                }
            }
        }

        $this->command->info('InterviewRound seeder completed successfully!');
    }
}
