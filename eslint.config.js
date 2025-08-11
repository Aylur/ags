import eslint from "@eslint/js"
import tseslint from "typescript-eslint"

export default tseslint.config({
    extends: [eslint.configs.recommended, ...tseslint.configs.recommended],
    rules: {
        "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
        "@typescript-eslint/no-explicit-any": "off",
    },
})
