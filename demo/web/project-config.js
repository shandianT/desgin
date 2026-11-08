/* Project-driven branding for the department design demo.
 * The design system stays static and safe: this only changes presentation config.
 */
(function (global) {
  'use strict';

  const BUILTIN = {
    salesbuddy: {
      id: 'salesbuddy',
      name: 'SalesBuddy 销售管理',
      version: '1.2.2',
      theme: { primary: '#2863CD' },
      navigation: { desktop: ['工作台', '客户', '商机', '拜访与跟进', '任务', '经营分析'] },
      copy: { productShortName: 'SalesBuddy' }
    },
    projectbuddy: {
      id: 'projectbuddy',
      name: 'ProjectBuddy 项目小浣熊',
      version: '0.1.0',
      theme: { primary: '#7C3AED' },
      navigation: { desktop: ['工作台', '项目', '行动', '知识库', '分析'] },
      copy: { productShortName: 'ProjectBuddy' }
    }
  };

  const url = new URL(location.href);
  const requested = url.searchParams.get('project');
  const projectId = /^[a-z0-9-]{2,40}$/.test(requested || '') ? requested : 'salesbuddy';
  const root = document.documentElement;
  root.dataset.project = projectId;

  function safeConfig(value) {
    if (!value || value.id !== projectId || !value.name || !value.theme?.primary) return BUILTIN[projectId] || BUILTIN.salesbuddy;
    return value;
  }

  function setText(element, value) {
    if (element && value && element.textContent !== value) element.textContent = value;
  }

  function apply(config) {
    config = safeConfig(config);
    global.PROJECT_CONFIG = Object.freeze(config);
    document.body?.setAttribute('data-project', config.id);
    root.style.setProperty('--project-primary', config.theme.primary);
    root.style.setProperty('--ui-primary', config.theme.primary);
    root.style.setProperty('--ui-primary-hover', config.theme.primary);
    document.title = config.name + ' · 工作空间';

    document.querySelectorAll('.web-brand b, .web-brand strong, [data-project-name]').forEach((node) => {
      setText(node, config.name);
    });
    document.querySelectorAll('.web-brand-logo').forEach((image) => {
      image.alt = config.name;
    });

    const select = document.querySelector('[data-project-switcher]');
    if (select && select.value !== config.id) select.value = config.id;
  }

  function mountSwitcher() {
    if (!document.body || document.querySelector('[data-project-switcher-panel]')) return;
    const panel = document.createElement('label');
    panel.className = 'project-switcher-panel';
    panel.setAttribute('data-project-switcher-panel', '');
    panel.innerHTML = '<span>当前项目</span><select data-project-switcher aria-label="切换项目"></select>';
    const select = panel.querySelector('select');
    Object.values(BUILTIN).forEach((config) => {
      const option = document.createElement('option');
      option.value = config.id;
      option.textContent = config.name;
      select.append(option);
    });
    select.value = projectId;
    select.addEventListener('change', () => {
      const next = new URL(location.href);
      next.searchParams.set('project', select.value);
      location.assign(next.href);
    });
    document.body.append(panel);
  }

  async function load() {
    apply(BUILTIN[projectId] || BUILTIN.salesbuddy);
    mountSwitcher();
    try {
      const configURL = new URL('../projects/' + projectId + '/project.config.json', location.href);
      const response = await fetch(configURL, { cache: 'no-store' });
      if (response.ok) apply(await response.json());
    } catch (_) {
      // The built-in config keeps the preview usable when opened offline.
    }
  }

  function boot() {
    mountSwitcher();
    apply(global.PROJECT_CONFIG || BUILTIN[projectId] || BUILTIN.salesbuddy);
    new MutationObserver(() => {
      mountSwitcher();
      if (global.PROJECT_CONFIG) apply(global.PROJECT_CONFIG);
    }).observe(document.body, { childList: true, subtree: true });
    load();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})(window);
