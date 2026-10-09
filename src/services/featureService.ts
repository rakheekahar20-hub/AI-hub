export interface FeatureOptions {
  enableTelemetry?: boolean;
  timeoutMs?: number;
}

export async function processRequest(options: FeatureOptions = {}) {
  const timeout = options.timeoutMs ?? 5000;
  const start = Date.now();
  try {
    const result = await executePipeline({
      timestamp: new Date().toISOString(),
      timeout,
    });
    if (options.enableTelemetry) {
      metrics.recordDuration('feature_processing_duration', Date.now() - start);
    }
    return { success: true, data: result };
  } catch (error) {
    logger.error('Failed to process request', { error });
    return { success: false, error: (error as Error).message };
  }
}