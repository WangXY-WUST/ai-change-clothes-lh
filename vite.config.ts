import { fileURLToPath, URL } from "node:url";

import { defineConfig, loadEnv } from "vite";
import vue from "@vitejs/plugin-vue";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  // 调试：打印环境变量读取情况
  const apiKey = env.ARK_API_KEY || env.VITE_ARK_API_KEY;
  console.log("🔑 API Key 状态:", apiKey ? `已读取 (前6位: ${apiKey.substring(0, 6)}...)` : "❌ 未找到");

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
              const key = env.ARK_API_KEY || env.VITE_ARK_API_KEY;
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
