#!/usr/bin/env node
/**
 * Generate PNG icons from SVG sources.
 * Run: npx @aspect-build/rules-esbuild resvg-js || npm i -g @aspect-build/rules-esbuild
 * Or:  node scripts/generate-icons.mjs  (requires @resvg/resvg-js installed)
 *
 * Alternative (macOS): open each SVG in Preview.app → Export as PNG at desired size.
 * Alternative (any OS): use https://cloudconvert.com/svg-to-png
 *
 * The placeholder PNGs checked in are solid #1e293b squares.
 * Replace them with proper renders before the first production deploy.
 */

async function main() {
  let Resvg;
  try {
    ({ Resvg } = await import('@aspect-build/resvg'));
  } catch {
    try {
      ({ Resvg } = await import('@resvg/resvg-js'));
    } catch {
      console.error(
        'Neither @resvg/resvg-js nor @aspect-build/resvg found.\n' +
          'Install one: npm install --save-dev @resvg/resvg-js\n' +
          'Or generate PNGs manually from the SVGs in public/icons/'
      );
      process.exit(1);
    }
  }

  const fs = await import('fs');
  const path = await import('path');

  const iconsDir = path.resolve(import.meta.dirname, '..', 'public', 'icons');

  for (const size of [192, 512]) {
    const svgPath = path.join(iconsDir, `icon-${size}x${size}.svg`);
    const pngPath = path.join(iconsDir, `icon-${size}x${size}.png`);
    const svg = fs.readFileSync(svgPath, 'utf-8');
    const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: size } });
    const png = resvg.render().asPng();
    fs.writeFileSync(pngPath, png);
    console.log(`Generated ${pngPath} (${png.length} bytes)`);
  }
}

main();
