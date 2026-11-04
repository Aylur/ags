import { inject } from "@vercel/analytics"
import type { Theme } from "vitepress"
import DefaultTheme from "vitepress/theme"
import "../../vitepress.theme.css"
import "devicon/devicon.min.css"

const theme: Theme = {
  extends: DefaultTheme,
  enhanceApp() {
    inject()
  },
}

export default theme
