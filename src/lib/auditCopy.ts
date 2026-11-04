// Traducción a lenguaje claro de las auditorías de Lighthouse: Google las nombra
// para desarrolladores ("Árbol de dependencia de red") y el informe lo lee el
// dueño de una empresa. Están las de Lighthouse 13, que es el que usa PageSpeed,
// y sus equivalentes de la 12 con otro nombre. La que no esté aquí sale con el
// título y la descripción de Google (ver summarizeFindings en pageSpeed.ts).
export interface AuditCopy {
  title: string;
  why: string;
  fix: string;
  /** Solo si Google lo trata como algo que impide aparecer o usar la web. */
  severity?: 'error';
}

const images: AuditCopy = {
  title: 'Las imágenes pesan más de lo necesario',
  why: 'Se descargan imágenes más grandes o peor comprimidas de lo que hace falta. Suele ser lo que más retrasa la carga.',
  fix: 'Convertirlas a WebP o AVIF y servir un tamaño distinto para cada pantalla.',
};
const blocking: AuditCopy = {
  title: 'Hay archivos que bloquean la carga',
  why: 'El navegador espera a estos archivos antes de pintar nada, así que tu cliente ve la pantalla en blanco más tiempo.',
  fix: 'Cargar después los estilos y scripts que no hacen falta al principio.',
};
const legacyJs: AuditCopy = {
  title: 'Se envía JavaScript antiguo a navegadores modernos',
  why: 'Es código pensado para navegadores viejos: los actuales no lo necesitan y aun así tienen que descargarlo.',
  fix: 'Actualizar la configuración de compilación o los plugins que lo añaden.',
};
const cache: AuditCopy = {
  title: 'Los archivos no se guardan en caché el tiempo suficiente',
  why: 'Quien vuelve a tu web tiene que descargar otra vez imágenes y scripts que ya tenía.',
  fix: 'Configurar en el servidor una caché larga para los archivos estáticos.',
};
const serverLatency: AuditCopy = {
  title: 'El servidor tarda en entregar la página',
  why: 'Antes de mostrar nada, el navegador espera a que responda tu servidor, y esa espera retrasa todo lo demás.',
  fix: 'Revisar el alojamiento, activar la caché de páginas y evitar redirecciones innecesarias.',
};
const fonts: AuditCopy = {
  title: 'Las fuentes retrasan la lectura del texto',
  why: 'Mientras carga una fuente, el texto puede quedarse invisible y parece que la página no ha terminado.',
  fix: 'Mostrar primero una fuente del sistema con font-display: swap.',
};
const layoutShift: AuditCopy = {
  title: 'El contenido se mueve mientras carga',
  why: 'Si un botón se desplaza justo antes de pulsarlo, tu cliente toca donde no quería.',
  fix: 'Reservar el espacio de imágenes y banners antes de que carguen.',
};
const thirdParties: AuditCopy = {
  title: 'Los servicios externos frenan la página',
  why: 'Chats, píxeles de publicidad y vídeos incrustados cargan su propio código, y no controlas lo que tardan.',
  fix: 'Quitar los que no uses y cargar el resto cuando hagan falta.',
};
const duplicatedJs: AuditCopy = {
  title: 'Hay código JavaScript duplicado',
  why: 'La misma librería se descarga más de una vez, normalmente porque la traen dos plugins distintos.',
  fix: 'Dejar una sola copia y revisar qué plugins la incluyen.',
};
const domSize: AuditCopy = {
  title: 'La página tiene demasiados elementos',
  why: 'Cuantos más elementos hay, más le cuesta al móvil dibujarla y más lenta responde.',
  fix: 'Simplificar la estructura, algo habitual en webs hechas con constructores visuales.',
};
const oldHttp: AuditCopy = {
  title: 'El servidor usa una versión antigua de HTTP',
  why: 'Con HTTP/2 o HTTP/3 los archivos se descargan a la vez y la web carga antes.',
  fix: 'Activarlo en el alojamiento o usar una red de distribución de contenidos (CDN).',
};
const unminified: AuditCopy = {
  title: 'Hay archivos de código sin minificar',
  why: 'Ocupan más de lo necesario porque llevan espacios y comentarios que el navegador no necesita.',
  fix: 'Minificarlos al publicar la web, o con un plugin de optimización.',
};

const ariaMisused: AuditCopy = {
  title: 'Hay indicaciones para lectores de pantalla mal configuradas',
  why: 'Los atributos ARIA son lo que oye quien usa un lector de pantalla. Si están mal, le dan información incorrecta.',
  fix: 'Revisar los elementos que señala Google y corregir o quitar esos atributos.',
};

export const AUDIT_COPY: Record<string, AuditCopy> = {
  // Velocidad
  'image-delivery-insight': images,
  'uses-responsive-images': images,
  'modern-image-formats': images,
  'uses-optimized-images': images,
  'offscreen-images': images,
  'render-blocking-insight': blocking,
  'render-blocking-resources': blocking,
  'legacy-javascript-insight': legacyJs,
  'legacy-javascript': legacyJs,
  'cache-insight': cache,
  'uses-long-cache-ttl': cache,
  'document-latency-insight': serverLatency,
  'server-response-time': serverLatency,
  'font-display-insight': fonts,
  'font-display': fonts,
  'cls-culprits-insight': layoutShift,
  'layout-shifts': layoutShift,
  'third-parties-insight': thirdParties,
  'third-party-summary': thirdParties,
  'duplicated-javascript-insight': duplicatedJs,
  'duplicated-javascript': duplicatedJs,
  'dom-size-insight': domSize,
  'dom-size': domSize,
  'modern-http-insight': oldHttp,
  'uses-http2': oldHttp,
  'unminified-javascript': unminified,
  'unminified-css': unminified,
  'unused-javascript': {
    title: 'Se carga JavaScript que no se usa',
    why: 'Cada plugin o widget suma código que el dispositivo tiene que procesar, aunque esa página no lo necesite.',
    fix: 'Quitar los plugins que sobran y cargar cada script solo donde se use.',
  },
  'unused-css-rules': {
    title: 'Se cargan estilos que no se usan',
    why: 'El navegador descarga y procesa reglas de diseño que esta página no necesita, a menudo de plantillas y plugins.',
    fix: 'Eliminar el CSS que sobra y cargar solo el de cada página.',
  },
  'bootup-time': {
    title: 'El JavaScript tarda mucho en ejecutarse',
    why: 'Mientras se ejecuta, la página no responde: tu cliente toca y no pasa nada.',
    fix: 'Reducir plugins y scripts, y cargar por partes el código que quede.',
  },
  'total-byte-weight': {
    title: 'La página pesa demasiado',
    why: 'Todo lo que hay que descargar gasta tiempo y datos, sobre todo en una conexión móvil.',
    fix: 'Empezar por las imágenes y los vídeos, que suelen ser la mayor parte del peso.',
  },
  'uses-text-compression': {
    title: 'Los archivos de texto no van comprimidos',
    why: 'El código de la página podría ocupar mucho menos sin perder nada.',
    fix: 'Activar la compresión Gzip o Brotli en el servidor.',
  },

  // SEO
  'link-text': {
    title: 'Hay enlaces sin texto descriptivo',
    why: 'Un «pincha aquí» no le dice a Google ni a tus visitantes adónde lleva.',
    fix: 'Escribir en el enlace de qué trata la página de destino.',
  },
  'crawlable-anchors': {
    title: 'Hay enlaces que Google no puede seguir',
    why: 'Si un enlace no tiene una dirección de verdad, Google no llega a las páginas que hay detrás.',
    fix: 'Usar enlaces normales con su dirección en href.',
  },
  hreflang: {
    title: 'Las versiones por idioma están mal indicadas',
    why: 'Google puede enseñar la página en un idioma que no corresponde a quien busca.',
    fix: 'Corregir las etiquetas hreflang de cada idioma.',
  },
  'is-crawlable': {
    title: 'Le estás pidiendo a Google que no muestre esta página',
    why: 'Mientras esté esa instrucción, no aparecerá en los resultados de búsqueda.',
    fix: 'Quitar la instrucción «noindex» de la página o de la configuración de tu gestor de contenidos.',
    severity: 'error',
  },
  'document-title': {
    title: 'Falta el título de la página',
    why: 'Es el titular que Google enseña en sus resultados. Sin él, escoge uno por su cuenta.',
    fix: 'Escribir un título que diga qué haces y dónde, de unos 60 caracteres.',
    severity: 'error',
  },
  'meta-description': {
    title: 'Google no encuentra la descripción de la página',
    why: 'Es el texto que suele salir bajo el título en Google, y ayuda a decidir si alguien hace clic.',
    fix: 'Escribir una frase de 70 a 160 caracteres y comprobar que esté dentro del <head>.',
  },
  canonical: {
    title: 'La dirección principal (canonical) no es válida',
    why: 'Google puede no saber cuál es la versión buena de la página.',
    fix: 'Poner en la etiqueta canonical la dirección completa de la página.',
  },
  'robots-txt': {
    title: 'Tu robots.txt tiene errores',
    why: 'Es el archivo que le dice a Google qué rastrear. Si está mal, puede ignorarlo o dejar páginas sin ver.',
    fix: 'Corregir las líneas que señala Google o volver a un archivo sencillo.',
  },
  'http-status-code': {
    title: 'La página responde con un error',
    why: 'Si Google recibe un error, no mostrará la página en sus resultados.',
    fix: 'Comprobar que la dirección es correcta y que la página sigue publicada.',
    severity: 'error',
  },

  // Accesibilidad
  'color-contrast': {
    title: 'Hay textos con poco contraste',
    why: 'Cuestan de leer, sobre todo en el móvil y a plena luz.',
    fix: 'Oscurecer el texto o aclarar el fondo.',
  },
  'image-alt': {
    title: 'Hay imágenes sin texto alternativo',
    why: 'Quien usa un lector de pantalla no sabe qué muestran, y Google tampoco.',
    fix: 'Describir cada imagen importante en una frase corta.',
  },
  'svg-img-alt': {
    title: 'Hay gráficos sin texto alternativo',
    why: 'Quien usa un lector de pantalla no sabe qué muestra ese icono o dibujo.',
    fix: 'Añadirle una descripción corta, o marcarlo como decorativo si no aporta nada.',
  },
  'image-redundant-alt': {
    title: 'Hay imágenes que repiten el texto de al lado',
    why: 'Un lector de pantalla lee lo mismo dos veces, y eso cansa a quien lo usa.',
    fix: 'Escribir un texto alternativo distinto, o dejarlo vacío si la imagen es decorativa.',
  },
  'link-name': {
    title: 'Hay enlaces sin texto reconocible',
    why: 'Un lector de pantalla solo dice «enlace», sin explicar adónde lleva. Pasa mucho con los enlaces de iconos.',
    fix: 'Añadir un texto o una etiqueta a cada enlace.',
  },
  'button-name': {
    title: 'Hay botones sin nombre',
    why: 'Quien usa un lector de pantalla no sabe qué hace ese botón.',
    fix: 'Añadir un texto o una etiqueta a cada botón.',
  },
  label: {
    title: 'Hay campos de formulario sin etiqueta',
    why: 'Quien usa un lector de pantalla no sabe qué tiene que escribir en cada campo, y eso le impide escribirte.',
    fix: 'Asociar una etiqueta a cada campo del formulario.',
  },
  'select-name': {
    title: 'Hay desplegables sin etiqueta',
    why: 'Quien usa un lector de pantalla no sabe qué está eligiendo.',
    fix: 'Asociar una etiqueta a cada desplegable.',
  },
  'heading-order': {
    title: 'Los encabezados se saltan niveles',
    why: 'Quien navega con un lector de pantalla se orienta por los títulos, y saltarse niveles lo confunde.',
    fix: 'Ordenar los títulos sin saltos: H1, H2, H3…',
  },
  'target-size': {
    title: 'Hay botones o enlaces demasiado pequeños',
    why: 'En el móvil cuesta acertar con el dedo y se acaba tocando lo que no era.',
    fix: 'Hacerlos más grandes o separarlos más entre sí.',
  },
  'meta-viewport': {
    title: 'No deja hacer zoom en el móvil',
    why: 'Quien ve mal no puede ampliar la página para leerla.',
    fix: 'Quitar user-scalable=no y maximum-scale de la etiqueta viewport.',
  },
  tabindex: {
    title: 'El orden al navegar con el teclado está forzado',
    why: 'Quien usa el teclado salta por la página en un orden que no se corresponde con lo que ve.',
    fix: 'Quitar los valores de tabindex mayores que 0.',
  },
  'frame-title': {
    title: 'Hay contenidos incrustados sin título',
    why: 'Mapas o vídeos incrustados se anuncian sin explicar qué son.',
    fix: 'Añadir un título a cada iframe.',
  },
  'link-in-text-block': {
    title: 'Los enlaces solo se distinguen por el color',
    why: 'Quien no distingue bien los colores no los ve dentro del texto.',
    fix: 'Subrayarlos o marcarlos de otra forma además del color.',
  },
  'html-has-lang': {
    title: 'No indica en qué idioma está',
    why: 'Un lector de pantalla puede leer el texto con la pronunciación equivocada.',
    fix: 'Añadir el idioma en la etiqueta <html>, por ejemplo lang="es".',
  },
  'aria-allowed-attr': ariaMisused,
  'aria-allowed-role': ariaMisused,
  'aria-hidden-body': ariaMisused,
  'aria-hidden-focus': ariaMisused,
  'aria-prohibited-attr': ariaMisused,
  'aria-required-attr': ariaMisused,
  'aria-required-children': ariaMisused,
  'aria-required-parent': ariaMisused,
  'aria-roles': ariaMisused,
  'aria-valid-attr': ariaMisused,
  'aria-valid-attr-value': ariaMisused,

  // Buenas prácticas
  'is-on-https': {
    title: 'No usa conexión segura (HTTPS)',
    why: 'Los navegadores avisan a tus visitantes de que la web no es segura.',
    fix: 'Instalar un certificado en el alojamiento: la mayoría los ofrece gratis.',
    severity: 'error',
  },
  'redirects-http': {
    title: 'La versión sin HTTPS no redirige a la segura',
    why: 'Quien entre por http:// se queda en la versión no segura.',
    fix: 'Configurar en el servidor una redirección permanente a https://.',
  },
  'errors-in-console': {
    title: 'La página da errores al cargar',
    why: 'Son fallos de código que no siempre se notan a simple vista, pero pueden romper formularios o botones.',
    fix: 'Abrir la consola del navegador y corregir los errores que aparecen.',
  },
  'image-aspect-ratio': {
    title: 'Hay imágenes deformadas',
    why: 'Se ven estiradas o aplastadas, y eso da imagen de descuido.',
    fix: 'Respetar la proporción original de cada imagen.',
  },
  'image-size-responsive': {
    title: 'Hay imágenes que se ven borrosas',
    why: 'Tienen menos resolución de la que necesita el espacio que ocupan.',
    fix: 'Subirlas a mayor tamaño y servir una versión adecuada para cada pantalla.',
  },
  'font-size': {
    title: 'Hay textos demasiado pequeños',
    why: 'En el móvil obligan a ampliar la página para poder leer.',
    fix: 'Usar al menos 16 píxeles para el texto principal.',
  },
  deprecations: {
    title: 'Usa funciones del navegador que van a desaparecer',
    why: 'Lo que hoy funciona puede dejar de hacerlo en una actualización de Chrome.',
    fix: 'Actualizar el código o los plugins que las usan.',
  },
  'third-party-cookies': {
    title: 'Usa cookies de terceros',
    why: 'Los navegadores las restringen cada vez más, y lo que dependa de ellas puede dejar de funcionar.',
    fix: 'Revisar qué servicios externos las ponen y si puedes prescindir de ellos.',
  },
  'valid-source-maps': {
    title: 'Falta información para localizar errores en el código',
    why: 'No afecta a tus clientes, pero hace más difícil encontrar y arreglar fallos.',
    fix: 'Que quien desarrolla la web genere los mapas de origen (source maps).',
  },
  'inspector-issues': {
    title: 'Chrome ha detectado problemas en la página',
    why: 'Suelen ser avisos sobre cookies, seguridad o funciones que el navegador no admite.',
    fix: 'Revisar el panel «Issues» de las herramientas de desarrollo de Chrome.',
  },
  'paste-preventing-inputs': {
    title: 'No deja pegar texto en algunos campos',
    why: 'Obliga a teclearlo todo, y dificulta usar un gestor de contraseñas.',
    fix: 'Quitar el bloqueo de pegar en esos campos.',
  },
  'geolocation-on-start': {
    title: 'Pide la ubicación nada más entrar',
    why: 'Sin saber por qué se la piden, la mayoría de la gente rechaza el permiso y desconfía.',
    fix: 'Pedirla solo cuando la persona vaya a usar esa función.',
  },
  'notification-on-start': {
    title: 'Pide permiso para enviar avisos nada más entrar',
    why: 'Sin saber por qué se lo piden, la mayoría de la gente lo rechaza y desconfía.',
    fix: 'Pedirlo solo después de una acción de la persona.',
  },
  doctype: {
    title: 'Falta declarar el tipo de documento',
    why: 'Sin esa primera línea, los navegadores pueden mostrar la página de forma extraña.',
    fix: 'Poner <!doctype html> al principio de la página.',
  },
  charset: {
    title: 'No indica bien la codificación del texto',
    why: 'Las tildes y las eñes pueden verse como símbolos raros.',
    fix: 'Añadir <meta charset="utf-8"> al principio de la cabecera.',
  },
};

// Auditorías de Google que coinciden con una comprobación nuestra (siteAudit.ts).
// Si nosotros ya la señalamos, no se repite. Si nosotros la damos por buena y
// Google no, gana Google, que renderiza la página como un navegador de verdad.
export const OWN_CHECK_BY_AUDIT: Record<string, string> = {
  'document-title': 'title',
  'meta-description': 'description',
  'is-crawlable': 'noindex',
  'robots-txt': 'robots',
  canonical: 'canonical',
  'http-status-code': 'status',
  'image-alt': 'alt',
  'html-has-lang': 'lang',
  viewport: 'viewport',
  'is-on-https': 'https',
  'redirects-http': 'https-redirect',
};
