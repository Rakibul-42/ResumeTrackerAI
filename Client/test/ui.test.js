import { before, after, test } from 'node:test';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createRenderer } from './render.js';

let renderer;
before(async () => { renderer = await createRenderer(); });
after(async () => renderer?.close());

test('authentication fields expose a label association and announced errors', async () => {
  const { AuthField, AuthErrorBanner } = await renderer.load('components/auth/AuthShell.jsx');
  const html = renderer.render(AuthField, { label: 'Email', type: 'email', value: '', onChange() {} });
  const labelId = html.match(/<label[^>]*for="([^"]+)"/)?.[1];
  assert.ok(labelId, 'the visible field label must identify its input');
  assert.ok(html.includes(`id="${labelId}"`));
  assert.match(renderer.render(AuthErrorBanner, { children: 'Please check your email.' }), /role="alert"/);
});

test('page titles are the document H1 rather than a generic greeting', async () => {
  const { PageHeader } = await renderer.load('components/layout/PageHeader.jsx');
  assert.match(renderer.render(PageHeader, { title: 'Your resumes' }), /<h1\b[^>]*>Your resumes<\/h1>/);
});

test('missing pages offer a useful destination and loading states are announced', async () => {
  const { default: NotFound } = await renderer.load('pages/NotFound.jsx');
  const html = renderer.render(MemoryRouter, { children: createElement(NotFound) });
  assert.match(html, /<h1\b[^>]*>Page not found<\/h1>/);
  assert.match(html, /href="\/"/);
  const { RouteLoading } = await renderer.load('components/layout/RouteFrame.jsx');
  assert.match(renderer.render(RouteLoading), /role="status"/);
});

test('settings profile fields are labelled and storage preferences remain accessible', async () => {
  const {default: Settings} = await renderer.load('pages/Settings.jsx');
  const {AuthContext} = await renderer.load('context/auth-hooks.js');
  const {UIProvider} = await renderer.load('context/UIContext.jsx');
  const html = renderer.render(AuthContext.Provider, {value:{user:{name:'Ada',email:'test@example.com'}},children:createElement(UIProvider,null,createElement(Settings))});
  assert.match(html, /for="profile-name"/);
  assert.match(html, /id="profile-name"/);
  assert.match(html, /for="profile-email"/);
  assert.match(html, /Storage preferences/);
});

test('icon-only buttons have names and cannot accidentally submit a form', async () => {
  const { IconButton } = await renderer.load('components/ui/IconButton.jsx');
  const html = renderer.render(IconButton, { title: 'Open search' });
  assert.match(html, /aria-label="Open search"/);
  assert.match(html, /type="button"/);
});

test('landing illustrations do not expose nonfunctional download buttons', async () => {
  const {HowItWorks} = await renderer.load('components/landing/HowItWorks.jsx');
  assert.doesNotMatch(renderer.render(HowItWorks), /<button\b/);
});

test('search uses a named modal dialog, labelled search field and explicit close control', async () => {
  const {CommandPalette} = await renderer.load('components/layout/CommandPalette.jsx');
  const client = new QueryClient({defaultOptions:{queries:{gcTime:0}}});
  const html=renderer.render(QueryClientProvider,{client,children:createElement(MemoryRouter,null,createElement(CommandPalette,{open:true,onClose(){}}))});
  assert.match(html, /<dialog\b[^>]*aria-label="Command palette"/);
  assert.match(html, /aria-modal="true"/);
  assert.match(html, /aria-label="Search resumes and pages"/);
  assert.match(html, /aria-label="Close search"/);
  assert.equal((html.match(/aria-label="Close search"/g)||[]).length,1);
  client.clear();
});

test('dashboard keeps one heading in loading and empty states',async()=>{
  const {default: Dashboard} = await renderer.load('pages/Dashboard.jsx');
  const {AuthContext} = await renderer.load('context/auth-hooks.js');
  const client = new QueryClient({defaultOptions:{queries:{gcTime:0}}});
  function renderDashboard() {
    return renderer.render(QueryClientProvider,{client,children:createElement(AuthContext.Provider,{value:{user:{name:'Ada'}}},createElement(MemoryRouter,null,createElement(Dashboard)))});
  }
  assert.equal((renderDashboard().match(/<h1\b/g)||[]).length,1);
  client.setQueryData(['dashboard'],{totals:{resumes:0}});
  assert.equal((renderDashboard().match(/<h1\b/g)||[]).length,1);
  client.clear();
});

test('card section titles follow the page heading', async () => {
  const {CardTitle} = await renderer.load('components/ui/Card.jsx');
  assert.match(renderer.render(CardTitle,{children:'Overview'}), /<h2\b/);
});

test('analytics loading states retain the page H1',async()=>{
  for (const page of ['Insights','Versions','History']) {
    const {default: Component}=await renderer.load(`pages/${page}.jsx`);
    const client=new QueryClient({defaultOptions:{queries:{gcTime:0}}});
    const html=renderer.render(QueryClientProvider,{client,children:createElement(MemoryRouter,null,createElement(Component))});
    assert.equal((html.match(/<h1\b/g)||[]).length,1,page);
    client.clear();
  }
});

test('resume detail has a visible target-role label and a heading while loading',async()=>{
  const {default: Detail}=await renderer.load('pages/ResumeDetail.jsx');
  const {UIProvider}=await renderer.load('context/UIContext.jsx');
  const client=new QueryClient({defaultOptions:{queries:{gcTime:0}}});
  const children=createElement(UIProvider,null,createElement(MemoryRouter,{initialEntries:['/resumes/test']},createElement(Routes,null,createElement(Route,{path:'/resumes/:id',element:createElement(Detail)}))));
  const render=()=>renderer.render(QueryClientProvider,{client,children});
  assert.equal((render().match(/<h1\b/g)||[]).length,1);
  client.setQueryData(['resumes','detail','test'],{resume:{_id:'test',title:'Example',updatedAt:'2026-09-18T00:00:00Z'},versions:[]});
  assert.ok(render().includes('for="target-role"'),'target role has a visible label');
  assert.ok(render().includes('id="target-role"'));
  client.clear();
});

test('tabs expose selected state and associate the active panel', async () => {
  const { Tabs, TabsList, TabsTrigger, TabsContent } = await renderer.load('components/ui/Tabs.jsx');
  const html = renderer.render(Tabs, {
    value: 'analysis', onValueChange() {},
    children: [
      createElement(TabsList, { key: 'list', 'aria-label': 'Resume views' },
        createElement(TabsTrigger, { value: 'analysis' }, 'Analysis'),
        createElement(TabsTrigger, { value: 'diff' }, 'Changes')),
      createElement(TabsContent, { key: 'panel', value: 'analysis' }, 'Score'),
    ],
  });
  assert.match(html, /role="tablist"/);
  assert.match(html, /role="tab"[^>]*aria-selected="true"/);
  assert.match(html, /role="tabpanel"[^>]*aria-labelledby="[^"]+"/);
  assert.match(html, /tabindex="-1"/);
});

test('the app shell keeps a single page H1 and offers named mobile navigation', async () => {
  const { AppShell } = await renderer.load('components/layout/AppShell.jsx');
  const { PageHeader } = await renderer.load('components/layout/PageHeader.jsx');
  const { AuthContext } = await renderer.load('context/auth-hooks.js');
  const { ThemeProvider } = await renderer.load('context/ThemeContext.jsx');
  const queryClient = new QueryClient({ defaultOptions: { queries: { gcTime: 0 } } });
  const html = renderer.render(QueryClientProvider, { client: queryClient, children:
    createElement(AuthContext.Provider, { value: { user: { name: 'Ada' }, logout() {} } },
      createElement(ThemeProvider, null, createElement(MemoryRouter, { initialEntries: ['/resumes'] },
        createElement(Routes, null, createElement(Route, { element: createElement(AppShell) },
          createElement(Route, { path: '/resumes', element: createElement(PageHeader, { title: 'Your resumes' }) })))))) });
  assert.equal((html.match(/<h1\b/g) || []).length, 1);
  assert.match(html, /<h1\b[^>]*>Your resumes<\/h1>/);
  assert.match(html, /aria-label="Mobile navigation"/);
  assert.match(html, /href="#main-content"/);
  queryClient.clear();
});

test('public navigation has real destinations and legal drafts have a single page heading', async () => {
  const { Footer } = await renderer.load('components/landing/Footer.jsx');
  const footer = renderer.render(MemoryRouter, { children: createElement(Footer) });
  const targets = Array.from(footer.matchAll(/href="([^"]*)"/g), match => match[1]);
  assert.ok(targets.every(target => target !== '' && target !== '#'), 'no placeholder links');
  for (const path of ['/privacy', '/terms', '/cookies']) assert.ok(targets.includes(path));
  const { default: Legal } = await renderer.load('pages/Legal.jsx');
  for (const slug of ['privacy', 'terms', 'cookies']) {
    const html = renderer.render(MemoryRouter, { children: createElement(Legal, { slug }) });
    assert.equal((html.match(/<h1\b/g) || []).length, 1);
    assert.match(html, /Draft policy/);
    assert.match(html, /id="main-content"/);
  }
});
