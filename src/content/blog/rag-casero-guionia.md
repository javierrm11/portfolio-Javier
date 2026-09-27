---
title: "RAG casero: cómo le enseñé a una IA a generar guiones para TikTok"
description: "Chunking, embeddings y un prompt bien afinado — la arquitectura detrás de GuionIA explicada sin humo."
pubDate: 2026-03-02
category: ia
tags: ["IA", "Next.js", "TikTok API"]
readTime: 6
cover: ./covers/rag-casero-guionia.jpg
---

GuionIA genera guiones de vídeo cortos a partir de una idea de una frase. Para que no sonaran genéricos, el modelo necesita contexto real: tendencias de TikTok, ganchos que funcionan y la duración óptima por nicho. Eso es RAG (retrieval-augmented generation), y montarlo casero es más sencillo de lo que parece.

## El problema de un prompt suelto

Un prompt directo del tipo "escribe un guion sobre fitness" produce texto correcto pero plano. Le falta lo que sabe un creador que lleva meses en la plataforma: qué gancho retiene en los primeros 2 segundos, cuánto dura cada bloque, cómo se cierra con una llamada a la acción que no suene forzada.

## Chunking: trocear antes de buscar

La base de conocimiento son transcripciones de vídeos con buen rendimiento, trozadas en fragmentos de 200-300 tokens con solapamiento de 50. Un fragmento demasiado grande diluye la relevancia de la búsqueda; uno demasiado pequeño pierde el contexto de la frase.

```ts
const chunks = splitText(transcript, { size: 250, overlap: 50 });
const embeddings = await Promise.all(chunks.map(embed));
```

## Embeddings y la búsqueda semántica

Cada fragmento se convierte en un vector y se guarda junto a metadatos (nicho, duración, gancho usado). Cuando llega una idea nueva, se busca por similitud semántica, no por palabras clave — así "rutina para principiantes" encuentra ejemplos de "cómo empezar en el gym" aunque no compartan ni una palabra.

## El prompt final

Los 4-5 fragmentos más relevantes se inyectan como contexto antes de la idea del usuario. El modelo ya no inventa desde cero: adapta patrones que de verdad funcionan en la plataforma, con la duración y el tono correctos para ese nicho.

El resultado no es un guion perfecto a la primera, pero sí uno con una base sólida — mucho más rápido de editar que uno en blanco.
