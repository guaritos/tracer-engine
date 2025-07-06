import { Edge, Profit } from '../../../src/engine/items/ttr_defs';
import { TTR, TTRRedirect } from '../../../src/engine/strategies/ttr';

describe('TTR Tests', () => {
  test('Create TTR', () => {
    const model = new TTR('test_source');
    expect(model).toBeDefined();
  });

  test('TTR should have a source property', () => {
    const model = new TTR('test_source');
    expect(model.source).toBe('test_source');
  });

  test('TTR push method should throw error', () => {
    const model = new TTR('test_source');
    expect(() => model.push({}, [])).toThrow("Method not implemented.");
  });

  test('TTR pop method should throw error', () => {
    const model = new TTR('test_source');
    expect(() => model.pop()).toThrow("Method not implemented.");
  });

  test('TTR get_context_snapshot method should return context snapshot', () => {
    const model = new TTR('test_source');
    const snapshot = model.get_context_snapshot();
    expect(snapshot).toBeDefined();
    expect(snapshot.source.value).toBe('test_source');
  });

  test('TTR get_node_rank method should return node rank', () => {
    const model = new TTR('test_source');
    const rank = model.get_node_rank();
    expect(rank).toBeDefined();
  });

  test('TTR should have default parameters', () => {
    const model = new TTR('test_source');
    expect(model.alpha).toBe(0.15);
    expect(model.beta).toBe(0.7);
    expect(model.epsilon).toBe(1e-3);
  });

  test('TTR should allow custom parameters', () => {
    const model = new TTR('test_source', 0.2, 0.9, 1e-4);
    expect(model.alpha).toBe(0.2);
    expect(model.beta).toBe(0.9);
    expect(model.epsilon).toBe(1e-4);
  });

  test('TTR should have a valid context snapshot structure', () => {
    const model = new TTR('test_source');
    const snapshot = model.get_context_snapshot();
    expect(snapshot).toHaveProperty('source');
    expect(snapshot).toHaveProperty('alpha');
    expect(snapshot).toHaveProperty('beta');
    expect(snapshot).toHaveProperty('epsilon');
    expect(snapshot).toHaveProperty('r');
    expect(snapshot).toHaveProperty('p');
  });

  test('TTR should initialize p and r as Maps', () => {
    const model = new TTR('test_source');
    expect(model.p instanceof Map).toBe(true);
    expect(model.r instanceof Map).toBe(true);
  });

  test('TTR should have a valid node rank structure', () => {
    const model = new TTR('test_source');
    const rank = model.get_node_rank();
    expect(rank).toBeInstanceOf(Map);
  });

  test('TTR should handle empty push and pop operations gracefully', () => {
    const model = new TTR('test_source');
    expect(() => model.push({}, [])).toThrow("Method not implemented.");
    expect(() => model.pop()).toThrow("Method not implemented.");
  });

  test('TTR should not throw errors on valid method calls', () => {
    const model = new TTR('test_source');
    expect(() => model.get_context_snapshot()).not.toThrow();
    expect(() => model.get_node_rank()).not.toThrow();
  });
});

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
    expect(snapshot.source.value).toBe('test_source');
    expect(snapshot.alpha.value).toBe(0.15);
    expect(snapshot.beta.value).toBe(0.7);
    expect(snapshot.epsilon.value).toBe(1e-3);
  });

  test('TTRRedirect get_node_rank method', () => {
    const model = new TTRRedirect('test_source');
    const rank = model.get_node_rank();
    expect(rank).toBeDefined();
    expect(rank instanceof Map).toBe(true);
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

  test('TTRRedirect get_aggregated_edges method', () => {
    const model = new TTRRedirect('test_source');
    const [node1, node2] = ['node1', 'node2'];
    const edges1: Edge[] = [
      {
        from: 'node1', to: 'node2', symbol: 'A', value: 10, timestamp: 1, hash: '<hash1>'
      },
      {
        from: 'node1', to: 'node3', symbol: 'B', value: 20, timestamp: 2, hash: '<hash2>'
      }
    ];
    const edges2: Edge[] = [
      {
        from: 'node2', to: 'node4', symbol: 'C', value: 30, timestamp: 3, hash: '<hash3>'
      },
      {
        from: 'node1', to: 'node2', symbol: 'A', value: 5, timestamp: 4, hash: '<hash4>'
      }
    ];
    model.push(node1, edges1);
    model.push(node2, edges2);
    const aggregatedEdges = model._get_aggregated_edges(node1, edges1);
    expect(aggregatedEdges).toBeDefined();
    expect(aggregatedEdges.length).toBeGreaterThan(0);
  });
});