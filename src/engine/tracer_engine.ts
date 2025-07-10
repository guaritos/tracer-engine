import { PopItem, RankItem, StrategySnapshotItem } from "./items/subgraph";
import { Edge } from "./items/ttr_defs";
import { PushPopModel } from "./strategies/push_pop";
import { TTRRedirect } from "./strategies/ttr";
const pino = require('pino');

class TracerEngine {
    private class_name: string = "TracerEngine";
    private strategy: PushPopModel;
    private log = pino({
        transport: {
            target: 'pino-pretty'
        }
    })
    private enable_log = false;

    constructor(source: string, enable_log?: boolean) {
        this.strategy = new TTRRedirect(source);
        if (enable_log) this.enable_log = enable_log;
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
}

export { 
    TracerEngine
}