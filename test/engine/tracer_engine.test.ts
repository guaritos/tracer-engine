import { PopItem, RankItem, StrategySnapshotItem } from '../../src/engine/items/subgraph';
import { TracerEngine } from '../../src/engine/tracer_engine'
import { generateRandomAddress, generateRandomEdges } from '../utils/generate_edges';

describe('Tracer Engine Tests', () => {
    test('Tracer Engine push_pop with generated data', () => {
        const source = generateRandomAddress();
        const edges = generateRandomEdges();
        const engine = new TracerEngine(source);
        const data = engine.push_pop(source,edges);
        for (const result of data){
            expect(result).toBeDefined();
            console.log(result);
        }
    });

    test('Tracer Engine continous push_pop until normal exit', () => {
        let source = generateRandomAddress();
        let edges_amount = 500
        let edges = generateRandomEdges(edges_amount);
        const engine = new TracerEngine(source);
        let data = engine.push_pop(source, edges);
        let curr = data.next();
        while (!curr.done) {
            // StrategeSnapshotItem
            expect(curr.value).toBeInstanceOf(StrategySnapshotItem);
            console.log(curr.value);
            // RankItem
            curr = data.next();
            expect(curr.value).toBeInstanceOf(RankItem);
            console.log(curr.value);
            
            // PopItem or empty return;
            curr = data.next();
            if (curr.done) {
                break;
            }
            else if (curr.value instanceof PopItem) {
                const node = curr.value.node;
                source = node;
                if (edges_amount > 0) {
                    edges_amount -= 100;
                    data = engine.push_pop(node, generateRandomEdges(edges_amount));
                }
                curr = data.next();
            }
        }
        expect(curr.done).toBeTruthy();
    });
});