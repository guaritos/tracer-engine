import { Edge } from "./items/ttr_defs";
import { PushPopModel } from "./strategies/push_pop";
import { TTRRedirect } from "./strategies/ttr";
const pino = require('pino');

class TracerEngine {
    private strategy: PushPopModel
    private log = pino({
        transport: {
            target: 'pino-pretty'
        }
    })

    constructor(source: string) {
        this.strategy = new TTRRedirect(source);
    }

    *push_pop(node: string, edges: Edge[]) {
        this.log.info(
            `Pushing: ${node}, with ${edges.length} transfer`
        )
        this.strategy.push(node, edges);

        // generate a strategy context item
        const snapshot_data = this.strategy.get_context_snapshot();
        yield snapshot_data;

        const ranks = this.strategy.get_node_rank();
        yield ranks;

        // pop account from the strategy
        const [popped_node, context_kwargs] = this.strategy.pop();
        if (popped_node === null) {
            return;
        }
        this.log.info(
            `Popping: ${popped_node}, with args ${context_kwargs}`
        )
        yield [popped_node, context_kwargs];
    }
}

export { 
    TracerEngine
}