class Edge {
    /**
     * Edge is a class that represents a financial transaction edge in the TTR strategy.
     * It contains the from address, to address, symbol, value, and an optional timestamp
     * associated with the edge.
     * 
     * @param _from - The address from which the transaction originates.
     * @param _to - The address to which the transaction is directed.
     * @param _symbol - The symbol of the asset being transferred.
     * @param _value - The value of the asset being transferred.
     * @param _type - The transaction contract type.
     * @param _hash - The hash of the transaction.
     * @param _timestamp - The timestamp of the transaction (optional).
     */
    from: string = "";
    to: string = "";
    symbol: string = "";
    value: number = 0;
    type: string = "";
    hash: string = "";
    timestamp: number = 0;

    constructor(
        _from: string = "",
        _to: string = "",
        _symbol: string = "",
        _value: number = 0,
        _type: string = "",
        _timestamp: number = 0,
        _hash: string = "",
    ) {
        this.from = _from;
        this.to = _to;
        this.symbol = _symbol;
        this.value = _value;
        this.type = _type;
        this.hash = _hash;
        this.timestamp = _timestamp;
    }
}

class WeightedEdge {
    from: string;
    to: string;
    weight: number;
    symbol: string;
    type: string;
    hash: string;
    timestamp: number;

    constructor(params: {from: string, to: string, weight: number, symbol: string, type: string, hash: string, timestamp: number}) {
        this.from = params.from;
        this.to = params.to;
        this.weight = params.weight;
        this.symbol = params.symbol;
        this.type = params.type;
        this.hash = params.hash;
        this.timestamp = params.timestamp;
    }
}

class Profit {
    constructor(
        public symbol: string,
        public value: number,
        public timestamp: number,
    ) {
        this.symbol = symbol;
        this.value = value;
        this.timestamp = timestamp;
    }
}

class AggregatedEdge {
    /**
     * AggregatedEdge is a class that represents an aggregated edge in the TTR strategy.
     * It contains a hash, profits, and aggregated edges.
     *
     * @param _hash - The hash of the aggregated edge.
     * @param _profits - An array of profits associated with the aggregated edge.
     * @param _aggregated_edges - An array of aggregated edges.
     */

    hash: string;
    type: string;
    profits: AggregatedEdgeProfit[];
    aggregated_edges: any[];

    constructor(
        _hash: string,
        _type: string,
        _profits: AggregatedEdgeProfit[],
        _aggregated_edges: any[],
    ) {
        this.hash = _hash;
        this.type = _type;
        this.profits = _profits;
        this.aggregated_edges = _aggregated_edges;
    }

    aggregate(aggregated_edge: any): AggregatedEdge {
        if (aggregated_edge === null || aggregated_edge === undefined) {
            return this;
        }
        if (!(aggregated_edge instanceof AggregatedEdge)) {
            throw new Error("Invalid aggregated edge");
        }

        // 1. collect all edges
        this.aggregated_edges.push(...aggregated_edge.aggregated_edges);

        // 2. according to symbol to classify profit and aggregate
        const aggregated_profits = new Map<string, AggregatedEdgeProfit>();
        for (const profit of [...this.profits, ...aggregated_edge.profits]) {
            const key = (profit.symbol, profit.address);
            let _profit = aggregated_profits.get(key);
            if (_profit === undefined) {
                if (profit.value !== 0) {
                    aggregated_profits.set(key, profit);
                }
                continue;
            }

            if (_profit.value + profit.value === 0) {
                aggregated_profits.delete(key);
                continue;
            }

            let sgn = _profit.value > 0 ? 1 : -1;
            sgn *= _profit.value + profit.value > 0 ? 1 : -1;
            const aggregated_value = _profit.value + profit.value;
            if (sgn < 0) {
                _profit = profit;
            }
            _profit.value = aggregated_value;
            aggregated_profits.set(key, _profit);
        }
        this.profits = Array.from(aggregated_profits.values());

        return this;
    }

    get_input_profit(symbol: string) {
        for (const profit of this.profits) {
            if (profit.symbol === symbol && profit.value > 0) {
                return profit;
            }
        }
        return null;
    }

    get_output_profit(symbol: string) {
        for (const profit of this.profits) {
            if (profit.symbol === symbol && profit.value < 0) {
                return profit;
            }
        }
        return null;
    }

    get_output_profits() {
        const rlt = [];
        for (const profit of this.profits) {
            if (profit.value < 0) {
                rlt.push(profit);
            }
        }
        return rlt;
    }

    get_input_profits() {
        const rlt = [];
        for (const profit of this.profits) {
            if (profit.value > 0) {
                rlt.push(profit);
            }
        }
        return rlt;
    }

    get_output_symbols() {
        const symbols = new Set();
        for (const profit of this.profits) {
            if (profit.value < 0) {
                symbols.add(profit.symbol);
            }
        }
        return symbols;
    }

    get_input_symbols() {
        const symbols = new Set();
        for (const profit of this.profits) {
            if (profit.value > 0) {
                symbols.add(profit.symbol);
            }
        }
        return symbols;
    }

    get_timestamp() {
        let timestamp = 0;
        if (this.profits.length > 0) {
            timestamp = this.profits[0].timestamp;
        }
        return timestamp;
    }
}

class AggregatedEdgeProfit {
    address: string;
    value: number;
    timestamp: number;
    symbol: string;
    /**
     * AggregatedEdgeProfit is a class that represents a profit associated with an aggregated edge.
     * It contains the address, value, timestamp, and symbol of the profit.
     *
     * @param _address - The address associated with the profit.
     * @param _value - The value of the profit.
     * @param _timestamp - The timestamp of the profit.
     * @param _symbol - The symbol associated with the profit.
     */
    constructor(
        _address: string,
        _value: number,
        _timestamp: number,
        _symbol: string,
    ) {
        this.address = _address;
        this.value = _value;
        this.timestamp = _timestamp;
        this.symbol = _symbol;
    }
}

export {
    Edge,
    WeightedEdge,
    Profit,
    AggregatedEdge,
    AggregatedEdgeProfit,
};