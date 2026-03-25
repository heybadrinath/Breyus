import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { BlogUser } from '../schemas/blog-user.schema';
import { BlogPost } from '../../blog/schemas/blog-post.schema';

/**
 * BlogPortalWritersService handles public writer profile operations
 */
@Injectable()
export class BlogPortalWritersService {
  constructor(
    @InjectModel(BlogUser.name) private readonly blogUserModel: Model<BlogUser>,
    @InjectModel(BlogPost.name) private readonly blogPostModel: Model<BlogPost>,
  ) {}

  /**
   * Get public writer profile
   */
  async getWriterProfile(writerId: string) {
    const writer = await this.blogUserModel
      .findOne({
        _id: new Types.ObjectId(writerId),
        isWriter: true,
      })
      .select(
        'firstName lastName companyName isBrèyusMember isWriter writerBio writerAvatar writerBanner',
      )
      .lean();

    if (!writer) {
      throw new HttpException('Writer not found', HttpStatus.NOT_FOUND);
    }

    return writer;
  }

  /**
   * Get all active writers with stats (post counts, total views, latest post)
   */
  async getAllWriters(
    page: number = 1,
    limit: number = 20,
    search?: string,
  ) {
    const skip = (page - 1) * limit;

    // Build match filter
    const matchFilter: any = {
      isWriter: true,
      isSuspended: { $ne: true },
      isDeleted: { $ne: true },
    };

    if (search) {
      matchFilter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { companyName: { $regex: search, $options: 'i' } },
      ];
    }

    const pipeline: any[] = [
      { $match: matchFilter },
      // Lookup published posts for stats
      {
        $lookup: {
          from: 'blog_posts',
          let: { writerId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$writerId', '$$writerId'] },
                status: 'published',
                isDeleted: { $ne: true },
              },
            },
            { $sort: { publishedAt: -1 } },
            {
              $project: {
                title: 1,
                slug: 1,
                viewCount: 1,
                likeCount: 1,
                publishedAt: 1,
              },
            },
          ],
          as: 'publishedPosts',
        },
      },
      // Add computed fields
      {
        $addFields: {
          stats: {
            totalPosts: { $size: '$publishedPosts' },
            totalViews: { $sum: '$publishedPosts.viewCount' },
          },
          latestPost: {
            $cond: {
              if: { $gt: [{ $size: '$publishedPosts' }, 0] },
              then: { $arrayElemAt: ['$publishedPosts', 0] },
              else: null,
            },
          },
        },
      },
      // Project only public fields
      {
        $project: {
          firstName: 1,
          lastName: 1,
          companyName: 1,
          writerBio: 1,
          writerAvatar: 1,
          writerBanner: 1,
          isBrèyusMember: 1,
          stats: 1,
          latestPost: {
            $cond: {
              if: { $ne: ['$latestPost', null] },
              then: {
                title: '$latestPost.title',
                slug: '$latestPost.slug',
              },
              else: null,
            },
          },
        },
      },
      // Sort by post count desc (most prolific first)
      { $sort: { 'stats.totalPosts': -1, firstName: 1 } },
    ];

    // Get total count
    const countPipeline = [
      { $match: matchFilter },
      { $count: 'total' },
    ];

    const [writers, countResult] = await Promise.all([
      this.blogUserModel.aggregate([
        ...pipeline,
        { $skip: skip },
        { $limit: limit },
      ]),
      this.blogUserModel.aggregate(countPipeline),
    ]);

    const total = countResult[0]?.total || 0;

    return {
      writers,
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  }

  /**
   * Get writer's published posts
   */
  async getWriterPosts(writerId: string, page: number = 1, limit: number = 10) {
    // Verify writer exists
    const writer = await this.blogUserModel.findOne({
      _id: new Types.ObjectId(writerId),
      isWriter: true,
    });

    if (!writer) {
      throw new HttpException('Writer not found', HttpStatus.NOT_FOUND);
    }

    const skip = (page - 1) * limit;

    const [posts, total] = await Promise.all([
      this.blogPostModel
        .find({
          writerId: new Types.ObjectId(writerId),
          status: 'published',
          isDeleted: false,
        })
        .select('-tiptapContent -isDeleted -deletedAt')
        .sort({ publishedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.blogPostModel.countDocuments({
        writerId: new Types.ObjectId(writerId),
        status: 'published',
        isDeleted: false,
      }),
    ]);

    return {
      posts,
      total,
      pages: Math.ceil(total / limit),
    };
  }
}
