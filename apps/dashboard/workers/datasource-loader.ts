import Redis from 'ioredis';

import { WorkerPro } from '@chaindesk/lib/bullmq-pro';
import logger from '@chaindesk/lib/logger';
import taskLoadDatasource from '@chaindesk/lib/task-load-datasource';
import { TaskQueue } from '@chaindesk/lib/types';
import { TaskLoadDatasourceRequestSchema } from '@chaindesk/lib/types/dtos';
import { DatasourceStatus } from '@chaindesk/prisma';
import { prisma } from '@chaindesk/prisma/client';

const connection = new Redis(process.env.REDIS_URL!);

connection.on('connect', async () => {
  try {
    await connection.config('SET', 'maxmemory-policy', 'noeviction');
    logger.info('Redis configured successfully');
  } catch (error) {
    logger.warn('Could not set Redis eviction policy:', error);
  }
});

connection.on('error', (error) => {
  logger.error('Redis connection error:', error);
});

const worker = new WorkerPro(
  TaskQueue.load_datasource,
  async (job) => {
    const { datasourceId } = job.data;
    logger.info(`Processing job ${job.id} for datasource ${datasourceId}`);

    try {
      await prisma.appDatasource.update({
        where: { id: datasourceId },
        data: { status: DatasourceStatus.running }
      });

      logger.info(`Starting task load for datasource ${datasourceId}`);
      await taskLoadDatasource(job.data);

      await prisma.appDatasource.update({
        where: { id: datasourceId },
        data: { status: DatasourceStatus.synched }
      });

      logger.info(`Completed task load for datasource ${datasourceId}`);
    } catch (error) {
      logger.error(`Error processing datasource ${datasourceId}:`, error);

      await prisma.appDatasource.update({
        where: { id: datasourceId },
        data: { status: DatasourceStatus.error }
      });

      throw error;
    }
  },
  {
    connection: connection as any,
    concurrency: 5,
    removeOnComplete: { count: 1000 },
    removeOnFail: { count: 5000 },
    lockDuration: 180000
  }
);

worker.on('completed', (job) => {
  logger.info(`Job ${job.id} completed for datasource ${job.data?.datasourceId}`);
});

worker.on('failed', (job, error) => {
  logger.error(`Job ${job?.id} failed for datasource ${job?.data?.datasourceId}:`, error);
});

process.on('SIGTERM', async () => {
  logger.info('Shutting down worker...');
  await worker.close();
  await connection.quit();
  await prisma.$disconnect();
});

export default worker;