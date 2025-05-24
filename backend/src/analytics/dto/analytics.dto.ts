export interface DailyStoreVisitDto {
  date: string;
  dayName: string;
  visits: number;
}

export interface DailySaleDto {
  date: string;
  time: string;
  amount: number;
  productName?: string;
}

export interface TaskStatusDistributionDto {
  status: string;
  count: number;
  percentage: number;
}

export interface DashboardAnalyticsDto {
  dailyVisits: DailyStoreVisitDto[];
  dailySales: DailySaleDto[];
  tasksDistribution: TaskStatusDistributionDto[];
} 