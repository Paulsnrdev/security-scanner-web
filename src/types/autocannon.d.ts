// autocannon ships no types and DefinitelyTyped's @types/autocannon lags
// behind the v8 we installed, so this covers only the surface this project
// actually uses. Field names verified by reading
// node_modules/autocannon/lib/aggregateResult.js and histUtil.js directly
// rather than guessing.
declare module "autocannon" {
  export interface Options {
    url: string;
    connections?: number;
    duration?: number;
    timeout?: number;
    bailout?: number;
    servername?: string;
    headers?: Record<string, string>;
    method?: string;
  }

  export interface PercentileStats {
    average: number;
    mean: number;
    stddev: number;
    min: number;
    max: number;
    p50: number;
    p75: number;
    p90: number;
    p97_5: number;
    p99: number;
    p99_9: number;
    p99_99: number;
    p99_999: number;
    total?: number;
    sent?: number;
    totalCount?: number;
  }

  export interface Result {
    duration: number;
    start: string;
    finish: string;
    errors: number;
    timeouts: number;
    non2xx: number;
    "1xx": number;
    "2xx": number;
    "3xx": number;
    "4xx": number;
    "5xx": number;
    latency: PercentileStats;
    requests: PercentileStats;
    throughput: PercentileStats;
  }

  export interface Instance extends PromiseLike<Result> {
    stop(): void;
  }

  function autocannon(opts: Options): Instance;
  export default autocannon;
}
