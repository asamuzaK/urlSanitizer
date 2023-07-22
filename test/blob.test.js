/* api */
import { assert } from 'chai';
import { describe, it } from 'mocha';

describe('test for blob', () => {
  it('should get blob', async () => {
    const src = '<svg></svg>';
    const file = new Blob([src], {
      type: 'image/svg+xml'
    });
    const url = URL.createObjectURL(file);
    const res = await fetch(url);
    const blob = await res.blob();
    assert.instanceOf(blob, Blob, 'Blob');
  });
});
