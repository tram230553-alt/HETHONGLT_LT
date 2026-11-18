import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({
    plugins: [react(), tailwindcss()],

    server: {
        port: 3000,
        strictPort: true,

        proxy: {
            "/api": {
                target: "https://localhost:7180",
                changeOrigin: true,
                secure: false,
            },
        },
    },
});