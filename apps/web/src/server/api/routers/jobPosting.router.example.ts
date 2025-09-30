/**
 * Job Posting Router - Usage Examples
 *
 * This file demonstrates how to use the jobPosting tRPC router from the frontend.
 * Import this pattern in your React components or Next.js pages.
 */

import { api } from '@/utils/api'; // tRPC client

// ============================================================================
// EXAMPLE 1: Create a new job posting
// ============================================================================
export function CreateJobPostingExample() {
  const createJobMutation = api.jobPosting.create.useMutation();

  const handleCreateJob = async () => {
    try {
      const newJob = await createJobMutation.mutateAsync({
        title: 'Senior CPA - Tax Specialist',
        department: 'Tax',
        location: 'Remote',
        employmentType: 'full_time',
        experienceLevel: 'senior',
        description: 'We are seeking an experienced Senior CPA...',
        responsibilities: [
          'Prepare complex tax returns',
          'Review junior staff work',
          'Client consultation',
        ],
        requirements: [
          'CPA certification required',
          '5+ years tax experience',
          'Knowledge of corporate taxation',
        ],
        preferredSkills: [
          'International tax experience',
          'M&A tax planning',
        ],
        salaryMin: 90000,
        salaryMax: 130000,
        compensationType: 'salary',
        benefits: ['Health Insurance', '401k Matching', 'Remote Work'],
        priority: 'high',
        openings: 2,
        keywords: ['CPA', 'Tax', 'Senior', 'Corporate Tax'],
        tags: ['Remote', 'Full-Time'],
      });

      console.log('Job created:', newJob);
      // Job has auto-generated slug, organizationId, and default pipeline stages
    } catch (error) {
      console.error('Failed to create job:', error);
    }
  };

  return (
    <button onClick={handleCreateJob} disabled={createJobMutation.isLoading}>
      {createJobMutation.isLoading ? 'Creating...' : 'Create Job Posting'}
    </button>
  );
}

// ============================================================================
// EXAMPLE 2: List job postings with pagination
// ============================================================================
export function JobPostingsListExample() {
  const { data, isLoading, fetchNextPage, hasNextPage } =
    api.jobPosting.list.useInfiniteQuery(
      {
        status: 'active', // Optional: filter by status
        limit: 20,
      },
      {
        getNextPageParam: (lastPage) => lastPage.nextCursor,
      }
    );

  if (isLoading) return <div>Loading jobs...</div>;

  return (
    <div>
      {data?.pages.map((page) =>
        page.jobs.map((job) => (
          <div key={job.id}>
            <h3>{job.title}</h3>
            <p>{job.location} - {job.employmentType}</p>
            <p>Hiring Manager: {job.hiringManager?.name || 'Not assigned'}</p>
            <p>Applications: {job._count.applications}</p>
          </div>
        ))
      )}

      {hasNextPage && (
        <button onClick={() => fetchNextPage()}>
          Load More
        </button>
      )}
    </div>
  );
}

// ============================================================================
// EXAMPLE 3: Get single job posting details
// ============================================================================
export function JobPostingDetailsExample({ jobId }: { jobId: string }) {
  const { data: job, isLoading, error } = api.jobPosting.getById.useQuery({
    id: jobId,
  });

  if (isLoading) return <div>Loading job details...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!job) return <div>Job not found</div>;

  return (
    <div>
      <h1>{job.title}</h1>
      <p>{job.department} | {job.location}</p>
      <p>Experience: {job.experienceLevel}</p>
      <p>Salary: ${job.salaryMin} - ${job.salaryMax}</p>

      <h2>Description</h2>
      <p>{job.description}</p>

      <h2>Responsibilities</h2>
      <ul>
        {job.responsibilities.map((resp, idx) => (
          <li key={idx}>{resp}</li>
        ))}
      </ul>

      <h2>Requirements</h2>
      <ul>
        {job.requirements.map((req, idx) => (
          <li key={idx}>{req}</li>
        ))}
      </ul>

      <p>Status: {job.status}</p>
      <p>Applications: {job._count.applications}</p>
      <p>Views: {job.viewCount}</p>
    </div>
  );
}

// ============================================================================
// EXAMPLE 4: Update job posting
// ============================================================================
export function UpdateJobPostingExample({ jobId }: { jobId: string }) {
  const updateJobMutation = api.jobPosting.update.useMutation();

  const handleUpdateJob = async () => {
    try {
      const updatedJob = await updateJobMutation.mutateAsync({
        id: jobId,
        title: 'Senior CPA - Tax Specialist (Updated)',
        salaryMin: 95000,
        salaryMax: 140000,
        status: 'active',
      });

      console.log('Job updated:', updatedJob);
    } catch (error) {
      console.error('Failed to update job:', error);
    }
  };

  return (
    <button onClick={handleUpdateJob} disabled={updateJobMutation.isLoading}>
      {updateJobMutation.isLoading ? 'Updating...' : 'Update Job'}
    </button>
  );
}

// ============================================================================
// EXAMPLE 5: Publish job posting to job boards
// ============================================================================
export function PublishJobPostingExample({ jobId }: { jobId: string }) {
  const publishMutation = api.jobPosting.publish.useMutation();

  const handlePublish = async () => {
    try {
      const result = await publishMutation.mutateAsync({
        id: jobId,
        distributeTo: ['linkedin', 'indeed'], // Optional: specify job boards
      });

      console.log('Job published:', result.message);
      console.log('Published job:', result.job);
    } catch (error) {
      console.error('Failed to publish job:', error);
    }
  };

  return (
    <button onClick={handlePublish} disabled={publishMutation.isLoading}>
      {publishMutation.isLoading ? 'Publishing...' : 'Publish Job'}
    </button>
  );
}

// ============================================================================
// EXAMPLE 6: Delete job posting (soft delete)
// ============================================================================
export function DeleteJobPostingExample({ jobId }: { jobId: string }) {
  const deleteMutation = api.jobPosting.delete.useMutation();

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this job posting?')) {
      return;
    }

    try {
      const result = await deleteMutation.mutateAsync({ id: jobId });
      console.log(result.message);
    } catch (error) {
      console.error('Failed to delete job:', error);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={deleteMutation.isLoading}
      className="text-red-600"
    >
      {deleteMutation.isLoading ? 'Deleting...' : 'Delete Job'}
    </button>
  );
}

// ============================================================================
// EXAMPLE 7: Public career page - Get job by slug
// ============================================================================
export function PublicJobPostingExample({ slug }: { slug: string }) {
  const { data: job, isLoading } = api.jobPosting.getBySlug.useQuery({
    slug,
  });

  // Increment view count when job is viewed
  const incrementViewsMutation = api.jobPosting.incrementViews.useMutation();

  React.useEffect(() => {
    if (job) {
      incrementViewsMutation.mutate({ slug });
    }
  }, [job?.id]);

  if (isLoading) return <div>Loading...</div>;
  if (!job) return <div>Job not found</div>;

  return (
    <div>
      <div>
        <img src={job.organization.logo} alt={job.organization.name} />
        <h2>{job.organization.name}</h2>
      </div>

      <h1>{job.title}</h1>
      <p>{job.location} | {job.employmentType}</p>

      <div>
        <p>{job._count.applications} applicants</p>
        <p>{job.viewCount} views</p>
      </div>

      <button>Apply Now</button>
    </div>
  );
}

// ============================================================================
// EXAMPLE 8: Track job views (for analytics)
// ============================================================================
export function TrackJobViewExample({ jobId }: { jobId: string }) {
  const incrementViewsMutation = api.jobPosting.incrementViews.useMutation();

  React.useEffect(() => {
    // Track view when component mounts
    incrementViewsMutation.mutate({ id: jobId });
  }, [jobId]);

  return null; // This component just tracks views
}

// ============================================================================
// EXAMPLE 9: Complete job posting workflow
// ============================================================================
export function CompleteJobPostingWorkflow() {
  const createJobMutation = api.jobPosting.create.useMutation();
  const updateJobMutation = api.jobPosting.update.useMutation();
  const publishMutation = api.jobPosting.publish.useMutation();

  const handleCompleteWorkflow = async () => {
    try {
      // Step 1: Create draft job posting
      const draft = await createJobMutation.mutateAsync({
        title: 'Staff Accountant',
        location: 'New York, NY',
        employmentType: 'full_time',
        experienceLevel: 'entry',
        description: 'Entry-level accounting position...',
        responsibilities: ['Prepare journal entries', 'Bank reconciliations'],
        requirements: ['Bachelor\'s degree in Accounting', '0-2 years experience'],
        salaryMin: 55000,
        salaryMax: 70000,
      });

      console.log('Draft created:', draft.id);

      // Step 2: Review and update details
      const updated = await updateJobMutation.mutateAsync({
        id: draft.id,
        preferredSkills: ['QuickBooks', 'Excel'],
        benefits: ['Health Insurance', 'PTO', '401k'],
      });

      console.log('Job updated:', updated.id);

      // Step 3: Publish to job boards
      const published = await publishMutation.mutateAsync({
        id: draft.id,
        distributeTo: ['linkedin', 'indeed', 'ziprecruiter'],
      });

      console.log('Job published:', published.job.slug);
      console.log('Public URL:', `/careers/${published.job.slug}`);
    } catch (error) {
      console.error('Workflow failed:', error);
    }
  };

  return (
    <button onClick={handleCompleteWorkflow}>
      Create & Publish Job
    </button>
  );
}

// ============================================================================
// TYPE EXAMPLES: TypeScript usage with inferred types
// ============================================================================
import type { RouterOutputs } from '@/utils/api';

type JobPosting = RouterOutputs['jobPosting']['getById'];
type JobPostingList = RouterOutputs['jobPosting']['list'];
type CreateJobInput = Parameters<typeof api.jobPosting.create.useMutation>[0];

// Use inferred types in your components
export function TypedJobPostingExample() {
  const [selectedJob, setSelectedJob] = React.useState<JobPosting | null>(null);

  const handleJobSelect = (job: JobPosting) => {
    setSelectedJob(job);
  };

  return <div>{/* Component implementation */}</div>;
}