// 生成 PWA / iOS 主屏 PNG 图标。纯几何图形(深色圆角底 + 白色定位图钉),不依赖字体。
import { Resvg } from '@resvg/resvg-js';
import { writeFileSync, mkdirSync } from 'node:fs';

// 512 画布:#111827 圆角底 + 居中白色 Material "place" 图钉(带孔,evenodd)
// 图钉 24x24 原始路径,放大 12.5 倍(=300px),居中(留 ~20% 边,兼容 maskable 安全区)
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="112" fill="#111827"/>
  <g transform="translate(106,98) scale(12.5)">
    <path fill="#ffffff" fill-rule="evenodd"
      d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 0 1 0-5 2.5 2.5 0 0 1 0 5z"/>
  </g>
</svg>`;

const out = new URL('../public/', import.meta.url);
mkdirSync(out, { recursive: true });

for (const size of [180, 192, 512]) {
  const r = new Resvg(svg, { fitTo: { mode: 'width', value: size } });
  const png = r.render().asPng();
  const name = size === 180 ? 'apple-touch-icon.png' : `pwa-${size}.png`;
  writeFileSync(new URL(name, out), png);
  console.log('生成', name, `${size}x${size}`, png.length, 'bytes');
}
