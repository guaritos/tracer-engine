import { PopItem, RankItem, StrategySnapshotItem } from "./items/subgraph";
import { Edge } from "./items/ttr_defs";
import { PushPopModel } from "./strategies/push_pop";
import { TTRRedirect } from "./strategies/ttr";
const pino = require('pino');

export interface TraceOptions {
    max_depth?: number,
    filters?: TraceFilters,
}

interface TraceFilters {
    token_filters?: string[],
}

export class TraceResult {
    strategy_snap_shot_items: Record<string, any> = {};
    rank_items: Map<string, number> = new Map();
}

class TracerEngine {
    private class_name: string = "TracerEngine";
    private strategy: PushPopModel;
    private log = pino({
        transport: {
            target: 'pino-pretty'
        }
    })
    private enable_log = false;

    constructor(
        source: string,
        options?: {
            enable_log?: boolean,
        }
    ) {
        this.strategy = new TTRRedirect(source);
        if (options && options.enable_log) this.enable_log = options.enable_log;
    }

    *push_pop(node: string, edges: Edge[]) {
        this.enable_log && this.log.info(
            `[${this.class_name}] Pushing: ${node}, with ${edges.length} transfer`
        );
        this.strategy.push(node, edges);

        // generate a strategy context item
        const snapshot_data = this.strategy.get_context_snapshot();
        yield new StrategySnapshotItem(snapshot_data);

        const ranks = this.strategy.get_node_rank();
        yield new RankItem(ranks);

        // pop account from the strategy
        const [popped_node, context_kwargs] = this.strategy.pop();
        
        if (popped_node === null) {            
            return;
        }
        this.enable_log && this.log.info(
            `[${this.class_name}] Popping: ${popped_node}, with args {residual: ${context_kwargs.residual}, allow_all_token: ${context_kwargs.allow_all_tokens}}`
        );
        
        let pop_item = new PopItem(popped_node);
        pop_item.set_context_kwargs(context_kwargs);
        yield pop_item;
    }
    
    async startTrace(
        get_edges: (
            node: string, 
            filter?: TraceFilters,
        ) => Promise<Edge[]>,
        trace_options?: TraceOptions,
    ): Promise<TraceResult> {
        let result: TraceResult = new TraceResult();
        let depth = 0;
        
        const edges = await get_edges(this.strategy.source, trace_options?.filters);
        
        const start_time = Date.now();
        let data = this.push_pop(this.strategy.source, edges);
        let curr = data.next();
        
        while (!curr.done) {
            if (trace_options && trace_options.max_depth && depth > trace_options.max_depth) {
                break;
            }

            // StrategySnapshotItem
            result.strategy_snap_shot_items = (curr.value as StrategySnapshotItem).data;
            
            // RankItem
            curr = data.next();
            result.rank_items = (curr.value as RankItem).data;

            // PopItem or empty return;
            curr = data.next();
            if (curr.done) {
                break;
            }
            else if (curr.value instanceof PopItem) {
                const node = curr.value.node;
                if (!node) break;
                data = this.push_pop(node, await get_edges(node, trace_options?.filters));                
                curr = data.next();
            }
            depth++;
        }
        const end_time = Date.now();
        const time_elapsed = end_time - start_time;
        this.enable_log && this.log.info(
            `${this.class_name} Finish tracing after ${new Date(time_elapsed).toISOString().slice(11, 19)}`
        );
        return result;
    }
}

export { 
    TracerEngine
}