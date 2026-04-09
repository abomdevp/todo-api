import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, TaskStatus as PrismaTaskStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { QueryTasksDto } from './dto/query-tasks.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TaskStatus } from './enums/task-status.enum';

@Injectable()
export class TasksService {
  private readonly cacheTtl = Number(process.env.REDIS_TTL || 60);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  private getCacheKey(userId: string, status?: string) {
    return `tasks:user:${userId}:status:${status || 'ALL'}`;
  }

  private async invalidateUserTaskCache(userId: string) {
    const keys = [
      this.getCacheKey(userId, 'ALL'),
      this.getCacheKey(userId, TaskStatus.PENDING),
      this.getCacheKey(userId, TaskStatus.IN_PROGRESS),
      this.getCacheKey(userId, TaskStatus.DONE),
    ];

    await Promise.all(keys.map((key) => this.redis.del(key)));
  }

  async create(userId: string, dto: CreateTaskDto) {
    const task = await this.prisma.task.create({
      data: {
        title: dto.title,
        description: dto.description,
        status: (dto.status as PrismaTaskStatus) || PrismaTaskStatus.PENDING,
        userId,
      },
    });

    await this.invalidateUserTaskCache(userId);

    return task;
  }

  async findAll(userId: string, query: QueryTasksDto) {
    const cacheKey = this.getCacheKey(userId, query.status);

    const cached = await this.redis.get(cacheKey);

    if (cached) {
      return {
        source: 'cache',
        data: JSON.parse(cached),
      };
    }

    const where: Prisma.TaskWhereInput = {
      userId,
      ...(query.status ? { status: query.status as PrismaTaskStatus } : {}),
    };

    const tasks = await this.prisma.task.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
    });

    await this.redis.set(cacheKey, JSON.stringify(tasks), this.cacheTtl);

    return {
      source: 'database',
      data: tasks,
    };
  }

  async update(userId: string, taskId: string, dto: UpdateTaskDto) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    if (task.userId !== userId) {
      throw new ForbiddenException('You do not have access to this task');
    }

    const updatedTask = await this.prisma.task.update({
      where: { id: taskId },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.status !== undefined && {
          status: dto.status as PrismaTaskStatus,
        }),
      },
    });

    await this.invalidateUserTaskCache(userId);

    return updatedTask;
  }

  async remove(userId: string, taskId: string) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    if (task.userId !== userId) {
      throw new ForbiddenException('You do not have access to this task');
    }

    await this.prisma.task.delete({
      where: { id: taskId },
    });

    await this.invalidateUserTaskCache(userId);

    return {
      message: 'Task deleted successfully',
    };
  }
}