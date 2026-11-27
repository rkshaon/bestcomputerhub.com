// File: /tests/floating-actions.test.ts
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createSSRApp, defineComponent, computed } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { parse, compileTemplate, compileScript } from '@vue/compiler-sfc';
import * as ts from 'typescript';
import { Phone, ArrowUp } from 'lucide-vue-next';
import { STORE_CONTACT } from '../constants/contact';

function readAttrClass(node: any): string {
  if (!node || !Array.isArray(node.props)) return '';
  const classAttr = node.props.find((p: any) => p.type === 6 && p.name === 'class');
  return classAttr?.value?.content || '';
}

test('FloatingActions.vue and BackToTop.vue coordinate mobile vertical stack without overlap and preserve md+ desktop layout', async () => {
  const floatingPath = path.resolve(process.cwd(), 'components/layout/FloatingActions.vue');
  const backToTopPath = path.resolve(process.cwd(), 'components/layout/BackToTop.vue');
  const appPath = path.resolve(process.cwd(), 'app.vue');

  const [floatingSrc, backToTopSrc, appSrc] = await Promise.all([
    fs.readFile(floatingPath, 'utf8'),
    fs.readFile(backToTopPath, 'utf8'),
    fs.readFile(appPath, 'utf8')
  ]);

  // 1. app.vue mounts LayoutFloatingActions once without duplicate LayoutBackToTop
  assert.ok(appSrc.includes('<LayoutFloatingActions />'), 'app.vue must mount <LayoutFloatingActions />');
  assert.equal(appSrc.includes('<LayoutBackToTop'), false, 'app.vue must not mount a standalone <LayoutBackToTop />');

  // 2. Compile FloatingActions.vue
  const { descriptor: floatingParsed, errors: floatingErrors } = parse(floatingSrc, { filename: floatingPath });
  assert.equal(floatingErrors.length, 0, `FloatingActions parse errors: ${JSON.stringify(floatingErrors)}`);
  assert.ok(floatingParsed.scriptSetup && floatingParsed.template);

  const floatingScript = compileScript(floatingParsed, {
    id: 'floating-actions-test',
    inlineTemplate: false
  });
  const floatingTemplate = compileTemplate({
    source: floatingParsed.template.content,
    filename: floatingPath,
    id: 'floating-actions-test',
    compilerOptions: {
      bindingMetadata: floatingScript.bindings
    }
  });
  assert.equal(floatingTemplate.errors.length, 0, `FloatingActions template errors: ${JSON.stringify(floatingTemplate.errors)}`);

  const floatingTranspiled = ts.transpileModule(floatingScript.content, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 }
  });
  assert.ok(floatingTranspiled.outputText.includes('/admin'), 'FloatingActions script must check /admin routes');
  assert.ok(floatingTranspiled.outputText.includes('/login'), 'FloatingActions script must check /login routes');

  const collectElements = (node: any, results: any[] = []): any[] => {
    if (!node || typeof node !== 'object') return results;
    if (node.type === 1) {
      results.push(node);
    }
    if (Array.isArray(node.children)) {
      for (const child of node.children) collectElements(child, results);
    }
    if (Array.isArray(node.branches)) {
      for (const branch of node.branches) collectElements(branch, results);
    }
    return results;
  };

  const floatingElements = collectElements(floatingTemplate.ast);
  const floatingRoot = floatingElements[0];
  assert.ok(floatingRoot, 'Expected root element in FloatingActions.vue');
  const outerClass = readAttrClass(floatingRoot);
  assert.ok(outerClass.includes('fixed'), 'Shared mobile container must use fixed positioning');
  assert.ok(outerClass.includes('env(safe-area-inset-bottom,0px)'), 'Shared mobile container must account for safe-area-inset-bottom');
  assert.ok(outerClass.includes('bottom-[calc(5rem_+_env(safe-area-inset-bottom,0px))]'), 'Shared mobile container must sit above mobile BottomNav');
  assert.ok(outerClass.includes('flex-col'), 'Shared mobile container must stack items vertically');
  assert.ok(outerClass.includes('pointer-events-none'), 'Shared outer container must use pointer-events-none');
  assert.ok(outerClass.includes('md:contents'), 'Shared outer container must dissolve at md+ via md:contents');

  const rootDirectElements = (floatingRoot.children || []).flatMap((c: any) =>
    c.type === 1 ? [c] : c.type === 9 ? collectElements(c) : []
  );
  assert.ok(
    rootDirectElements.some((el: any) => el.tag === 'div') && rootDirectElements.some((el: any) => el.tag === 'BackToTop'),
    'Expected contact actions wrapper and BackToTop inside shared container'
  );
  const contactGroupEl = rootDirectElements.find((el: any) => el.tag === 'div');
  const contactGroupIdx = rootDirectElements.indexOf(contactGroupEl);
  const backToTopIdx = rootDirectElements.findIndex((el: any) => el.tag === 'BackToTop');
  assert.ok(contactGroupIdx < backToTopIdx, 'BackToTop must follow contact actions group in vertical stack');

  const contactGroupClass = readAttrClass(contactGroupEl);
  assert.ok(contactGroupClass.includes('pointer-events-auto'), 'Contact buttons wrapper must re-enable pointer events');
  assert.ok(contactGroupClass.includes('md:fixed') && contactGroupClass.includes('md:bottom-24') && contactGroupClass.includes('md:right-6'),
    'Desktop Call & WhatsApp group must remain independently fixed at md:bottom-24 md:right-6');
  assert.equal(floatingSrc.includes('sm:block'), false, 'Contact tooltips must align with md breakpoint, not sm');
  assert.ok(floatingSrc.includes('hidden md:block'), 'Contact tooltips must show at md+');

  // 3. Compile BackToTop.vue
  const { descriptor: backToTopParsed, errors: backToTopErrors } = parse(backToTopSrc, { filename: backToTopPath });
  assert.equal(backToTopErrors.length, 0, `BackToTop parse errors: ${JSON.stringify(backToTopErrors)}`);
  assert.ok(backToTopParsed.scriptSetup && backToTopParsed.template);

  const backToTopScript = compileScript(backToTopParsed, {
    id: 'back-to-top-test',
    inlineTemplate: false
  });
  const backToTopTemplate = compileTemplate({
    source: backToTopParsed.template.content,
    filename: backToTopPath,
    id: 'back-to-top-test',
    compilerOptions: {
      bindingMetadata: backToTopScript.bindings
    }
  });
  assert.equal(backToTopTemplate.errors.length, 0, `BackToTop template errors: ${JSON.stringify(backToTopTemplate.errors)}`);

  const backToTopTranspiled = ts.transpileModule(backToTopScript.content, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 }
  });
  assert.ok(backToTopTranspiled.outputText.includes('768'), 'BackToTop scroll threshold must switch at 768px (md)');
  assert.equal(backToTopTranspiled.outputText.includes('640'), false, 'BackToTop scroll threshold must not use 640px (sm)');

  const backToTopElements = collectElements(backToTopTemplate.ast);
  const backToTopButtonEl = backToTopElements.find((el: any) => el.tag === 'button');
  const backToTopButtonClass = readAttrClass(backToTopButtonEl);

  assert.ok(backToTopButtonClass, 'Expected <button> in BackToTop.vue');
  const mobileClasses = backToTopButtonClass.split(/\s+/);
  assert.equal(mobileClasses.includes('fixed'), false, 'BackToTop button must NOT have unconditional mobile fixed positioning');
  assert.equal(mobileClasses.includes('bottom-20'), false, 'BackToTop button must NOT hardcode bottom-20');
  assert.ok(mobileClasses.includes('md:fixed') && mobileClasses.includes('md:bottom-6') && mobileClasses.includes('md:right-6'),
    'BackToTop button must restore independent fixed positioning at md+');
  assert.ok(backToTopSrc.includes('hidden md:inline'), 'Return to Top label must align with md breakpoint');
  assert.equal(backToTopSrc.includes('sm:'), false, 'BackToTop must align all responsive utilities with md, not sm');

  // 4. SSR render verification across routes & scroll visibility
  const floatingRenderFn = new Function('Vue', compileTemplate({
    source: floatingParsed.template.content,
    filename: floatingPath,
    id: 'floating-actions-ssr',
    compilerOptions: { mode: 'function', bindingMetadata: floatingScript.bindings }
  }).code)(await import('vue'));

  const backToTopRenderFn = new Function('Vue', compileTemplate({
    source: backToTopParsed.template.content,
    filename: backToTopPath,
    id: 'back-to-top-ssr',
    compilerOptions: { mode: 'function', bindingMetadata: backToTopScript.bindings }
  }).code)(await import('vue'));

  const renderScenario = async (routePath: string, scrolled: boolean) => {
    const MockBackToTop = defineComponent({
      setup() {
        const isVisible = computed(() => !routePath.startsWith('/admin') && scrolled);
        return { isVisible, scrollToTop: () => {}, ArrowUp };
      },
      render: backToTopRenderFn
    });

    const Host = defineComponent({
      setup() {
        const isAdminRoute = computed(() => routePath.startsWith('/admin'));
        const isLoginRoute = computed(() => routePath === '/login' || routePath === '/login/');
        return {
          showFloatingContainer: computed(() => !isAdminRoute.value),
          showContactActions: computed(() => !isAdminRoute.value && !isLoginRoute.value),
          STORE_CONTACT,
          Phone,
          BackToTop: MockBackToTop
        };
      },
      render: floatingRenderFn
    });

    const app = createSSRApp(Host);
    return renderToString(app);
  };

  // Storefront unscrolled: Call + WhatsApp rendered, BackToTop absent
  const storefrontTopHtml = await renderScenario('/', false);
  assert.ok(storefrontTopHtml.includes(`tel:${STORE_CONTACT.telPhone}`));
  assert.ok(storefrontTopHtml.includes(STORE_CONTACT.whatsappLink));
  assert.equal(storefrontTopHtml.includes('aria-label="Back to Top"'), false);

  // Storefront scrolled: Call -> WhatsApp -> BackToTop in DOM order inside single shared container
  const storefrontScrolledHtml = await renderScenario('/product/test/', true);
  const callIdx = storefrontScrolledHtml.indexOf(`tel:${STORE_CONTACT.telPhone}`);
  const waIdx = storefrontScrolledHtml.indexOf(STORE_CONTACT.whatsappLink);
  const topIdx = storefrontScrolledHtml.indexOf('aria-label="Back to Top"');
  assert.ok(callIdx !== -1 && waIdx !== -1 && topIdx !== -1);
  assert.ok(callIdx < waIdx && waIdx < topIdx, 'Expected vertical stack order: Call -> WhatsApp -> Return to Top');

  // Login (/login and /login/): Call & WhatsApp hidden, BackToTop still appears when scrolled
  for (const loginRoute of ['/login', '/login/']) {
    const loginTopHtml = await renderScenario(loginRoute, false);
    assert.equal(loginTopHtml.includes(STORE_CONTACT.whatsappLink), false);
    assert.equal(loginTopHtml.includes('aria-label="Back to Top"'), false);

    const loginScrolledHtml = await renderScenario(loginRoute, true);
    assert.equal(loginScrolledHtml.includes(STORE_CONTACT.whatsappLink), false);
    assert.ok(loginScrolledHtml.includes('aria-label="Back to Top"'));
  }

  // Signup (/signup/): Contact actions + BackToTop preserved
  const signupHtml = await renderScenario('/signup/', true);
  assert.ok(signupHtml.includes(`tel:${STORE_CONTACT.telPhone}`));
  assert.ok(signupHtml.includes(STORE_CONTACT.whatsappLink));
  assert.ok(signupHtml.includes('aria-label="Back to Top"'));

  // Admin (/admin/*): All floating actions hidden
  const adminHtml = await renderScenario('/admin/products/', true);
  assert.equal(adminHtml.includes(STORE_CONTACT.whatsappLink), false);
  assert.equal(adminHtml.includes('aria-label="Back to Top"'), false);
});
