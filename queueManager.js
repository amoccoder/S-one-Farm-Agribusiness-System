/**
 * Message Queue Manager using Bull
 * Handles asynchronous task processing
 */

const Queue = require('bull');

class QueueManager {
  constructor() {
    this.queues = {};
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
      this.queues.email = new Queue('email-notifications', redisConfig);
      this.queues.audit = new Queue('audit-logs', redisConfig);
      this.queues.analytics = new Queue('analytics-processing', redisConfig);
      this.queues.notifications = new Queue('user-notifications', redisConfig);

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
    });
  }

  /**
   * Add email notification job
   * @param {object} data - Email data
   * @param {object} options - Job options
   */
  async addEmailJob(data, options = {}) {
    try {
      if (!this.isInitialized) {
        console.warn('Queue manager not initialized');
        return null;
      }

      const job = await this.queues.email.add(data, {
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
   * @param {object} data - Audit log data
   * @param {object} options - Job options
   */
  async addAuditJob(data, options = {}) {
    try {
      if (!this.isInitialized) {
        console.warn('Queue manager not initialized');
        return null;
      }

      const job = await this.queues.audit.add(data, {
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
   * @param {object} data - Analytics data
   * @param {object} options - Job options
   */
  async addAnalyticsJob(data, options = {}) {
    try {
      if (!this.isInitialized) {
        console.warn('Queue manager not initialized');
        return null;
      }

      const job = await this.queues.analytics.add(data, {
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
   * @param {object} data - Notification data
   * @param {object} options - Job options
   */
  async addNotificationJob(data, options = {}) {
    try {
      if (!this.isInitialized) {
        console.warn('Queue manager not initialized');
        return null;
      }

      const job = await this.queues.notifications.add(data, {
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
   * Process email queue
   * @param {function} processor - Job processor function
   */
  async processEmailQueue(processor) {
    try {
      if (!this.isInitialized) {
        console.warn('Queue manager not initialized');
        return;
      }

      await this.queues.email.process(processor);
      console.log('Email queue processor started');
    } catch (error) {
      console.error('Error processing email queue:', error);
    }
  }

  /**
   * Process audit queue
   * @param {function} processor - Job processor function
   */
  async processAuditQueue(processor) {
    try {
      if (!this.isInitialized) {
        console.warn('Queue manager not initialized');
        return;
      }

      await this.queues.audit.process(processor);
      console.log('Audit queue processor started');
    } catch (error) {
      console.error('Error processing audit queue:', error);
    }
  }

  /**
   * Process analytics queue
   * @param {function} processor - Job processor function
   */
  async processAnalyticsQueue(processor) {
    try {
      if (!this.isInitialized) {
        console.warn('Queue manager not initialized');
        return;
      }

      await this.queues.analytics.process(processor);
      console.log('Analytics queue processor started');
    } catch (error) {
      console.error('Error processing analytics queue:', error);
    }
  }

  /**
   * Process notifications queue
   * @param {function} processor - Job processor function
   */
  async processNotificationsQueue(processor) {
    try {
      if (!this.isInitialized) {
        console.warn('Queue manager not initialized');
        return;
      }

      await this.queues.notifications.process(processor);
      console.log('Notifications queue processor started');
    } catch (error) {
      console.error('Error processing notifications queue:', error);
    }
  }

  /**
   * Get queue status
   * @param {string} queueName - Queue name
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
   * Clear a queue
   * @param {string} queueName - Queue name
   */
  async clearQueue(queueName) {
    try {
      if (!this.isInitialized || !this.queues[queueName]) {
        return false;
      }

      await this.queues[queueName].empty();
      console.log(`Queue ${queueName} cleared`);
      return true;
    } catch (error) {
      console.error('Error clearing queue:', error);
      return false;
    }
  }

  /**
   * Close all queues
   */
  async close() {
    try {
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
    };
  }
}

// Export singleton instance
module.exports = new QueueManager();
