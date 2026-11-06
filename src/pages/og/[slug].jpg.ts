// Imagen para redes de cada artículo (1200×630): título, categoría y la foto de
// portada. Se genera al compilar, así que no cuesta nada en cada visita. Satori
// no lee woff2: por eso Poppins va también en .ttf en src/assets/fonts/og/.
import type { APIRoute, GetStaticPaths } from 'astro';
import { getCollection, type CollectionEntry } from 'astro:content';
import fs from 'node:fs';
import path from 'node:path';
import satori from 'satori';
import sharp from 'sharp';
import { CATEGORIES } from '../../lib/blogCategories';

const ROOT = process.cwd();
const font = (file: string) => fs.readFileSync(path.join(ROOT, 'src/assets/fonts/og', file));
const fonts = [
  { name: 'Poppins', data: font('Poppins-ExtraBold.ttf'), weight: 800 as const, style: 'normal' as const },
  { name: 'Poppins', data: font('Poppins-SemiBold.ttf'), weight: 600 as const, style: 'normal' as const },
];

export const getStaticPaths = (async () =>
  (await getCollection('blog')).map((post) => ({ params: { slug: post.id }, props: { post } }))) satisfies GetStaticPaths;

// Las portadas siguen la convención covers/<slug>.jpg (ver content.config.ts).
async function coverDataUri(slug: string): Promise<string | null> {
  const file = path.join(ROOT, 'src/content/blog/covers', `${slug}.jpg`);
  if (!fs.existsSync(file)) return null;
  const buf = await sharp(file).resize(460, 630, { fit: 'cover' }).jpeg({ quality: 78 }).toBuffer();
  return `data:image/jpeg;base64,${buf.toString('base64')}`;
}

// Cuanto más largo el título, más pequeño, para que quepa en cuatro líneas.
const titleSize = (title: string) => (title.length <= 45 ? 64 : title.length <= 65 ? 54 : 46);

export const GET: APIRoute = async ({ props }) => {
  const { post } = props as { post: CollectionEntry<'blog'> };
  const cover = await coverDataUri(post.id);
  const label = CATEGORIES[post.data.category].label;

  const text = {
    type: 'div',
    props: {
      style: { display: 'flex', flexDirection: 'column', justifyContent: 'space-between', width: cover ? 740 : 1200, height: 630, padding: '60px 64px', background: '#06142a', color: '#fff', fontFamily: 'Poppins' },
      children: [
        { type: 'div', props: { style: { fontSize: 24, fontWeight: 600, color: '#4fc3ff', letterSpacing: 2, textTransform: 'uppercase' }, children: `Blog · ${label}` } },
        { type: 'div', props: { style: { fontSize: titleSize(post.data.title), fontWeight: 800, lineHeight: 1.1, letterSpacing: -1 }, children: post.data.title } },
        { type: 'div', props: { style: { fontSize: 24, fontWeight: 600, color: 'rgba(255,255,255,0.75)' }, children: 'Javier Ruiz Molero · javierm.dev' } },
      ],
    },
  };
  const children = cover
    ? [text, { type: 'img', props: { src: cover, width: 460, height: 630, style: { width: 460, height: 630, objectFit: 'cover' } } }]
    : [text];

  const svg = await satori({ type: 'div', props: { style: { display: 'flex', width: 1200, height: 630 }, children } } as never, { width: 1200, height: 630, fonts });
  const jpg = await sharp(Buffer.from(svg)).jpeg({ quality: 82, mozjpeg: true }).toBuffer();
  return new Response(new Uint8Array(jpg), { headers: { 'Content-Type': 'image/jpeg' } });
};
