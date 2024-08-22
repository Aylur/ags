import pluginJs from "@eslint/js"
import stylistic from "@stylistic/eslint-plugin"

export default [
    pluginJs.configs.recommended,
    stylistic.configs.customize({
        indent: 4,
        semi: false,
        quotes: "double",
        commaDangle: "always-multiline",
    }),
]
