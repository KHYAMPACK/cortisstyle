/** Printable wrapper so a browser tab never treats the etiket as raw XML/SVG. */
export function wrapShipmentLabelHtml(svg: string): string {
  return `<!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8"/>
<title>Kargo etiketi</title>
<style>
  html, body { margin: 0; background: #fff; color: #111; }
  svg { display: block; max-width: 100%; height: auto; }
</style>
</head>
<body>${svg}</body>
</html>`;
}
