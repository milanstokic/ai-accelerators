import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['test/unit/**/*.test.ts'],
    coverage: { include: ['src/**'], exclude: ['src/extension.ts', 'src/views/**'] },
  },
});
