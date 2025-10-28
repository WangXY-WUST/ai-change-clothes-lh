import { fileURLToPath, URL } from "node:url";
import config from "./public/config.js";

import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // 调试：打印环境变量读取情况
  const key = config.ARK_API_KEY;

  return {
    plugins: [vue()],
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
    server: {
      proxy: {
        "/api/seedream": {
          target: "https://ark.cn-beijing.volces.com",
          changeOrigin: true,
          secure: true,
          rewrite: (path) => path.replace(/^\/api\/seedream$/, "/api/v3/images/generations"),
          configure: (proxy) => {
            proxy.on("proxyReq", (proxyReq, req, res) => {
              if (key) {
                proxyReq.setHeader("Authorization", `Bearer ${key}`);
                console.log("✅ 已添加 Authorization 头");
                console.log("🔍 请求头:", proxyReq.getHeaders());
              } else {
                console.error("❌ 未找到 API Key，请求将失败");
              }
              proxyReq.setHeader("Content-Type", "application/json");
            });

            proxy.on("proxyRes", (proxyRes, req, res) => {
              console.log(`📡 代理响应状态: ${proxyRes.statusCode}`);
              if (proxyRes.statusCode !== 200) {
                console.log("🔍 响应头:", proxyRes.headers);
              }
            });

            proxy.on("error", (err, req, res) => {
              console.error("🚨 代理错误:", err);
            });
          },
        },
      },
    },
  };
});
