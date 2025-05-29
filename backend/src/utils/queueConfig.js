import { Queue, Worker, QueueEvents } from 'bullmq';
import IORedis from 'ioredis';
import { broadcastStage } from '../websocket/server.js';

// Initialize Redis connection
const connection = new IORedis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null,
});

// Create a queue for notes generation
export const notesQueue = new Queue('notes-generation', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
  },
});

// Queue events for monitoring
export const queueEvents = new QueueEvents('notes-generation', { connection });

// Track active jobs to maintain concurrency limit
let activeJobs = 0;
const MAX_CONCURRENT_JOBS = 1;

let flushTimeout = null;
let lastJobProcessedAt = null;
let hasQueueBeenEmpty = false;

async function checkAndScheduleFlush() {
  try {
    const jobCounts = await notesQueue.getJobCounts();
    const totalJobs = jobCounts.active + jobCounts.waiting + jobCounts.delayed + jobCounts.prioritized;
    
    if (totalJobs === 0 && activeJobs === 0) {
      if (!hasQueueBeenEmpty) {
        hasQueueBeenEmpty = true;
        lastJobProcessedAt = Date.now();
        
        // Schedule flush after a delay
        if (flushTimeout) {
          clearTimeout(flushTimeout);
        }
        
        flushTimeout = setTimeout(async () => {
          // Double-check queue is still empty
          const recheck = await notesQueue.getJobCounts();
          const recheckTotal = recheck.active + recheck.waiting + recheck.prioritized + recheck.delayed;
          
          if (recheckTotal === 0 && activeJobs === 0) {
            console.log('Queue confirmed empty, flushing Redis DB...');
            await connection.flushall();
            console.log('Redis DB flushed successfully');
          }
          hasQueueBeenEmpty = false;
        }, 10000); // 10 second delay
      }
    } else {
      // Queue has jobs, cancel any pending flush
      hasQueueBeenEmpty = false;
      if (flushTimeout) {
        clearTimeout(flushTimeout);
        flushTimeout = null;
      }
    }
  } catch (error) {
    console.error('Error in flush check:', error);
  }
}

// Set up global event listeners for the queue
queueEvents.on('active', ({ jobId, prev }) => {
  activeJobs++;
  console.log(`Job ${jobId} is now active. Active jobs: ${activeJobs}`);
});

queueEvents.on('completed', async ({ jobId, returnvalue }) => {
  activeJobs--;
  if (activeJobs < 0) {
    activeJobs = 0;
  }
  console.log(`Job ${jobId} completed. Active jobs: ${activeJobs}`);
  await checkAndScheduleFlush();
});

queueEvents.on('failed', async ({ jobId, failedReason }) => {
  activeJobs--;
  if (activeJobs < 0) {
    activeJobs = 0;
  }
  console.log(`Job ${jobId} failed: ${failedReason}. Active jobs: ${activeJobs}`);
  await checkAndScheduleFlush();
});

// Also check when new jobs are added (to cancel flush if needed)
queueEvents.on('added', async ({ jobId }) => {
  await checkAndScheduleFlush();
});

// Initialize the worker - REMOVED the function parameter
export const worker = new Worker(
  'notes-generation',
  async (job) => {
    try {
      const { requestId, ...data } = job.data;

      // Import the generateNotes function dynamically
      const { generateNotes } = await import('../controllers/pipeline.controller.js');

      // Update client that their job has started
      broadcastStage(requestId, 'PROCESSING', {
        message: 'Your request is now being processed',
        position: 0,
      });

      // Execute the actual notes generation - call the imported function
      await generateNotes(requestId, data.requestBody, data.requestIdDb, data.userId);

      return { success: true };
    } catch (error) {
      console.error(`Worker error for job ${job.id}:`, error);
      throw new Error(`Notes generation failed: ${error.message}`);
    }
  },
  {
    connection,
    concurrency: MAX_CONCURRENT_JOBS,
  }
);

// Worker event listeners
worker.on('active', (job) => {
  const { requestId } = job.data;
  broadcastStage(requestId, 'STARTING', {
    message: 'Your request is starting',
    position: 0,
  });
});

worker.on('completed', (job) => {
  const { requestId } = job.data;
  broadcastStage(requestId, 'generation_complete', {
    message: 'Notes generation completed',
  });
});

worker.on('failed', (job, err) => {
  const { requestId } = job.data;
  broadcastStage(requestId, 'ERROR', {
    message: 'Notes generation failed',
    error: err.message,
  });
});

// Function to add a job to the queue - REMOVED generateNotesFn parameter
export async function addToQueue(requestId, data) {
  try {
    const jobsCount = await notesQueue.getJobCounts();
    const position = jobsCount.waiting + jobsCount.prioritized + (activeJobs >= MAX_CONCURRENT_JOBS ? 1 : 0);

    // Add the job to the queue - only pass serializable data
    const job = await notesQueue.add(
      'generate-notes',
      {
        requestId,
        ...data, // This should only contain serializable data
      },
      {
        priority: 1,
      }
    );

    // If we're at max capacity, notify the user they're in queue
    if (position > 0) {
      broadcastStage(requestId, 'QUEUED', {
        message: 'Your request has been queued',
        position,
        jobId: job.id,
      });
    } else {
      broadcastStage(requestId, 'QUEUED', {
        message: 'Your request will be processed shortly',
        position: 0,
        jobId: job.id,
      });
    }

    console.log(`Job ${job.id} added to queue for request ${requestId}`);
    return job;
  } catch (error) {
    console.error('Error adding job to queue:', error);
    broadcastStage(requestId, 'ERROR', {
      message: 'Failed to queue your request',
      error: error.message,
    });
    throw error;
  }
}

// Function to get queue status
export async function getQueueStatus(jobId) {
  try {
    const job = await notesQueue.getJob(jobId);
    if (!job) return null;

    const state = await job.getState();
    const jobsCount = await notesQueue.getJobCounts();

    return {
      state,
      position: state === 'prioritized' ? jobsCount.prioritized : 0,
    };
  } catch (error) {
    console.error('Error getting queue status:', error);
    return null;
  }
}

// Clean completed jobs periodically
setInterval(
  async () => {
    try {
      const completed = await notesQueue.getJobs(['completed'], 0, 100);
      const failed = await notesQueue.getJobs(['failed'], 0, 100);

      const cutoff = Date.now() - 24 * 60 * 60 * 1000; // 24 hours ago

      for (const job of [...completed, ...failed]) {
        if (job.finishedOn && job.finishedOn < cutoff) {
          await job.remove();
        }
      }
    } catch (error) {
      console.error('Error cleaning up old jobs:', error);
    }
  },
  60 * 60 * 1000
); // Run every hour

// Handle graceful shutdown
process.on('SIGINT', async () => {
  if (flushTimeout) {
    clearTimeout(flushTimeout);
  }
  console.log('Shutting down queue and worker...');
  await worker.close();
  await notesQueue.close();
  await connection.quit();
  process.exit(0);
});
