import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto, UpdateReviewDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../common/decorators/get-user.decorator';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(
    @GetUser('id') userId: string,
    @Body() createReviewDto: CreateReviewDto,
  ) {
    return this.reviewsService.create(userId, createReviewDto);
  }

  @Get()
  findAll() {
    return this.reviewsService.findAll();
  }

  @Get('resource/:resourceId')
  findByResource(@Param('resourceId') resourceId: string) {
    return this.reviewsService.findByResource(resourceId);
  }

  @Get('user/resource/:resourceId')
  @UseGuards(JwtAuthGuard)
  findUserReview(
    @GetUser('id') userId: string,
    @Param('resourceId') resourceId: string,
  ) {
    return this.reviewsService.findUserReviewForResource(userId, resourceId);
  }

  @Patch('resource/:resourceId')
  @UseGuards(JwtAuthGuard)
  update(
    @GetUser('id') userId: string,
    @Param('resourceId') resourceId: string,
    @Body() updateReviewDto: UpdateReviewDto,
  ) {
    return this.reviewsService.update(userId, resourceId, updateReviewDto);
  }

  @Delete('resource/:resourceId')
  @UseGuards(JwtAuthGuard)
  remove(
    @GetUser('id') userId: string,
    @Param('resourceId') resourceId: string,
  ) {
    return this.reviewsService.remove(userId, resourceId);
  }
}
