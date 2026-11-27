// File: /tests/product-card.test.ts
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createSSRApp, defineComponent, h } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { parse, compileTemplate, compileScript } from '@vue/compiler-sfc';
import * as ts from 'typescript';

test('ProductCard.vue compiles cleanly and renders independent links for image, name, and price with separate Buy Now button', async () => {
  const filePath = path.resolve(process.cwd(), 'components/commerce/ProductCard.vue');
  const source = await fs.readFile(filePath, 'utf8');

  const { descriptor, errors } = parse(source, { filename: filePath });
  assert.equal(errors.length, 0, `Expected 0 SFC parse errors, got: ${JSON.stringify(errors)}`);
  assert.ok(descriptor.scriptSetup, 'Expected <script setup> in ProductCard.vue');
  assert.ok(descriptor.template, 'Expected <template> in ProductCard.vue');

  const compiledScript = compileScript(descriptor, {
    id: 'product-card-test',
    inlineTemplate: false
  });
  const compiledTemplate = compileTemplate({
    source: descriptor.template.content,
    filename: filePath,
    id: 'product-card-test',
    compilerOptions: {
      bindingMetadata: compiledScript.bindings
    }
  });
  assert.equal(compiledTemplate.errors.length, 0, `Expected 0 template compile errors: ${JSON.stringify(compiledTemplate.errors)}`);

  const transpiled = ts.transpileModule(compiledScript.content, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022
    }
  });
  assert.ok(transpiled.outputText.includes('/product/'), 'Compiled script should construct canonical /product/{slug}/ URL');

  const templateAst = compiledTemplate.ast;
  assert.ok(templateAst, 'Expected compiled template AST');

  let buttonCount = 0;
  let hasNestedButtonInLink = false;
  let hasNestedLinkInLink = false;
  const linkTargets: string[] = [];
  const linkClickHandlers: string[] = [];
  const buttonClickHandlers: string[] = [];

  const walk = (node: any, insideLink: boolean) => {
    if (!node || typeof node !== 'object') return;
    const isNuxtLink = node.tag === 'NuxtLink';
    const isButton = node.tag === 'UiButton' || node.tag === 'button';

    if (isNuxtLink) {
      if (insideLink) {
        hasNestedLinkInLink = true;
      }
      const toProp = (node.props || []).find((p: any) => p.name === 'to' || (p.type === 7 && p.arg?.content === 'to'));
      const clickProp = (node.props || []).find((p: any) => p.type === 7 && p.name === 'on' && p.arg?.content === 'click');
      linkTargets.push(toProp?.exp?.content || toProp?.exp?.loc?.source || toProp?.value?.content || '');
      linkClickHandlers.push(clickProp?.exp?.content || clickProp?.exp?.loc?.source || '');
    }
    if (isButton) {
      buttonCount += 1;
      if (insideLink) {
        hasNestedButtonInLink = true;
      }
      const clickProp = (node.props || []).find((p: any) => p.type === 7 && p.name === 'on' && p.arg?.content === 'click');
      buttonClickHandlers.push(clickProp?.exp?.content || clickProp?.exp?.loc?.source || '');
    }

    if (Array.isArray(node.children)) {
      for (const child of node.children) {
        walk(child, insideLink || isNuxtLink);
      }
    }
  };

  walk(templateAst, false);

  const rootEl = templateAst.children.find((c) => c.type === 1 && 'tag' in c);
  assert.equal(rootEl && 'tag' in rootEl ? rootEl.tag : undefined, 'div', 'Root wrapper of ProductCard must remain a <div>, not a link');
  assert.equal(linkTargets.length, 3, `Expected 3 independent NuxtLinks (image, name, price), found ${linkTargets.length}`);
  assert.ok(linkTargets.every((target) => target.includes('productUrl')), `All 3 links must reuse productUrl, got: ${JSON.stringify(linkTargets)}`);
  assert.ok(linkClickHandlers.every((handler) => handler.includes('handleSelect')), 'All 3 links must invoke handleSelect');
  assert.equal(hasNestedLinkInLink, false, 'Links must not be nested inside each other');
  assert.equal(buttonCount, 1, 'Expected 1 independent Buy Now button');
  assert.equal(hasNestedButtonInLink, false, 'Buy Now button must NOT be nested inside a NuxtLink');
  assert.ok(buttonClickHandlers[0]?.includes('addToCart'), 'Buy Now button must retain cartStore.addToCart handler');

  const compiledTemplateFn = compileTemplate({
    source: descriptor.template.content,
    filename: filePath,
    id: 'product-card-test',
    compilerOptions: {
      mode: 'function',
      bindingMetadata: compiledScript.bindings
    }
  });
  const VueRuntime = await import('vue');
  const compiledRenderFn = new Function('Vue', compiledTemplateFn.code)(VueRuntime);

  const { formatCurrency, decodeHtmlEntities } = await import('../utils/index');
  const { Star, ShoppingCart, Package } = await import('lucide-vue-next');

  const sampleProduct = {
    id: '101',
    name: 'ASUS ROG Strix &amp; Gaming Monitor',
    slug: 'asus-rog-strix-gaming-monitor',
    brand: 'ASUS',
    rating: 4.9,
    price: 45000,
    originalPrice: 49500,
    images: ['https://example.com/monitor.webp'],
    isNew: true,
    onSale: true,
    short_description: '<p>240Hz Fast IPS panel</p>'
  };

  let selectCount = 0;
  let addToCartCount = 0;

  const TestHost = defineComponent({
    props: ['product', 'showDescription'],
    setup(props) {
      return {
        productUrl: `/product/${props.product.slug}/`,
        handleSelect: () => {
          selectCount += 1;
        },
        cartStore: {
          addToCart: () => {
            addToCartCount += 1;
          }
        },
        formatCurrency,
        decodeHtmlEntities,
        Star,
        ShoppingCart,
        Package
      };
    },
    render: compiledRenderFn
  });

  const app = createSSRApp(TestHost, {
    product: sampleProduct,
    showDescription: true
  });
  app.component('NuxtLink', defineComponent({
    props: ['to', 'ariaLabel'],
    setup(props, { slots }) {
      return () => h('a', { href: props.to, 'aria-label': props.ariaLabel }, slots.default?.());
    }
  }));
  app.component('UiButton', defineComponent({
    props: ['size', 'variant', 'title', 'ariaLabel'],
    setup(props, { slots }) {
      return () => h('button', { type: 'button', title: props.title, 'aria-label': props.ariaLabel }, slots.default?.());
    }
  }));

  const html = await renderToString(app);
  const hrefs = Array.from(html.matchAll(/href="([^"]+)"/g), (m) => m[1]!);
  assert.equal(hrefs.length, 3, `Expected 3 rendered <a> tags, got ${hrefs.length}`);
  assert.ok(hrefs.every((href) => href === '/product/asus-rog-strix-gaming-monitor/'));
  assert.ok(html.includes('<button type="button"'));
  assert.ok(html.includes('title="Buy Now"'));
  assert.ok(html.includes('aria-label="Buy Now"'));
  assert.ok(html.includes('Tk 45,000'));
  assert.ok(html.includes('Tk 49,500'));
  assert.equal(selectCount, 0);
  assert.equal(addToCartCount, 0);
});
