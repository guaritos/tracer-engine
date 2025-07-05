const { ContextualItem } = require('../../../src/engine/items/defs');

describe('ContextualItem Tests', () => {
  test('Create ContextualItem', () => {
    const item = new ContextualItem();
    expect(item).toBeDefined();
  });

  test('Set and Get ContextualItem kwargs', () => {
    const item = new ContextualItem();
    const kwargs = { key1: 'value1', key2: 'value2' };
    item.set_context_kwargs(kwargs);
    expect(item.get_context_kwargs()).toEqual(kwargs);
  });

  test('Get empty ContextualItem kwargs', () => {
    const item = new ContextualItem();
    expect(item.get_context_kwargs()).toEqual({});
  });

  test('Set empty ContextualItem kwargs', () => {
    const item = new ContextualItem();
    item.set_context_kwargs({});
    expect(item.get_context_kwargs()).toEqual({});
  });

  test('Set and Get ContextualItem kwargs with empty values', () => {
    const item = new ContextualItem();
    const kwargs = { key1: '', key2: null };
    item.set_context_kwargs(kwargs);
    expect(item.get_context_kwargs()).toEqual(kwargs);
  });

  test('Set and Get ContextualItem kwargs with mixed types', () => {
    const item = new ContextualItem();
    const kwargs = { key1: 'value1', key2: 42, key3: true, key4: null };
    item.set_context_kwargs(kwargs);
    expect(item.get_context_kwargs()).toEqual(kwargs);
  });

  test('Set ContextualItem kwargs with existing keys', () => {
    const item = new ContextualItem({ cb_kwargs: { key1: 'initial' } });
    const kwargs = { key1: 'updated', key2: 'new' };
    item.set_context_kwargs(kwargs);
    expect(item.get_context_kwargs()).toEqual({ key1: 'updated', key2: 'new' });
  });

  test('Set ContextualItem kwargs with no initial cb_kwargs', () => {
    const item = new ContextualItem();
    const kwargs = { key1: 'value1' };
    item.set_context_kwargs(kwargs);
    expect(item.get_context_kwargs()).toEqual(kwargs);
  });

  test('Set ContextualItem kwargs with empty initial cb_kwargs', () => {
    const item = new ContextualItem({ cb_kwargs: {} });
    const kwargs = { key1: 'value1' };
    item.set_context_kwargs(kwargs);
    expect(item.get_context_kwargs()).toEqual(kwargs);
  });

  test('Set ContextualItem kwargs with undefined values', () => {
    const item = new ContextualItem();
    const kwargs = { key1: undefined, key2: 'value2' };
    item.set_context_kwargs(kwargs);
    expect(item.get_context_kwargs()).toEqual({ key1: undefined, key2: 'value2' });
  });

  test('Set ContextualItem kwargs with mixed types and undefined', () => {
    const item = new ContextualItem();
    const kwargs = { key1: 'value1', key2: undefined, key3: 42 };
    item.set_context_kwargs(kwargs);
    expect(item.get_context_kwargs()).toEqual({ key1: 'value1', key2: undefined, key3: 42 });
  });

  test('Set ContextualItem kwargs with empty string values', () => {
    const item = new ContextualItem();
    const kwargs = { key1: '', key2: 'value2' };
    item.set_context_kwargs(kwargs);
    expect(item.get_context_kwargs()).toEqual({ key1: '', key2: 'value2' });
  });

  test('Set ContextualItem kwargs with null values', () => {
    const item = new ContextualItem();
    const kwargs = { key1: null, key2: 'value2' };
    item.set_context_kwargs(kwargs);
    expect(item.get_context_kwargs()).toEqual({ key1: null, key2: 'value2' });
  });

  test('Set ContextualItem kwargs with boolean values', () => {
    const item = new ContextualItem();
    const kwargs = { key1: true, key2: false };
    item.set_context_kwargs(kwargs);
    expect(item.get_context_kwargs()).toEqual({ key1: true, key2: false });
  });

  test('Set ContextualItem kwargs with numeric values', () => {
    const item = new ContextualItem();
    const kwargs = { key1: 123, key2: 456.78 };
    item.set_context_kwargs(kwargs);
    expect(item.get_context_kwargs()).toEqual({ key1: 123, key2: 456.78 });
  });

  test('Set ContextualItem kwargs with array values', () => {
    const item = new ContextualItem();
    const kwargs = { key1: [1, 2, 3], key2: ['a', 'b', 'c'] };
    item.set_context_kwargs(kwargs);
    expect(item.get_context_kwargs()).toEqual({ key1: [1, 2, 3], key2: ['a', 'b', 'c'] });
  });

  test('Set ContextualItem kwargs with object values', () => {
    const item = new ContextualItem();
    const kwargs = { key1: { a: 1, b: 2 }, key2: { x: 'y' } };
    item.set_context_kwargs(kwargs);
    expect(item.get_context_kwargs()).toEqual({ key1: { a: 1, b: 2 }, key2: { x: 'y' } });
  });

  test('Set ContextualItem kwargs with nested objects', () => {
    const item = new ContextualItem();
    const kwargs = { key1: { nested: { a: 1 } }, key2: { b: 2 } };
    item.set_context_kwargs(kwargs);
    expect(item.get_context_kwargs()).toEqual({ key1: { nested: { a: 1 } }, key2: { b: 2 } });
  });

  test('Set ContextualItem kwargs with complex nested structures', () => {
    const item = new ContextualItem();
    const kwargs = { key1: { nested: { a: [1, 2], b: { c: 'd' } } }, key2: 'value2' };
    item.set_context_kwargs(kwargs);
    expect(item.get_context_kwargs()).toEqual({ key1: { nested: { a: [1, 2], b: { c: 'd' } } }, key2: 'value2' });
  });

  test('Set ContextualItem kwargs with empty nested objects', () => {
    const item = new ContextualItem();
    const kwargs = { key1: {}, key2: { nested: {} } };
    item.set_context_kwargs(kwargs);
    expect(item.get_context_kwargs()).toEqual({ key1: {}, key2: { nested: {} } });
  });

  test('Set ContextualItem kwargs with mixed types in nested objects', () => {
    const item = new ContextualItem();
    const kwargs = { key1: { a: 1, b: 'string', c: [1, 2] }, key2: { d: true } };
    item.set_context_kwargs(kwargs);
    expect(item.get_context_kwargs()).toEqual({ key1: { a: 1, b: 'string', c: [1, 2] }, key2: { d: true } });
  });

  test('Set ContextualItem kwargs with special characters in keys', () => {
    const item = new ContextualItem();
    const kwargs = { 'key-1': 'value1', 'key_2': 'value2' };
    item.set_context_kwargs(kwargs);
    expect(item.get_context_kwargs()).toEqual({ 'key-1': 'value1', 'key_2': 'value2' });
  });
});
