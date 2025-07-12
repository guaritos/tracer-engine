import { AccountTransferItem, PopItem, RankItem, StrategySnapshotItem } from "./items/subgraph";
import { Edge } from "./items/ttr_defs";
import { PushPopModel } from "./strategies/push_pop";
import { TTRRedirect } from "./strategies/ttr";
const pino = require('pino');

export interface TraceOptions {
    enable_log: boolean,
    max_depth: number,
    token_filters: string[],
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
        if (this.enable_log) { 
            this.log.info(
                `[${this.class_name}] Pushing: ${node}, with ${edges.length} transfer`
            )
        }
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
        if (this.enable_log) {
            this.log.info(
                `[${this.class_name}] Popping: ${popped_node}, with args {residual: ${context_kwargs.residual}, allow_all_token: ${context_kwargs.allow_all_tokens}}`
            )
        }
        let pop_item = new PopItem(popped_node);
        pop_item.set_context_kwargs(context_kwargs);
        yield pop_item;
    }
    
    startTrace(
        get_edges: (node: string) => Edge[],
        trace_options?: TraceOptions,
    ): TraceResult {
        const enable_log = (trace_options) ? trace_options.enable_log : true;
        let depth = 0;

        let result: TraceResult = new TraceResult();
        
        const edges = get_edges(this.strategy.source);
        let data = this.push_pop(this.strategy.source, edges);

        let curr = data.next();

        while (!curr.done) {
            if (trace_options && depth > trace_options.max_depth) {
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
                data = this.push_pop(node, get_edges(node));                
                curr = data.next();
            }
            depth++;
        }
        return result;
    }
}

export { 
    TracerEngine
}