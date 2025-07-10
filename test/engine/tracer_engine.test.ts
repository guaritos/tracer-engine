import { PopItem, RankItem, StrategySnapshotItem } from '../../src/engine/items/subgraph';
import { TracerEngine } from '../../src/engine/tracer_engine'
import { Bucket } from '../utils/bucket';
import { generateRandomAddress, generateRandomEdges } from '../utils/generate_edges';

describe('Tracer Engine Tests', () => {
    // test('Tracer Engine push_pop with generated data', () => {
    //     const addresses: Bucket<string> = new Bucket();
    //     for (let i = 0; i < 100; i++) {
    //         addresses.add(generateRandomAddress());
    //     } 
    //     const source = addresses.getRandomItem();
    //     const edges = generateRandomEdges(addresses);
    //     const engine = new TracerEngine(source);
    //     const data = engine.push_pop(source,edges);
    //     for (const result of data){
    //         expect(result).toBeDefined();
    //         // console.log(result);
    //     }
    // });

    test('Tracer Engine continous push_pop until normal exit', () => {
        const addresses: Bucket<string> = new Bucket();
        for (let i = 0; i < 100; i++) {
            addresses.add(generateRandomAddress());
        } 
        let source = addresses.getRandomItem();
        let edges_amount = 500
        let edges = generateRandomEdges(source, addresses, edges_amount);
        const engine = new TracerEngine(source, true);
        let data = engine.push_pop(source, edges);
        let curr = data.next();
        while (!curr.done) {
            // StrategeSnapshotItem
            expect(curr.value).toBeInstanceOf(StrategySnapshotItem);
            // console.log(curr.value);
            // RankItem
            curr = data.next();
            expect(curr.value).toBeInstanceOf(RankItem);
            
            // PopItem or empty return;
            curr = data.next();
            expect(curr.value instanceof PopItem);
            if (curr.done) {
                break;
            }
            else if (curr.value instanceof PopItem) {
                const node = curr.value.node;
                if (!node) break;
                data = engine.push_pop(node, generateRandomEdges(node, addresses, edges_amount));                
                curr = data.next();
            }
        }
        expect(curr.done).toBeTruthy();
    });
});