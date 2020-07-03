import html from "@open-wc/rollup-plugin-html";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import { terser } from "rollup-plugin-terser";
import copy from "rollup-plugin-copy";

export default {
  input: "src/index.html",
  output: { dir: "dist", compact: true },
  plugins: [
    html(),
    commonjs(),
    resolve(),
    terser(),
    copy({
      targets: [
        { src: "src/*.css", dest: "dist" },
        { src: "src/.access", dest: "dist" },
      ],
    }),
  ],
};
