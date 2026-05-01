export type SummaryBucketRow = {
  key: string;
  count: number;
};

export type SummaryHistogramBin = {
  date: string;
  count: number;
};

export type LogsSummaryPayload = {
  total: number;
  with_exception_count: number;
  period: {
    from: string;
    to: string;
    histogram_days: number;
  };
  by_level: SummaryBucketRow[];
  by_channel: SummaryBucketRow[];
  by_source: SummaryBucketRow[];
  by_environment: SummaryBucketRow[];
  histogram: SummaryHistogramBin[];
};

export type LogsSummaryApiResponse = {
  data: LogsSummaryPayload;
};
