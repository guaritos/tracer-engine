import { Edge, Profit, AggregatedEdge, AggregatedEdgeProfit } from "../items/ttr_defs";
import { PushPopModel } from './push_pop';

class TTR extends PushPopModel {
    alpha: number;
    beta: number;
    epsilon: number;
    p: Record<string, number>;
    r: Map<string, Profit[]>;
    constructor(
        source: string,
        alpha: number = 0.15,
        beta: number = 0.7,
        epsilon: number = 1e-3,
    ) {
        super(source);
        this.alpha = alpha;
        this.beta = beta;
        this.epsilon = epsilon;
        this.p = {};
        this.r = new Map<string, Profit[]>();
    }

    push(node: any, edges: Edge[], ...kwargs: any[]): void {
        throw new Error("Method not implemented.");
    }

    pop(): [any, Record<string, any>] {
        throw new Error("Method not implemented.");
    }

    get_context_snapshot(): Record<string, any> {
        return {
            source: this.source,
            alpha: this.alpha,
            beta: this.beta,
            epsilon: this.epsilon,
            r: this.r,
            p: this.p,
        };
    }

    get_node_rank(): Record<string, number> {
        return this.p;
    }
}

class TTRRedirect extends TTR {
    _vis: Set<string>;
    constructor(
        source: string,
        alpha: number = 0.15,
        beta: number = 0.7,
        epsilon: number = 1e-3,
    ) {
        super(source, alpha, beta, epsilon);
        this._vis = new Set<string>();
    }

    push(node: string, edges: Edge[]): void {
        // if residual vector is none, add empty list
        if (this.r.get(node) === undefined) {
            this.r.set(node, []);
        }

        // push on first time
        if (node === this.source && !this._vis.has(this.source)) {
            this._vis.add(this.source);

            // calc value of each symbol
            const in_sum = new Map<string, number>();
            const out_sum = new Map<string, number>();
            const symbols = new Set<string>();
            for (const e of edges) {
                symbols.add(e.symbol);
                if (e.to === this.source) {
                    in_sum.set(e.symbol, (in_sum.get(e.symbol) || 0) + e.value);
                } else if (e.from === this.source) {
                    out_sum.set(e.symbol, (out_sum.get(e.symbol) || 0) + e.value);
                }
            }

            // first self push
            this.p[this.source] = this.alpha * symbols.size;

            // first forward and backward push
            for (const e of edges) {
                if (e.from === this.source && (out_sum.get(e.symbol) || 0) !== 0) {
                    if (!this.r.has(e.to)) {
                        this.r.set(e.to, []);
                    }
                    const value = (1 - this.alpha) * this.beta * e.value / out_sum.get(e.symbol)!;
                    if (value > 0) {
                        this.r.get(e.to)?.push({
                            value: value,
                            symbol: e.symbol,
                            timestamp: e.timestamp,
                        });
                    }
                } else if (e.to === this.source && (in_sum.get(e.symbol) || 0) !== 0) {
                    if (!this.r.has(e.from)) {
                        this.r.set(e.from, []);
                    }
                    const value = (1 - this.alpha) * (1 - this.beta) * e.value / in_sum.get(e.symbol)!;
                    if (value > 0) {
                        this.r.get(e.from)?.push({
                            value: value,
                            symbol: e.symbol,
                            timestamp: e.timestamp,
                        });
                    }
                }
            }

            for (const symbol of symbols) {
                if ((out_sum.get(symbol) || 0) === 0) {
                    this.r.get(this.source)?.push({
                        symbol: symbol,
                        value: (1 - this.alpha) * this.beta,
                        timestamp: 0,
                    });
                } else if ((in_sum.get(symbol) || 0) === 0) {
                    this.r.get(this.source)?.push({
                        symbol: symbol,
                        value: (1 - this.alpha) * (1 - this.beta),
                        timestamp: Number.MAX_SAFE_INTEGER,
                    });
                }
            }
            return;
        }

        // copy residual vector with sort and clear
        let r = this.r.get(node) || [];
        r = [...r].sort((a, b) => b.timestamp - a.timestamp);
        this.r.set(node, []);

        // aggregate edges
        const agg_es = this._get_aggregated_edges(node, edges);
        agg_es.sort((a, b) => b.get_timestamp() - a.get_timestamp());

        // push
        this._self_push(node, r);
        this._forward_push(node, agg_es, r);
        this._backward_push(node, agg_es, r);

        // merge chips
        for (const [node, chips] of this.r.entries()) {
            const _chips = new Map();
            for (const chip of chips) {
                const key = (chip.symbol, chip.timestamp);
                if (!_chips.has(key)) {
                    _chips.set(key, chip);
                    continue;
                }
                _chips.get(key)['value'] += chip.value;
            }
            this.r.set(node, Array.from(_chips.values()));
        }
    }

    _self_push(node: string, r: Profit[]): void {
        let sum_r = 0;
        for (const chip of r) {
            sum_r += chip.value;
        }
        this.p[node] = (this.p[node] || 0) + this.alpha * sum_r;
    }

    _forward_push(node: string, aggregated_edges: AggregatedEdge[], r: Profit[]): void {
        if (r.length === 0) {
            return;
        }

        // calc the weight sum after each chip
        let j = aggregated_edges.length - 1;
        let sum_w = new Map<string, number>();
        let W = new Map<string, number>();
        for (let i = r.length - 1; i >= 0; i--) {
            const c = r[i];
            while (j >= 0 && aggregated_edges[j].get_timestamp() > c.timestamp) {
                const e = aggregated_edges[j];
                const profits = e.get_output_profits();
                for (const profit of profits) {
                    sum_w.set(profit.symbol, (sum_w.get(profit.symbol) || 0) + profit.value);
                }
                j -= 1;
            }
            W.set(String(c), sum_w.get(c.symbol) || 0);
        }

        // construct index for distributing profit
        const symbol_agg_es = new Map<string, AggregatedEdge[]>();
        const symbol_agg_es_idx = new Map<string, number[]>();
        for (let i = 0; i < aggregated_edges.length; i++) {
            const e = aggregated_edges[i];
            for (const profit of e.get_output_profits()) {
                if (!symbol_agg_es.has(profit.symbol)) {
                    symbol_agg_es.set(profit.symbol, []);
                    symbol_agg_es_idx.set(profit.symbol, []);
                }
                symbol_agg_es.get(profit.symbol)!.push(e);
                symbol_agg_es_idx.get(profit.symbol)!.push(i);
            }
        }
        const distributing_index = new Map<string, number[]>();
        for (const symbol of symbol_agg_es.keys()) {
            const es_idx = symbol_agg_es_idx.get(symbol)!;
            const index = Array.from({ length: aggregated_edges.length }, () => 0);
            let j = 0;
            for (let i = 0; i < index.length; i++) {
                if (j < es_idx.length && es_idx[j] <= i) {
                    j += 1;
                }
                index[i] = j;
            }
            distributing_index.set(symbol, index);
        }

        // push residual to neighbors
        j = 0;
        const d = new Map<string, number>();
        for (let i = 0; i < aggregated_edges.length; i++) {
            const e = aggregated_edges[i];
            const output_profits = e.get_output_profits();
            if (output_profits.length === 0) {
                continue;
            }

            while (j < r.length && e.get_timestamp() > r[j].timestamp) {
                const c = r[j];
                const symbol = c.symbol;
                const inc_d = (c.value / W.get(String(c))!) || 0;
                d.set(symbol, (d.get(symbol) || 0) + inc_d);
                j += 1;
            }

            for (const profit of output_profits) {
                const inc = (1 - this.alpha) * this.beta * profit.value * (d.get(profit.symbol) || 0);
                if (inc === 0) {
                    continue;
                }

                const distributing_profits = this._get_distributing_profit(
                    1,
                    profit.symbol,
                    i,
                    aggregated_edges,
                    distributing_index,
                    symbol_agg_es_idx,
                    inc
                )
                for (const dp of distributing_profits) {
                    if (this.r.get(dp.address) === undefined) {
                        this.r.set(dp.address, []);
                    }
                    this.r.get(dp.address)!.push({
                        value: inc / distributing_profits.length,
                        symbol: dp.symbol,
                        timestamp: dp.timestamp,
                    });
                }
            }
        }

        // recycle the residual without push
        const cs = new Map<string, Profit>();
        while (j < r.length) {
            const c = r[j];
            const key = `${c.symbol},${c.timestamp}`;
            cs.set(key, {
                value: (cs.get(key)?.value || 0) + (1 - this.alpha) * this.beta * (c.value || 0),
                symbol: c.symbol,
                timestamp: c.timestamp,
            });
            j += 1;
        }
        for (const [key, value] of cs.entries()) {
            this.r.get(node)!.push({
                value: value.value,
                symbol: value.symbol,
                timestamp: value.timestamp,
            });
        }
    }

    _backward_push(node: string, aggregated_edges: AggregatedEdge[], r: Profit[]): void {
        if (r.length === 0) {
            return;
        }

        // calc the weight sum before each chip
        let j = 0;
        const sum_w = new Map<string, number>();
        const W = new Map<number, number>();
        for (let i = 0; i < r.length; i++) {
            const c = r[i];
            while (j < aggregated_edges.length && aggregated_edges[j].get_timestamp() < c.timestamp) {
                const e = aggregated_edges[j];
                const profits = e.get_input_profits();
                for (const profit of profits) {
                    sum_w.set(profit.symbol, (sum_w.get(profit.symbol) || 0) + profit.value);
                }
                j += 1;
            }
            W.set(i, sum_w.get(c.symbol) || 0);
        }

        // construct index for distributing profit
        const symbol_agg_es = new Map<string, AggregatedEdge[]>();
        const symbol_agg_es_idx = new Map<string, number[]>();
        for (let i = 0; i < aggregated_edges.length; i++) {
            const e = aggregated_edges[i];
            for (const profit of e.get_output_profits()) {
                if (!symbol_agg_es.has(profit.symbol)) {
                    symbol_agg_es.set(profit.symbol, []);
                    symbol_agg_es_idx.set(profit.symbol, []);
                }
                symbol_agg_es.get(profit.symbol)!.push(e);
                symbol_agg_es_idx.get(profit.symbol)!.push(i);
            }
        }
        const distributing_index = new Map<string, number[]>();
        for (const symbol of symbol_agg_es.keys()) {
            const es_idx = symbol_agg_es_idx.get(symbol)!;
            const index = Array.from({ length: aggregated_edges.length }, () => 0);
            let j = es_idx.length - 1;
            for (let i = index.length - 1; i >= 0; i--) {
                if (j > 0 && es_idx[j] >= i) {
                    j -= 1;
                }
                index[i] = j;
            }
            distributing_index.set(symbol, index);
        }

        // push residual to neighbors
        j = r.length - 1;
        const d = new Map<string, number>();
        for (let i = aggregated_edges.length - 1; i >= 0; i--) {
            const e = aggregated_edges[i];
            const input_profits = e.get_input_profits();
            if (input_profits.length === 0) {
                continue;
            }

            while (j >= 0 && e.get_timestamp() < r[j].timestamp) {
                const c = r[j];
                const symbol = c.symbol;
                const inc_d = W.get(j) !== 0 ? (c.value / W.get(j)!) : 0;
                d.set(symbol, (d.get(symbol) || 0) + inc_d);
                j -= 1;

                for (const profit of input_profits) {
                    const inc = (1 - this.alpha) * (1 - this.beta) * profit.value * (d.get(profit.symbol) || 0);
                    if (inc === 0) {
                        continue;
                    }

                    const distributing_profits = this._get_distributing_profit(
                        1,
                        profit.symbol,
                        i,
                        aggregated_edges,
                        distributing_index,
                        symbol_agg_es_idx,
                        inc
                    )
                    for (const dp of distributing_profits) {
                        if (this.r.get(dp.address) === undefined) {
                            this.r.set(dp.address, []);
                        }
                        this.r.get(dp.address)!.push({
                            value: inc / distributing_profits.length,
                            symbol: dp.symbol,
                            timestamp: dp.timestamp,
                        });
                    }
                }
            }
        }

        // recycle the residual without push
        const cs = new Map<{ symbol: string, timestamp: number }, number>();
        while (j >= 0) {
            const c = r[j];
            const key = { symbol: c.symbol, timestamp: c.timestamp };
            cs.set(key, (cs.get(key) || 0) + (1 - this.alpha) * (1 - this.beta) * (c.value || 0));
            j -= 1;
        }
        for (const [key, value] of cs.entries()) {
            this.r.get(node)!.push(new Profit(
                key.symbol,
                value,
                key.timestamp
            ));
        }        
    }

    pop(): [any, Record<string, any>] {
        let node: string | null = null;
        let r = this.epsilon;
        for (const [_node, chips] of this.r.entries()) {
            let sum_r = 0;
            for (const chip of chips) {
                sum_r += chip.value;
            }
            if (sum_r > r) {
                r = sum_r;
                node = _node;
            }
        }
        if (node === null) {
            return [null, {}];
        }
        return [node, {
            residual: r,
            allow_all_tokens: true,
        }]
    }

    get_context_snapshot(): Record<string, any> {
        let data = TTR.prototype.get_context_snapshot.call(this);
        const acc_r: Record<string, number> = {};
        for (const [_node, chips] of this.r.entries()) {
            acc_r[_node] = chips.reduce((sum, chip) => sum + chip.value, 0);
        }
        data.r = acc_r;
        return data;
    }

    _get_distributing_profit(
        direction: number,
        symbol: string,
        index: number,
        aggregated_edges: AggregatedEdge[],
        distributing_index: Map<string, number[]>,
        symbol_agg_es_idx: Map<string, number[]>,
        chip_value: number,
    ): AggregatedEdgeProfit[] {
        /**
         * Get distributing profit for a specific direction and symbol.
         * @param direction: 1 means input and -1 means output
         * @param symbol: the symbol of the chip
         * @param index: current aggregated edge index
         * @param aggregated_edges: aggregated edges
         * @param distributing_index: a dict to store distributing index
         * @param symbol_agg_es_idx: a dict to store symbol aggregated edges index
         * @param chip_value: the value of the chip
         * @return: a list of profit
         */
        let rlt: AggregatedEdgeProfit[] = [];

        let stack: any[] = [];
        stack.push({ direction, symbol, index });
        let vis = new Set();
        while (stack.length > 0) {
            const args = stack.pop();
            if (vis.has(args)) {
                continue;
            }
            vis.add(args);
            const { direction, symbol, index } = args;
            const cur_e = aggregated_edges[index];
            const no_reverse_profits = cur_e.profits.filter(profit => profit.value * direction > 0);
            const reverse_profits = cur_e.profits.filter(profit => profit.value * direction < 0);

            if (stack.length > 0 && chip_value / stack.length < this.epsilon) {
                return no_reverse_profits.filter(profit => profit.symbol === symbol);
            }

            if (reverse_profits.length === 1) {
                const profit = reverse_profits[0];

                const _symbol_agg_es_idx = symbol_agg_es_idx.get(profit.symbol)
                const _distributing_index = distributing_index.get(profit.symbol)
                if (_symbol_agg_es_idx === undefined || _distributing_index === undefined) {
                    continue
                }

                let indices;
                if (direction < 0) {
                    indices = _symbol_agg_es_idx.slice(_distributing_index[index]);
                } else {
                    indices = _symbol_agg_es_idx.slice(0, _distributing_index[index]);
                }

                for (const _index of indices) {
                    stack.push({ direction, symbol: profit.symbol, _index });
                }
            } else {
                rlt.push(...no_reverse_profits.filter(profit => profit.symbol === symbol));
            }
        }

        return rlt;
    }

    _get_aggregated_edges(node: string, edges: Edge[]): AggregatedEdge[] {
        /**
         * Get aggregated edges for a specific node.
         * @param node:
         * @param edges: hash, from, to, value, timeStamp, symbol
         * @return:
         */
        let aggregated_edges = new Map<string, AggregatedEdge>();
        for (const edge of edges) {
            const hash = edge.hash;
            const aggregated_edge = new AggregatedEdge(
                hash,
                [new AggregatedEdgeProfit(
                    edge.from == node ? edge.to : edge.from,
                    edge.from == node ? -edge.value : edge.value,
                    edge.timestamp,
                    edge.symbol
                )],
                [edge]
            );
            console.log(aggregated_edge.aggregated_edges);
            let new_aggregated_edge = aggregated_edge.aggregate(aggregated_edges.get(hash));
            if (new_aggregated_edge === null) {
                continue;
            }
            aggregated_edges.set(hash, new_aggregated_edge);
            if (new_aggregated_edge.profits.length === 0) {
                aggregated_edges.delete(hash);
            }
        }
        return Array.from(aggregated_edges.values());
    }
}

export {
    TTR,
    TTRRedirect,
};