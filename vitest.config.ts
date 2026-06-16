import { defineConfig } from 'vitest/config';

// 测试单独配置,不挂 vite 插件,避免与构建配置的 vite 类型实例冲突。
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
