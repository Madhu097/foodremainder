// Vercel serverless function wrapper
import('../dist/index.js').then(module => {
    module.default;
}).catch(err => {
    console.error('Failed to load server:', err);
});

export { default } from '../dist/index.js';
