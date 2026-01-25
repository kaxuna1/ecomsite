import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.resolve(__dirname, '..', 'dist');

const shouldRewriteSpecifier = (specifier, baseDir) => {
  if (!specifier.startsWith('.')) return null;
  if (specifier.includes('?') || specifier.includes('#')) return null;

  const ext = path.extname(specifier);
  if (ext) return null;

  const directFile = path.resolve(baseDir, `${specifier}.js`);
  if (fs.existsSync(directFile)) {
    return `${specifier}.js`;
  }

  const indexFile = path.resolve(baseDir, specifier, 'index.js');
  if (fs.existsSync(indexFile)) {
    return `${specifier.replace(/\/$/, '')}/index.js`;
  }

  return null;
};

const rewriteContent = (content, baseDir) => {
  const rewrite = (match, prefix, specifier, suffix) => {
    const updated = shouldRewriteSpecifier(specifier, baseDir);
    if (!updated) return match;
    return `${prefix}${updated}${suffix}`;
  };

  let next = content.replace(/(from\s+['"])(\.[^'"]+)(['"])/g, rewrite);
  next = next.replace(/(import\s*\(\s*['"])(\.[^'"]+)(['"]\s*\))/g, rewrite);
  return next;
};

const walk = (dir) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules') continue;
    const entryPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(entryPath);
      continue;
    }
    if (!entry.isFile() || !entry.name.endsWith('.js')) continue;

    const content = fs.readFileSync(entryPath, 'utf8');
    const updated = rewriteContent(content, path.dirname(entryPath));
    if (updated !== content) {
      fs.writeFileSync(entryPath, updated);
    }
  }
};

if (!fs.existsSync(distDir)) {
  console.error('dist directory not found. Run the build before patching imports.');
  process.exit(1);
}

walk(distDir);
