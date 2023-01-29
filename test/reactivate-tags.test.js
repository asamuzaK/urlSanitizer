/* api */
import { assert } from 'chai';
import { describe, it } from 'mocha';

/* test */
import {
  getPurifiedDOMFromDataURL, unescapeURLEncodedHTMLChars
} from '../sample/reactivate-tags.js';

describe('unescape URL encoded HTML special chars', () => {
  it('should get undefined', () => {
    const res = unescapeURLEncodedHTMLChars();
    assert.isUndefined(res, 'result');
  });

  it('should get value', () => {
    const res = unescapeURLEncodedHTMLChars('%20');
    assert.strictEqual(res, '%20', 'result');
  });

  it('should get value', () => {
    const res = unescapeURLEncodedHTMLChars('%26amp;');
    assert.strictEqual(res, '%26amp;', 'result');
  });

  it('should get value', () => {
    const res = unescapeURLEncodedHTMLChars('%26lt');
    assert.strictEqual(res, '<', 'result');
  });

  it('should get value', () => {
    const res = unescapeURLEncodedHTMLChars('%26lt;');
    assert.strictEqual(res, '<', 'result');
  });

  it('should get value', () => {
    const res = unescapeURLEncodedHTMLChars('%26gt');
    assert.strictEqual(res, '>', 'result');
  });

  it('should get value', () => {
    const res = unescapeURLEncodedHTMLChars('%26gt;');
    assert.strictEqual(res, '>', 'result');
  });

  it('should get value', () => {
    const res = unescapeURLEncodedHTMLChars('%26quot');
    assert.strictEqual(res, '"', 'result');
  });

  it('should get value', () => {
    const res = unescapeURLEncodedHTMLChars('%26quot;');
    assert.strictEqual(res, '"', 'result');
  });

  it('should get value', () => {
    const res = unescapeURLEncodedHTMLChars('%26%2339');
    assert.strictEqual(res, "'", 'result');
  });

  it('should get value', () => {
    const res = unescapeURLEncodedHTMLChars('%26%2339;');
    assert.strictEqual(res, "'", 'result');
  });
});

describe('get purified DOM from a data URL', () => {
  it('should throw', async () => {
    await getPurifiedDOMFromDataURL().catch(e => {
      assert.instanceOf(e, TypeError, 'error');
      assert.strictEqual(e.message, 'Expected String but got Undefined.',
        'message');
    });
  });

  it('should get null', async () => {
    const res = await getPurifiedDOMFromDataURL('javascript;alert(1)');
    assert.isNull(res, 'result');
  });

  it('should get null', async () => {
    const res = await getPurifiedDOMFromDataURL('https://example.com');
    assert.isNull(res, 'result');
  });

  it('should get null', async () => {
    const res = await getPurifiedDOMFromDataURL('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg==');
    assert.isNull(res, 'result');
  });

  it('should get null', async () => {
    const res = await getPurifiedDOMFromDataURL('data:,Hello%2C%20World!');
    assert.isNull(res, 'result');
  });

  it('should get empty string', async () => {
    const data = '<script>alert(1)</script>';
    const encData = encodeURIComponent(data);
    const res = await getPurifiedDOMFromDataURL(`data:text/html,${encData}`);
    assert.strictEqual(res, '', 'result');
  });

  it('should get value', async () => {
    const data = '<div><script>alert(1)</script></div>';
    const encData = encodeURIComponent(data);
    const res = await getPurifiedDOMFromDataURL(`data:text/html,${encData}`);
    assert.strictEqual(res, '<div></div>', 'result');
  });

  it('should get value', async () => {
    const data = '<div><script>alert(1)</script></div>';
    const encData = encodeURIComponent(data);
    const base64Data = btoa(encData);
    const res =
      await getPurifiedDOMFromDataURL(`data:text/html;base64,${base64Data}`);
    assert.strictEqual(res, '<div></div>', 'result');
  });

  it('should get value', async () => {
    const data = '<svg><g id="foo" onclick="alert(1)"><path/><path/></g></svg>';
    const encData = encodeURIComponent(data);
    const res =
      await getPurifiedDOMFromDataURL(`data:image/svg+xml,${encData}`);
    assert.strictEqual(res,
      '<svg><g id="foo"><path></path><path></path></g></svg>', 'result');
  });

  it('should get value', async () => {
    const data = '<svg><g id="foo" onclick="alert(1)"><path/><path/></g></svg>';
    const encData = encodeURIComponent(data);
    const base64Data = btoa(encData);
    const res = await getPurifiedDOMFromDataURL(`data:image/svg+xml;base64,${base64Data}`);
    assert.strictEqual(res,
      '<svg><g id="foo"><path></path><path></path></g></svg>', 'result');
  });
});
