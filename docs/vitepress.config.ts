import { defineConfig } from "vitepress"

export default defineConfig({
  title: "AGS",
  description: "Documentation website of AGS",

  outDir: "./dist",
  base: "/ags/",
  lastUpdated: true,

  head: [
    ["link", { rel: "icon", href: "https://aylur.github.io/astal/icon.svg" }],
  ],

  markdown: {
    languageAlias: {
      meson: "ruby",
      blp: "c", // TODO: find a better alternative
    },
  },

  themeConfig: {
    outline: "deep",

    footer: {
      message: "Released under the GPL v3.0 License",
      copyright: "Logo is created by VDawg",
    },

    nav: [
      {
        text: "Guide",
        link: "/guide/quick-start",
        activeMatch: "/guide/",
      },
      {
        text: "References",
        items: [
          {
            text: "Gjs Guide",
            link: "https://gjs.guide/",
          },
          {
            text: "Gjs References",
            link: "https://gjs-docs.gnome.org/",
          },
          {
            text: "Astal",
            link: "https://aylur.github.io/astal/",
          },
          {
            text: "Gnim",
            link: "https://aylur.github.io/gnim/",
          },
        ],
      },
    ],

    sidebar: [
      { text: "Installation", link: "/guide/install" },
      { text: "Quick Start", link: "/guide/quick-start" },
      { text: "First Widgets", link: "/guide/first-widgets" },
      { text: "Theming", link: "/guide/theming" },
      { text: "App and CLI", link: "/guide/app-cli" },
      { text: "Utilities", link: "/guide/utilities" },
      { text: "Resources", link: "/guide/resources" },
      { text: "Intrinsics", link: "/guide/intrinsics" },
      { text: "FAQ", link: "/guide/faq" },
      { text: "Nix", link: "/guide/nix" },
      { text: "Migration Guide", link: "/guide/migration-guide" },
    ],

    socialLinks: [
      { icon: "github", link: "https://github.com/aylur/ags" },
      { icon: "discord", link: "https://discord.gg/CXQpHwDuhY" },
      {
        link: "https://ko-fi.com/aylur",
        icon: {
          svg: `<?xml version="1.0" encoding="utf-8"?><svg fill="#000000" width="800px" height="800px" viewBox="0 0 24 24" role="img" xmlns="http://www.w3.org/2000/svg"><path d="M23.881 8.948c-.773-4.085-4.859-4.593-4.859-4.593H.723c-.604 0-.679.798-.679.798s-.082 7.324-.022 11.822c.164 2.424 2.586 2.672 2.586 2.672s8.267-.023 11.966-.049c2.438-.426 2.683-2.566 2.658-3.734 4.352.24 7.422-2.831 6.649-6.916zm-11.062 3.511c-1.246 1.453-4.011 3.976-4.011 3.976s-.121.119-.31.023c-.076-.057-.108-.09-.108-.09-.443-.441-3.368-3.049-4.034-3.954-.709-.965-1.041-2.7-.091-3.71.951-1.01 3.005-1.086 4.363.407 0 0 1.565-1.782 3.468-.963 1.904.82 1.832 3.011.723 4.311zm6.173.478c-.928.116-1.682.028-1.682.028V7.284h1.77s1.971.551 1.971 2.638c0 1.913-.985 2.667-2.059 3.015z"/></svg>`,
        },
      },
    ],

    editLink: {
      pattern: "https://github.com/aylur/ags/edit/main/docs/:path",
      text: "Edit this page on GitHub",
    },

    lastUpdated: {
      text: "Last updated",
    },

    search: {
      provider: "local",
    },
  },
})
