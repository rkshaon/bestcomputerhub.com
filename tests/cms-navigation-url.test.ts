// File: /tests/cms-navigation-url.test.ts
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createSSRApp, defineComponent, h, computed } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { parse, compileScript, compileTemplate } from '@vue/compiler-sfc';
import * as ts from 'typescript';
import {
  isValidNavigationTargetUrl,
  normalizeInternalNavigationPath,
  resolveNavigationLink,
  resolveOriginFromUrl
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

test('FooterNavList.vue renders <NuxtLink> for internal/same-origin URLs and <a> for external/mailto/tel links', async () => {
  const filePath = path.resolve(process.cwd(), 'components/layout/FooterNavList.vue');
  const source = await fs.readFile(filePath, 'utf8');

  const { descriptor, errors } = parse(source, { filename: filePath });
  assert.equal(errors.length, 0, `Expected 0 SFC parse errors, got: ${JSON.stringify(errors)}`);
  assert.ok(descriptor.scriptSetup && descriptor.template);

  const compiledScript = compileScript(descriptor, {
    id: 'footer-nav-list-test',
    inlineTemplate: false
  });
  const compiledTemplate = compileTemplate({
    source: descriptor.template.content,
    filename: filePath,
    id: 'footer-nav-list-test',
    compilerOptions: {
      mode: 'function',
      bindingMetadata: compiledScript.bindings
    }
  });
  assert.equal(compiledTemplate.errors.length, 0, `Template compile errors: ${JSON.stringify(compiledTemplate.errors)}`);

  const scriptWithoutImports = compiledScript.content
    .replace(/import\s+\{[^}]*\}\s+from\s+['"][^'"]+['"];?\s*/g, '')
    .replace(/export\s+interface\s+\w+\s*\{[^}]*\}\s*/g, '')
    .replace(/export\s+default\s+/, 'return ');

  const transpiled = ts.transpileModule(scriptWithoutImports, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022
    }
  });

  const NuxtLinkStub = defineComponent({
    name: 'NuxtLink',
    props: {
      to: { type: String, required: true },
      target: { type: String, default: undefined },
      rel: { type: String, default: undefined },
      class: { type: String, default: undefined }
    },
    setup(props, { slots }) {
      return () => h(
        'a',
        {
          'data-nuxt-link': 'true',
          href: props.to,
          target: props.target,
          rel: props.rel,
          class: props.class
        },
        slots.default?.()
      );
    }
  });

  const VueRuntime = await import('vue');
  const transpiledTemplate = ts.transpileModule(compiledTemplate.code, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022
    }
  });
  const renderFn = new Function('Vue', transpiledTemplate.outputText)(VueRuntime);
  const makeComponent = new Function(
    'computed',
    'resolveNavigationLink',
    'resolveOriginFromUrl',
    'useRequestURL',
    'useRuntimeConfig',
    'useSiteConfig',
    '_defineComponent',
    transpiled.outputText
  );

  const componentDef = makeComponent(
    computed,
    resolveNavigationLink,
    resolveOriginFromUrl,
    () => new URL(PROD_ORIGIN),
    () => ({ public: { appUrl: '' } }),
    () => ({ url: PROD_ORIGIN }),
    defineComponent
  );
  componentDef.render = renderFn;
  componentDef.components = {
    NuxtLink: NuxtLinkStub,
    FooterNavList: componentDef
  };

  const app = createSSRApp({
    render() {
      return h(componentDef, {
        currentOrigin: PROD_ORIGIN,
        items: [
          { id: 1, label: 'Blog Slash', url: '/blog/', open_in_new_tab: false, children: [] },
          { id: 2, label: 'Blog Query', url: '/blog?category=news#latest', open_in_new_tab: false, children: [] },
          { id: 3, label: 'Same Origin', url: 'https://bestcomputerhub.com/blog/', open_in_new_tab: true, children: [] },
          { id: 4, label: 'External', url: 'https://example.com/', open_in_new_tab: true, children: [] },
          { id: 5, label: 'Mail', url: 'mailto:support@example.com', open_in_new_tab: false, children: [] },
          { id: 6, label: 'Tel', url: 'tel:+880123456789', open_in_new_tab: false, children: [] },
          { id: 7, label: 'CMS Page', url: '/about-us/', slug: 'about-us', open_in_new_tab: false, children: [] },
          { id: 8, label: 'Unsafe', url: 'javascript:alert(1)', open_in_new_tab: false, children: [] }
        ]
      });
    }
  });

  const html = await renderToString(app);

  assert.ok(html.includes('data-nuxt-link="true" href="/blog/"'), 'Expected /blog/ to render as <NuxtLink>');
  assert.ok(html.includes('data-nuxt-link="true" href="/blog/?category=news#latest"'), 'Expected query+hash internal link to render as normalized <NuxtLink>');
  assert.ok(html.includes('data-nuxt-link="true" href="/blog/" target="_blank" rel="noopener noreferrer"'), 'Expected same-origin URL to render as <NuxtLink> with open_in_new_tab preserved');
  assert.ok(html.includes('<a href="https://example.com/" target="_blank" rel="noopener noreferrer"') && !html.includes('data-nuxt-link="true" href="https://example.com/"'), 'Expected genuine external URL to render as raw <a>');
  assert.ok(html.includes('<a href="mailto:support@example.com"') && !html.includes('data-nuxt-link="true" href="mailto:'), 'Expected mailto: to render as raw <a>');
  assert.ok(html.includes('<a href="tel:+880123456789"') && !html.includes('data-nuxt-link="true" href="tel:'), 'Expected tel: to render as raw <a>');
  assert.ok(html.includes('data-nuxt-link="true" href="/about-us/"'), 'Expected CMS page slug to render as <NuxtLink>');
  assert.ok(html.includes('>Unsafe</span>'), 'Expected unsafe scheme to render as non-clickable <span>');
});

