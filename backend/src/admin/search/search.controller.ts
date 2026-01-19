import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { SearchService } from './search.service';
import { AdminAuthGuard } from '../auth/admin-auth.guard';
import { AdminAction } from '../common/decorators/admin-action.decorator';

@Controller('admin/search')
@UseGuards(AdminAuthGuard)
export class SearchController {
  constructor(private searchService: SearchService) {}

  @Get()
  @AdminAction({ action: 'GLOBAL_SEARCH', category: 'SEARCH' })
  async globalSearch(
    @Query('q') query: string,
    @Query('limit') limit?: string,
    @Query('types') types?: string,
  ): Promise<{
    statusCode: number;
    message: string;
    data: any[];
  }> {
    const searchTypes = types
      ? (types.split(',') as ('user' | 'company' | 'trade' | 'product')[])
      : undefined;

    const results = await this.searchService.globalSearch(
      query,
      limit ? parseInt(limit, 10) : 10,
      searchTypes,
    );

    return {
      statusCode: 200,
      message: 'Search completed',
      data: results,
    };
  }

  @Get('suggestions')
  async getSearchSuggestions(
    @Query('q') query: string,
    @Query('limit') limit?: string,
  ): Promise<{
    statusCode: number;
    message: string;
    data: string[];
  }> {
    const suggestions = await this.searchService.getSearchSuggestions(
      query,
      limit ? parseInt(limit, 10) : 5,
    );

    return {
      statusCode: 200,
      message: 'Suggestions retrieved',
      data: suggestions,
    };
  }
}
