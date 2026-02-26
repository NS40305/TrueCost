import { defineConfig } from 'vite';

export default defineConfig({
    root: './',
    base: './', // 確保資源路徑在部署後正確
    build: {
        outDir: 'dist',
        emptyOutDir: true,
    },
    publicDir: 'public'
});
