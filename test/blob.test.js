/* api */
import { assert } from 'chai';
import { describe, it } from 'mocha';

describe('test for blob', () => {
  it('should get blob', async () => {
    const file = new Blob(['<svg></svg>'], {
      type: 'image/svg+xml'
    });
    const url = URL.createObjectURL(file);
    const res = await fetch(url);
    URL.revokeObjectURL(url);
    const blob = await res.blob(); // does not resolve
    console.log(blob.size); // nothing logged
  });
});
