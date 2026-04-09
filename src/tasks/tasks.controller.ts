import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CreateTaskDto } from './dto/create-task.dto';
import { QueryTasksDto } from './dto/query-tasks.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TasksService } from './tasks.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('Tasks')        // 👈 grupo en Swagger
@ApiBearerAuth()         // 👈 ESTO habilita Authorization header en Swagger
@UseGuards(JwtAuthGuard)
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  create(
    @CurrentUser() user: { userId: string; email: string },
    @Body() dto: CreateTaskDto,
  ) {
    return this.tasksService.create(user.userId, dto);
  }

  @Get()
  findAll(
    @CurrentUser() user: { userId: string; email: string },
    @Query() query: QueryTasksDto,
  ) {
    return this.tasksService.findAll(user.userId, query);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: { userId: string; email: string },
    @Param('id') id: string,
    @Body() dto: UpdateTaskDto,
  ) {
    return this.tasksService.update(user.userId, id, dto);
  }

  @Delete(':id')
  remove(
    @CurrentUser() user: { userId: string; email: string },
    @Param('id') id: string,
  ) {
    return this.tasksService.remove(user.userId, id);
  }
}