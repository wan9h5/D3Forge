import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({ base: './', plugins: [react()], server: { host: '0.0.0.0', port: 4173, allowedHosts: ['terminal.local'] }, build: {rollupOptions: {output: {manualChunks: {editor: ['codemirror', '@codemirror/view', '@codemirror/state', '@codemirror/lang-javascript'], react: ['react', 'react-dom']}}}} });
