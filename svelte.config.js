import adapter from 'svelte-adapter-uws';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  kit: {
    adapter: adapter({ websocket: true }),
    experimental: {
      remoteFunctions: true
    }
  },
  vitePlugin: {
    dynamicCompileOptions: ({ filename }) =>
      filename.includes('node_modules') ? undefined : { runes: true }
  },
  compilerOptions: {
    experimental: {
      async: true
    }
  }
};

export default config;
