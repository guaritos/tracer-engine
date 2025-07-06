import { TracerEngine } from './engine/tracer_engine';

export function initTracer(source: string): TracerEngine {
  return new TracerEngine(source);
}


