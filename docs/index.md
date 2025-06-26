---
layout: home
pageClass: home-page

hero:
  name: AGS
  text: A framework for crafting Wayland Desktop Shells
  image: https://aylur.github.io/astal/icon.svg
  actions:
    - theme: brand
      text: Get Started
      link: /guide/install
    - theme: alt
      text: Resources
      link: /guide/resources

features:
  - title: Initialize projects
    details:
      With <code>ags init</code> you can initialize a project, which generates a
      basic template
  - title: Generate TypeScript types
    details:
      With <code>ags types</code> you can generate types from GObject based
      libraries
  - title: Bundle projects
    details:
      With <code>ags bundle</code> you can bundle your project into a single
      executable script
  - title: Run projects
    details:
      With <code>ags run</code> you can run projects without bundling them first
---

<!--TODO: add a few screenshots of desktops-->

<style>
:root {
  --vp-home-hero-name-color: transparent;
  --vp-home-hero-name-background: -webkit-linear-gradient(120deg, var(--vp-c-purple-3), var(--vp-c-brand-3));

  --vp-home-hero-image-background-image: linear-gradient(-45deg, var(--vp-c-purple-3), var(--vp-c-brand-3));
  --vp-home-hero-image-filter: blur(44px);
}

:root {
  --overlay-gradient: color-mix(in srgb, var(--vp-c-brand-1), transparent 55%);
}

.dark {
  --overlay-gradient: color-mix(in srgb, var(--vp-c-brand-1), transparent 85%);
}

.home-page {
  background:
    linear-gradient(215deg, var(--overlay-gradient), transparent 40%),
    radial-gradient(var(--overlay-gradient), transparent 40%) no-repeat -60vw -40vh / 105vw 200vh,
    radial-gradient(var(--overlay-gradient), transparent 65%) no-repeat 50% calc(100% + 20rem) / 60rem 30rem;

  .VPFeature code {
    background-color: var(--vp-code-line-highlight-color);
    color: var(--vp-code-color);
    padding: 2px;
    border-radius: 4px;
    padding: 3px 6px;
  }

  .VPFooter {
    background-color: transparent !important;
    border: none;
  }

  .VPNavBar:not(.top) {
    background-color: transparent !important;
    -webkit-backdrop-filter: blur(16px);
    backdrop-filter: blur(16px);

    div.divider {
      display: none;
    }
  }
}

@media (min-width: 640px) {
  :root {
    --vp-home-hero-image-filter: blur(56px);
  }
}

@media (min-width: 960px) {
  :root {
    --vp-home-hero-image-filter: blur(68px);
  }
}
</style>
