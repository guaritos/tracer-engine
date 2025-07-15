import { TracerEngine } from './engine/tracer_engine';
import { Bucket } from './utils/bucket';
import { generateRandomAddress, generateRandomEdges } from './utils/generate_edges';

export * from './engine/tracer_engine';

// async function test() {
//     const addresses: Bucket<string> = new Bucket();
//     for (let i = 0; i < 100; i++) {
//         addresses.add(generateRandomAddress());
//     } 
//     let source = addresses.getRandomItem();
//     let edges_amount = 500;
//     const get_edges = async (source: string) => { return generateRandomEdges(source, addresses, edges_amount) };
//     let result = await new TracerEngine(source, {enable_log: false}).startTrace(get_edges);
//     console.log(result.strategy_snap_shot_items);
// }

// test();

