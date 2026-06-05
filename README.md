# Widget de Accesibilidad — Gobierno de Río Negro (Beta)

Widget autocontenido de accesibilidad web, desarrollado por el Ministerio de Modernización — Gobierno de Río Negro. Un solo archivo JS, sin dependencias, **genérico**: funciona en cualquier sitio sin conocer sus clases CSS.

## Instalación

Agregar una línea antes del `</body>`:

```html
<script src="accesibilidad-rn.js"></script>
```

Eso es todo. Aparece un botón flotante verde en la esquina inferior derecha.

## Configuración (opcional)

Se configura con atributos `data-*` en la misma etiqueta `<script>`:

```html
<script src="accesibilidad-rn.js"
        data-color="#005bbb"
        data-position="left"
        data-lang="es-AR"
        data-title="Accesibilidad"></script>
```

| Atributo        | Default            | Descripción                          |
|-----------------|--------------------|--------------------------------------|
| `data-color`    | `#8CC63F` (verde)  | Color de acento del botón y el panel |
| `data-position` | `right`            | Lado del botón: `right` o `left`     |
| `data-lang`     | `es-AR`            | Idioma para la lectura en voz alta   |
| `data-title`    | `Accesibilidad RN` | Título del panel                     |

## Funciones

- **Tamaño de letra** (A+ / A-)
- **Espaciado de texto** (interlineado, entre letras y palabras — WCAG 2.1 SC 1.4.12)
- **Fuente legible** (alta legibilidad / dislexia)
- **Perfiles de color**: Normal, Oscuro (baja visión), Sepia (lectura prolongada), Daltonismo, Escala de grises
- **Subrayar links**
- **Cursor grande**
- **Detener animaciones**
- **Lectura en voz alta** (seleccionar texto + play, o leer página completa)
- **Persistencia**: las preferencias se guardan en el navegador del usuario
- **Accesible por teclado**: panel navegable con Tab, activar con Enter/Espacio, cerrar con Escape

## Cómo funciona (genericidad)

Los perfiles de color se aplican sobre los hijos directos del `<body>` (y sus descendientes),
excepto la UI del propio widget. No dependen de las clases del sitio ni mueven ningún nodo del DOM,
así que funcionan en **cualquier web**: HTML estático, WordPress o SPAs (React/Next.js, Angular,
Vue). Al no reestructurar el DOM, es seguro con la hidratación de React y cubre también los
modales/portales que se montan en el body.

- **Oscuro** y **Sepia**: *override* forzado (fondo + texto + bordes). Quedan uniformes y legibles
  en páginas con colores de marca, sin franjas "al revés" ni textos con bajo contraste.
- **Daltonismo** y **Escala de grises**: filtro CSS (`hue-rotate` / `grayscale`).

## Limitaciones conocidas

- En **Daltonismo** y **Escala de grises** (que usan filtro CSS), el filtro crea un *containing
  block*: los elementos de la página con `position: fixed` pasan a comportarse como `absolute` y
  scrollean con el contenido. Oscuro y Sepia no tienen este efecto. Al volver a **Normal** todo se
  restituye. El botón del widget nunca se ve afectado.
- En **Oscuro**/**Sepia** se quitan las imágenes de fondo (`background-image`) para garantizar un
  resultado parejo; las imágenes de contenido (`<img>`) se conservan. Logos con texto oscuro sobre
  fondo transparente pueden perder contraste sobre el tema oscuro.

## Prueba rápida

Abrí `demo.html` en el navegador: es una página neutra (sin clases del Boletín) para verificar
que los perfiles, el teclado y la lectura en voz alta funcionan en una web genérica.

## Compatibilidad

- Chrome, Firefox, Edge, Safari
- Desktop y mobile
- WCAG 2.1 nivel AA (Disposición ONTI 6/2019)

## Estado

**Beta** — en uso y pruebas en el Boletín Oficial de Río Negro.

Sugerencias, mejoras o reporte de errores: cirilobustamante@gmail.com
