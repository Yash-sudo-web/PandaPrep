// localQueue.js
import mongoose from 'mongoose';
import { broadcastStage } from '../websocket/server.js';
import { generateNotes } from '../controllers/pipeline.controller.js';
import { JobModel } from '../models/jobs-queue.model.js';

const queue = [];
let activeJobs = 0;
const MAX_CONCURRENT_JOBS = 1;

// Process jobs one by one
async function processQueue() {
  if (activeJobs >= MAX_CONCURRENT_JOBS || queue.length === 0) return;

  const job = queue.shift();
  if (!job) return;

  activeJobs++;
  await JobModel.findByIdAndUpdate(job._id, { status: 'processing', updatedAt: new Date() });

  const { requestId, data } = job;

  try {
    broadcastStage(requestId, 'STARTING', { message: 'Your request is starting', position: 0 });
    broadcastStage(requestId, 'PROCESSING', { message: 'Processing your request...', position: 0 });

    await generateNotes(requestId, data.requestBody, data.requestIdDb, data.userId);

    await JobModel.findByIdAndUpdate(job._id, { status: 'completed', updatedAt: new Date() });
    broadcastStage(requestId, 'generation_complete', { message: 'Notes generation completed' });
  } catch (err) {
    await JobModel.findByIdAndUpdate(job._id, {
      status: 'failed',
      updatedAt: new Date(),
      $inc: { retries: 1 },
    });

    broadcastStage(requestId, 'ERROR', {
      message: 'Notes generation failed',
      error: err.message,
    });
  } finally {
    activeJobs--;
    processQueue(); // Process next job
  }
}

// Adds job to MongoDB and in-memory queue
export async function addToQueue(requestId, data) {
  try {
    const job = new JobModel({ requestId, data });
    await job.save();

    queue.push(job);
    processQueue();

    const queuedCount = await JobModel.countDocuments({ status: 'queued' });
    broadcastStage(requestId, 'QUEUED', {
      message: 'Your request has been queued',
      position: queuedCount,
      jobId: job._id,
    });

    console.log(`Job ${job._id} added to local queue`);
    return job;
  } catch (err) {
    console.error('Error adding job:', err);
    broadcastStage(requestId, 'ERROR', {
      message: 'Failed to queue your request',
      error: err.message,
    });
    throw err;
  }
}

export async function getQueueStatus(jobId) {
  try {
    const job = await JobModel.findById(jobId);
    if (!job) return null;

    // Count jobs that were created before this job and are still pending
    const position = await JobModel.countDocuments({
      status: 'queued',
      createdAt: { $lt: job.createdAt },
    });

    return {
      state: job.status,
      position,
    };
  } catch (err) {
    console.error('Error getting queue status:', err);
    return null;
  }
}

// On startup, reload unfinished jobs
export async function recoverPendingJobs() {
  const pendingJobs = await JobModel.find({ status: { $in: ['queued', 'processing'] } }).sort({ createdAt: 1 });
  queue.push(...pendingJobs);
  console.log(`Recovered ${pendingJobs.length} jobs from MongoDB`);
  processQueue();
}

// Optional: Clean up completed jobs older than 24h
setInterval(async () => {
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  await JobModel.deleteMany({ status: { $in: ['completed', 'failed'] }, updatedAt: { $lt: new Date(cutoff) } });
}, 60 * 60 * 1000);

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down...');
  await mongoose.disconnect();
  process.exit(0);
});
