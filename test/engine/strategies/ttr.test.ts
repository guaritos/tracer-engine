import { Edge, Profit } from '../../../src/engine/items/ttr_defs';
import { TTRRedirect } from '../../../src/engine/strategies/ttr';
import { Bucket } from '../../utils/bucket';
import { generateRandomAddress, generateRandomEdges } from '../../utils/generate_edges';

describe('TTRRedirect Tests', () => {

  test('Create TTRRedirect', () => {
    const model = new TTRRedirect('test_source');
    expect(model).toBeDefined();
  });

  test('TTRRedirect should have a source property', () => {
    const model = new TTRRedirect('test_source');
    expect(model.source).toBe('test_source');
  });

  test('Map sorting in TTRRedirect push method', () => {
    let r = new Map<string, any[]>();
    const node = 'node1';
    r.set(node, [{ timestamp: 1 }, { timestamp: 2 }, { timestamp: 3 }]);
    
    let new_r = r.get(node) || [];
    new_r = [...new_r].sort((a: { timestamp: number; }, b: { timestamp: number; }) => b.timestamp - a.timestamp);

    expect(new_r).toEqual([{ timestamp: 3 }, { timestamp: 2 }, { timestamp: 1 }]);
  });

  test('TTRRedirect merge chips', () => {
    const model = new TTRRedirect('test_source');
    const chips = [
      { from: 'node1', to: 'node2', symbol: 'A', value: 10, timestamp: 1 },
      { from: 'node1', to: 'node3', symbol: 'B', value: 20, timestamp: 2 },
      { from: 'node2', to: 'node4', symbol: 'C', value: 30, timestamp: 3 },
      { from: 'node1', to: 'node2', symbol: 'A', value: 5, timestamp: 4 },
    ];
    
    model.r.set('node1', chips.filter(chip => chip.from === 'node1'));
    
    // merge chips
    for (const [node, chips] of model.r.entries()) {
        const _chips = new Map();
        for (const chip of chips) {
            const key = (chip.symbol, chip.timestamp);
            if (!_chips.has(key)) {
                _chips.set(key, chip);
                continue;
            }
            _chips.get(key).value += chip.value;
        }
        model.r.set(node, Array.from(_chips.values()));
    }
    
    expect(model.r.get('node1')).toEqual([
      { from: 'node1', to: 'node2', symbol: 'A', value: 10, timestamp: 1 },
      { from: 'node1', to: 'node3', symbol: 'B', value: 20, timestamp: 2 },
      { from: 'node1', to: 'node2', symbol: 'A', value: 5, timestamp: 4 },
    ]);
  });

  test('Array slicing', () => {
    const arr = [1, 2, 3, 4, 5];
    const index = 3;
    const sliced = arr.slice(0, index);
    expect(sliced).toEqual([1, 2, 3]);
    const slicedFromIndex = arr.slice(index);
    expect(slicedFromIndex).toEqual([4, 5]);
  });

  test('Map test', () => {
    const map = new Map();
    map.set('key1', 'value1');
    map.set('key2', 'value2');
    expect(map.get('key1')).toBe('value1');
    expect(map.get('key2')).toBe('value2');
  });  

  test('TTRRedirect push method', () => {
    const model = new TTRRedirect('test_source');
    const edges: Edge[] = [
      {
        from: 'node1', to: 'node2', symbol: 'A', value: 10, timestamp: 1, hash: '<hash1>'
      },
      {
        from: 'node1', to: 'node3', symbol: 'B', value: 20, timestamp: 2, hash: '<hash2>'
      },
      {
        from: 'node2', to: 'node4', symbol: 'C', value: 30, timestamp: 3, hash: '<hash3>'
      },
      {
        from: 'node1', to: 'node2', symbol: 'A', value: 5, timestamp: 4, hash: '<hash4>'
      }
    ];
    expect(() => model.push('node1', edges)).not.toThrow();    
  });

  test('TTRRedirect pop method', () => {
    const model = new TTRRedirect('test_source');
    const edges: Edge[] = [
      {
        from: 'node1', to: 'node2', symbol: 'A', value: 10, timestamp: 1, hash: '<hash1>'
      },
      {
        from: 'node1', to: 'node3', symbol: 'B', value: 20, timestamp: 2, hash: '<hash2>'
      }
    ];
    model.push('node1', edges);
    let nextNode: string | null = null;
    expect(() => {
      nextNode = model.pop()[0];
    }).not.toThrow();
  });

  test('TTRRedirect get_context_snapshot method', () => {
    const model = new TTRRedirect('test_source');
    const snapshot = model.get_context_snapshot();
    expect(snapshot).toBeDefined();
    expect(snapshot.source).toBe('test_source');
    expect(snapshot.alpha).toBe(0.15);
    expect(snapshot.beta).toBe(0.7);
    expect(snapshot.epsilon).toBe(1e-3);
  });

  test('TTRRedirect get_node_rank method', () => {
    const model = new TTRRedirect('test_source');
    const rank = model.get_node_rank();
    expect(rank).toBeDefined();
  });

  test('TTRRedirect should handle empty push and pop operations gracefully', () => {
    const model = new TTRRedirect('test_source');
    expect(() => model.push('node1', [])).not.toThrow();
    expect(() => model.pop()).not.toThrow();
  });

  test('TTRRedirect self_push method', () => {
    const alpha = 0.15;
    const model = new TTRRedirect('test_source', alpha);
    const node = 'node1';
    const residuals: Profit[] = [
      { timestamp: 1, symbol: 'A', value: 10 },
      { timestamp: 2, symbol: 'B', value: 20 },
    ];
    expect(() => model._self_push(node, residuals)).not.toThrow();
    expect(model.p.get(node)).toEqual(alpha * (10 + 20)); // alpha * sum of values
  });  

  test('TTRRedirect push with generated edges', () => {
    const addresses: Bucket<string> = new Bucket();
    for (let i = 0; i < 100; i++) {
      addresses.add(generateRandomAddress());
    }
    const source = addresses.getRandomItem();
    const edges = generateRandomEdges(source, addresses);
    const model = new TTRRedirect(source);
    model.push(source, edges);
    const [popped_node, context_kwargs] = model.pop();
    expect(model.get_node_rank()).toBeDefined();
    expect(popped_node).toBeDefined();
  });
});