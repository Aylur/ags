import { defineConfig } from 'vitepress'

export default defineConfig({
    title: "AGS",
    description: "Documentation website of AGS",

    outDir: "./dist",
    base: "/ags/",
    lastUpdated: true,

    head: [
        ["link", { rel: "icon", href: "https://aylur.github.io/astal/icon.svg" }],
    ],

    themeConfig: {
        outline: "deep",

        nav: [
            {
                text: "Guide",
                link: "/guide/quick-start",
                activeMatch: "/guide/",
            },
            {
                text: "Astal",
                link: "https://aylur.github.io/astal/",
            },
        ],


        sidebar: [
            { text: "Quick Start", link: "/guide/quick-start" },
            { text: "Installation", link: "/guide/install" },
            { text: "Setting up a project", link: "/guide/init" },
            { text: "Bundling", link: "/guide/bundling" },
            { text: "Generating types", link: "/guide/types" },
            { text: "Astal CLI", link: "/guide/astal-cli" },
            { text: "Example", link: "/guide/example" },
            { text: "Nix", link: "/guide/nix" },
            { text: "Migration", link: "/guide/migrate" },
        ],

        socialLinks: [
            { icon: "github", link: "https://github.com/aylur/ags" },
            { icon: "discord", link: "https://discord.gg/CXQpHwDuhY" },
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
