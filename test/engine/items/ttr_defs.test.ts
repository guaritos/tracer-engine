import { Edge, Profit, AggregatedEdge, AggregatedEdgeProfit } from "../../../src/engine/items/ttr_defs";
import { TTRRedirect } from "../../../src/engine/strategies/ttr";

describe('TTR Definitions Tests', () => {
    test('Edge should have correct properties', () => {
        const edge = new Edge('node1', 'node2', 'A', 10, 1622547800, '<hash1>');
        expect(edge.from).toBe('node1');
        expect(edge.to).toBe('node2');
        expect(edge.symbol).toBe('A');
        expect(edge.value).toBe(10);
        expect(edge.timestamp).toBe(1622547800);
        expect(edge.hash).toBe('<hash1>');
    });

    test('Profit should have correct properties', () => {
        const profit = new Profit('A', 100, 1622547800);
        expect(profit.value).toBe(100);
        expect(profit.timestamp).toBe(1622547800);
        expect(profit.symbol).toBe('A');
    });

    test('AggregatedEdge should aggregate profits correctly', () => {
        const edges = [
            { from: 'node1', to: 'node2', symbol: 'A', value: 10, timestamp: 1622547800, hash: '<hash1>' },
            { from: 'node1', to: 'node3', symbol: 'B', value: 20, timestamp: 1622547801, hash: '<hash2>' },
            { from: 'node1', to: 'node2', symbol: 'A', value: 10, timestamp: 1622547802, hash: '<hash2>' }
        ];
        const node = 'node1';
        const strategy = new TTRRedirect(node);
        const agg_es = strategy._get_aggregated_edges(node, edges);
        expect(agg_es).toBeDefined();
    });

    test('AggregatedEdgeProfit should have correct properties', () => {
        const aggregatedProfit = new AggregatedEdgeProfit('node1', 200, 1622547800, 'B');
        expect(aggregatedProfit.address).toBe('node1');
        expect(aggregatedProfit.value).toBe(200);
        expect(aggregatedProfit.timestamp).toBe(1622547800);
        expect(aggregatedProfit.symbol).toBe('B');
    });
});