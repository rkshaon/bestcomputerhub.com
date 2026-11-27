// File: /tests/cms-navigation-url.test.ts
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isValidNavigationTargetUrl,
  normalizeInternalNavigationPath,
  resolveNavigationLink
} from '../utils/cms';

const PROD_ORIGIN = 'https://bestcomputerhub.com';

test('Admin navigation validation accepts root-relative internal paths and absolute HTTP/HTTPS URLs', () => {
  assert.equal(isValidNavigationTargetUrl('/blog/'), true);
  assert.equal(isValidNavigationTargetUrl('/blog'), true);
  assert.equal(isValidNavigationTargetUrl('/shop-now/'), true);
  assert.equal(isValidNavigationTargetUrl('/track-order/'), true);
  assert.equal(isValidNavigationTargetUrl('/blog?category=news#latest'), true);
  assert.equal(isValidNavigationTargetUrl('/'), true);
  assert.equal(isValidNavigationTargetUrl('https://example.com/support'), true);
  assert.equal(isValidNavigationTargetUrl('http://localhost:3000/blog/'), true);
  assert.equal(isValidNavigationTargetUrl('https://bestcomputerhub.com/blog/'), true);
});

test('Admin navigation validation rejects protocol-relative URLs, backslashes, control chars, and unsafe schemes', () => {
  assert.equal(isValidNavigationTargetUrl(''), false);
  assert.equal(isValidNavigationTargetUrl('   '), false);
  assert.equal(isValidNavigationTargetUrl('//example.com'), false);
  assert.equal(isValidNavigationTargetUrl('///example.com'), false);
  assert.equal(isValidNavigationTargetUrl('/ /example.com'), false);
  assert.equal(isValidNavigationTargetUrl('/\\example.com'), false);
  assert.equal(isValidNavigationTargetUrl('\\example.com'), false);
  assert.equal(isValidNavigationTargetUrl('/blog\\sub'), false);
  assert.equal(isValidNavigationTargetUrl('javascript:alert(1)'), false);
  assert.equal(isValidNavigationTargetUrl('JAVASCRIPT:alert(1)'), false);
  assert.equal(isValidNavigationTargetUrl('java\tscript:alert(1)'), false);
  assert.equal(isValidNavigationTargetUrl('vbscript:msgbox(1)'), false);
  assert.equal(isValidNavigationTargetUrl('data:text/html,<script>alert(1)</script>'), false);
  assert.equal(isValidNavigationTargetUrl('ftp://example.com/file'), false);
  assert.equal(isValidNavigationTargetUrl('blog'), false);
  assert.equal(isValidNavigationTargetUrl('example.com/support'), false);
});

test('normalizeInternalNavigationPath preserves query strings and hash fragments while enforcing trailing slash', () => {
  assert.equal(normalizeInternalNavigationPath('/blog/'), '/blog/');
  assert.equal(normalizeInternalNavigationPath('/blog'), '/blog/');
  assert.equal(normalizeInternalNavigationPath('/blog?category=news#latest'), '/blog/?category=news#latest');
  assert.equal(normalizeInternalNavigationPath('/blog/?category=news#latest'), '/blog/?category=news#latest');
  assert.equal(normalizeInternalNavigationPath('/blog#latest?ignored-as-query'), '/blog/#latest?ignored-as-query');
  assert.equal(normalizeInternalNavigationPath('/'), '/');
  assert.equal(normalizeInternalNavigationPath('/?ref=footer#top'), '/?ref=footer#top');
  assert.equal(normalizeInternalNavigationPath('#section'), '#section');
  assert.equal(normalizeInternalNavigationPath('?sort=newest'), '?sort=newest');
});

test('resolveNavigationLink classifies every expected URL table case accurately', () => {
  assert.deepEqual(
    resolveNavigationLink({ url: '/blog/' }, { currentOrigin: PROD_ORIGIN }),
    { href: '/blog/', external: false }
  );

  assert.deepEqual(
    resolveNavigationLink({ url: '/blog?category=news#latest' }, { currentOrigin: PROD_ORIGIN }),
    { href: '/blog/?category=news#latest', external: false }
  );

  // Same-origin absolute URL converts to internal path
  assert.deepEqual(
    resolveNavigationLink({ url: 'https://bestcomputerhub.com/blog/' }, { currentOrigin: PROD_ORIGIN }),
    { href: '/blog/', external: false }
  );
  assert.deepEqual(
    resolveNavigationLink({ url: 'https://BESTCOMPUTERHUB.COM/blog?category=news#latest' }, { currentOrigin: PROD_ORIGIN }),
    { href: '/blog/?category=news#latest', external: false }
  );

  // When current origin differs (e.g. preview/dev host), absolute URL remains external
  assert.deepEqual(
    resolveNavigationLink({ url: 'https://bestcomputerhub.com/blog/' }, { currentOrigin: 'http://localhost:3000' }),
    { href: 'https://bestcomputerhub.com/blog/', external: true }
  );

  // Genuine external HTTP/HTTPS URLs remain external
  assert.deepEqual(
    resolveNavigationLink({ url: 'https://example.com/' }, { currentOrigin: PROD_ORIGIN }),
    { href: 'https://example.com/', external: true }
  );

  // Mailto and tel links preserve existing external behavior
  assert.deepEqual(
    resolveNavigationLink({ url: 'mailto:support@example.com' }, { currentOrigin: PROD_ORIGIN }),
    { href: 'mailto:support@example.com', external: true }
  );
  assert.deepEqual(
    resolveNavigationLink({ url: 'tel:+880123456789' }, { currentOrigin: PROD_ORIGIN }),
    { href: 'tel:+880123456789', external: true }
  );
});

test('resolveNavigationLink preserves CMS Page slug navigation and rejects unsafe inputs', () => {
  assert.deepEqual(
    resolveNavigationLink({ slug: 'about-us', url: '/about-us/' }, { currentOrigin: PROD_ORIGIN }),
    { href: '/about-us/', external: false }
  );

  assert.equal(resolveNavigationLink({ url: '//example.com' }, { currentOrigin: PROD_ORIGIN }), null);
  assert.equal(resolveNavigationLink({ url: '///example.com' }, { currentOrigin: PROD_ORIGIN }), null);
  assert.equal(resolveNavigationLink({ url: '/\\example.com' }, { currentOrigin: PROD_ORIGIN }), null);
  assert.equal(resolveNavigationLink({ url: 'javascript:alert(1)' }, { currentOrigin: PROD_ORIGIN }), null);
  assert.equal(resolveNavigationLink({ url: 'data:text/plain,hello' }, { currentOrigin: PROD_ORIGIN }), null);
  assert.equal(resolveNavigationLink({ url: '#' }, { currentOrigin: PROD_ORIGIN }), null);
  assert.equal(resolveNavigationLink({ url: null, slug: null }, { currentOrigin: PROD_ORIGIN }), null);
});
