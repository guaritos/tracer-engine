import { Edge, Profit, AggregatedEdge, AggregatedEdgeProfit } from "../../../src/engine/items/ttr_defs";

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
            { from: 'node1', to: 'node3', symbol: 'B', value: 20, timestamp: 1622547801, hash: '<hash2>' }
        ];
        const node = 'node1';
        const new_edge = { from: node, to: 'node2', symbol: 'A', value: 10, timestamp: 1622547801, hash: '<hash2>' };
        let aggregated_edge = new AggregatedEdge(new_edge.hash, [], [
            new AggregatedEdge(
                new_edge.hash,
                [],
                []
            ),
        ]);
        aggregated_edge = aggregated_edge.aggregate(aggregated_edge)!;
        expect(aggregated_edge).toBeDefined();

        expect(aggregated_edge.profits.length).toBe(2);
        expect(aggregated_edge.get_output_symbols().has('A')).toBe(true);
        expect(aggregated_edge.get_input_symbols().has('A')).toBe(true);
    });

    test('AggregatedEdgeProfit should have correct properties', () => {
        const aggregatedProfit = new AggregatedEdgeProfit('node1', 200, 1622547800, 'B');
        expect(aggregatedProfit.address).toBe('node1');
        expect(aggregatedProfit.value).toBe(200);
        expect(aggregatedProfit.timestamp).toBe(1622547800);
        expect(aggregatedProfit.symbol).toBe('B');
    });
});