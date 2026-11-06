// RSS del blog: para seguirlo desde Feedly, Inoreader y agregadores de noticias.
import rss from '@astrojs/rss';
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { CATEGORIES } from '../lib/blogCategories';

export const GET: APIRoute = async (context) => {
  const posts = (await getCollection('blog')).sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
  return rss({
    title: 'Blog de Javier Ruiz Molero',
    description: 'Desarrollo web, IA y automatización para empresas pequeñas: casos reales, precios y guías prácticas.',
    site: context.site ?? 'https://www.javierm.dev',
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.pubDate,
      link: `/blog/${post.id}/`,
      categories: [CATEGORIES[post.data.category].label, ...post.data.tags],
      author: `javiermdevweb@gmail.com (${post.data.author})`,
    })),
    customData: '<language>es-es</language>',
  });
};
