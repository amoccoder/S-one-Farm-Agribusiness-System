/**
 * Enhanced Message Queue Manager using BullMQ
 * Handles asynchronous task processing with Redis
 */

const { Queue, Worker } = require('bullmq');

class QueueManager {
  constructor() {
    this.queues = {};
    this.workers = {};
    this.isInitialized = false;
  }

  /**
   * Initialize queue manager
   */
  async initialize() {
    try {
      const redisConfig = {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
      };

      // Create queues for different tasks
      this.queues.email = new Queue('email-notifications', { connection: redisConfig });
      this.queues.audit = new Queue('audit-logs', { connection: redisConfig });
      this.queues.analytics = new Queue('analytics-processing', { connection: redisConfig });
      this.queues.notifications = new Queue('user-notifications', { connection: redisConfig });
      this.queues.iot = new Queue('iot-ingestion', { connection: redisConfig });
      this.queues.reports = new Queue('report-generation', { connection: redisConfig });

      // Set up event listeners
      this.setupEventListeners();

      this.isInitialized = true;
      console.log('Queue manager initialized successfully');
    } catch (error) {
      console.error('Failed to initialize queue manager:', error);
      this.isInitialized = false;
    }
  }

  /**
   * Set up event listeners for all queues
   */
  setupEventListeners() {
    Object.entries(this.queues).forEach(([name, queue]) => {
      queue.on('completed', (job) => {
        console.log(`[${name}] Job ${job.id} completed`);
      });

      queue.on('failed', (job, err) => {
        console.error(`[${name}] Job ${job.id} failed:`, err.message);
      });

      queue.on('error', (error) => {
        console.error(`[${name}] Queue error:`, error);
      });

      queue.on('waiting', (job) => {
        console.log(`[${name}] Job ${job.id} waiting`);
      });

      queue.on('active', (job) => {
        console.log(`[${name}] Job ${job.id} active`);
      });
    });
  }

  /**
   * Add email notification job
   */
  async addEmailJob(data, options = {}) {
    try {
      if (!this.isInitialized) {
        console.warn('Queue manager not initialized');
        return null;
      }

      const job = await this.queues.email.add('send-email', data, {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: true,
        ...options,
      });

      console.log(`Email job added: ${job.id}`);
      return job;
    } catch (error) {
      console.error('Error adding email job:', error);
      return null;
    }
  }

  /**
   * Add audit log job
   */
  async addAuditJob(data, options = {}) {
    try {
      if (!this.isInitialized) {
        console.warn('Queue manager not initialized');
        return null;
      }

      const job = await this.queues.audit.add('log-audit', data, {
        attempts: 5,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
        removeOnComplete: true,
        ...options,
      });

      console.log(`Audit job added: ${job.id}`);
      return job;
    } catch (error) {
      console.error('Error adding audit job:', error);
      return null;
    }
  }

  /**
   * Add analytics processing job
   */
  async addAnalyticsJob(data, options = {}) {
    try {
      if (!this.isInitialized) {
        console.warn('Queue manager not initialized');
        return null;
      }

      const job = await this.queues.analytics.add('process-analytics', data, {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: true,
        ...options,
      });

      console.log(`Analytics job added: ${job.id}`);
      return job;
    } catch (error) {
      console.error('Error adding analytics job:', error);
      return null;
    }
  }

  /**
   * Add user notification job
   */
  async addNotificationJob(data, options = {}) {
    try {
      if (!this.isInitialized) {
        console.warn('Queue manager not initialized');
        return null;
      }

      const job = await this.queues.notifications.add('send-notification', data, {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: true,
        ...options,
      });

      console.log(`Notification job added: ${job.id}`);
      return job;
    } catch (error) {
      console.error('Error adding notification job:', error);
      return null;
    }
  }

  /**
   * Add IoT ingestion job
   */
  async addIoTJob(data, options = {}) {
    try {
      if (!this.isInitialized) {
        console.warn('Queue manager not initialized');
        return null;
      }

      const job = await this.queues.iot.add('ingest-iot-data', data, {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
        removeOnComplete: true,
        ...options,
      });

      console.log(`IoT job added: ${job.id}`);
      return job;
    } catch (error) {
      console.error('Error adding IoT job:', error);
      return null;
    }
  }

  /**
   * Add report generation job
   */
  async addReportJob(data, options = {}) {
    try {
      if (!this.isInitialized) {
        console.warn('Queue manager not initialized');
        return null;
      }

      const job = await this.queues.reports.add('generate-report', data, {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: true,
        ...options,
      });

      console.log(`Report job added: ${job.id}`);
      return job;
    } catch (error) {
      console.error('Error adding report job:', error);
      return null;
    }
  }

  /**
   * Process email queue
   */
  async processEmailQueue(processor) {
    try {
      if (!this.isInitialized) {
        console.warn('Queue manager not initialized');
        return;
      }

      const redisConfig = {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
      };

      this.workers.email = new Worker('email-notifications', processor, {
        connection: redisConfig,
        concurrency: 5,
      });

      console.log('Email queue processor started');
    } catch (error) {
      console.error('Error processing email queue:', error);
    }
  }

  /**
   * Process audit queue
   */
  async processAuditQueue(processor) {
    try {
      if (!this.isInitialized) {
        console.warn('Queue manager not initialized');
        return;
      }

      const redisConfig = {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
      };

      this.workers.audit = new Worker('audit-logs', processor, {
        connection: redisConfig,
        concurrency: 10,
      });

      console.log('Audit queue processor started');
    } catch (error) {
      console.error('Error processing audit queue:', error);
    }
  }

  /**
   * Process analytics queue
   */
  async processAnalyticsQueue(processor) {
    try {
      if (!this.isInitialized) {
        console.warn('Queue manager not initialized');
        return;
      }

      const redisConfig = {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
      };

      this.workers.analytics = new Worker('analytics-processing', processor, {
        connection: redisConfig,
        concurrency: 3,
      });

      console.log('Analytics queue processor started');
    } catch (error) {
      console.error('Error processing analytics queue:', error);
    }
  }

  /**
   * Process notifications queue
   */
  async processNotificationsQueue(processor) {
    try {
      if (!this.isInitialized) {
        console.warn('Queue manager not initialized');
        return;
      }

      const redisConfig = {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
      };

      this.workers.notifications = new Worker('user-notifications', processor, {
        connection: redisConfig,
        concurrency: 5,
      });

      console.log('Notifications queue processor started');
    } catch (error) {
      console.error('Error processing notifications queue:', error);
    }
  }

  /**
   * Process IoT queue
   */
  async processIoTQueue(processor) {
    try {
      if (!this.isInitialized) {
        console.warn('Queue manager not initialized');
        return;
      }

      const redisConfig = {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
      };

      this.workers.iot = new Worker('iot-ingestion', processor, {
        connection: redisConfig,
        concurrency: 10,
      });

      console.log('IoT queue processor started');
    } catch (error) {
      console.error('Error processing IoT queue:', error);
    }
  }

  /**
   * Process reports queue
   */
  async processReportsQueue(processor) {
    try {
      if (!this.isInitialized) {
        console.warn('Queue manager not initialized');
        return;
      }

      const redisConfig = {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
      };

      this.workers.reports = new Worker('report-generation', processor, {
        connection: redisConfig,
        concurrency: 2,
      });

      console.log('Reports queue processor started');
    } catch (error) {
      console.error('Error processing reports queue:', error);
    }
  }

  /**
   * Get queue status
   */
  async getQueueStatus(queueName) {
    try {
      if (!this.isInitialized || !this.queues[queueName]) {
        return null;
      }

      const queue = this.queues[queueName];
      const counts = await queue.getJobCounts();

      return {
        name: queueName,
        ...counts,
      };
    } catch (error) {
      console.error('Error getting queue status:', error);
      return null;
    }
  }

  /**
   * Get all queues status
   */
  async getAllQueuesStatus() {
    try {
      if (!this.isInitialized) {
        return null;
      }

      const status = {};
      for (const [name] of Object.entries(this.queues)) {
        status[name] = await this.getQueueStatus(name);
      }

      return status;
    } catch (error) {
      console.error('Error getting all queues status:', error);
      return null;
    }
  }

  /**
   * Close all queues and workers
   */
  async close() {
    try {
      // Close all workers
      for (const [name, worker] of Object.entries(this.workers)) {
        await worker.close();
        console.log(`Worker ${name} closed`);
      }

      // Close all queues
      for (const [name, queue] of Object.entries(this.queues)) {
        await queue.close();
        console.log(`Queue ${name} closed`);
      }

      this.isInitialized = false;
      console.log('Queue manager closed');
    } catch (error) {
      console.error('Error closing queue manager:', error);
    }
  }

  /**
   * Get manager status
   */
  getStatus() {
    return {
      initialized: this.isInitialized,
      queues: Object.keys(this.queues),
      workers: Object.keys(this.workers),
    };
  }
}

// Export singleton instance
module.exports = new QueueManager();
