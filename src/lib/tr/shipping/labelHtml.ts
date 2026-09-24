/**
 * Printable wrapper so a browser tab never treats the etiket as raw XML/SVG.
 * Several etiketler go on one page, one per sheet, so a whole batch prints at once.
 */
export function wrapShipmentLabelsHtml(svgs: readonly string[]): string {
  const sheets = svgs
    .map((svg) => `<section class="label">${svg}</section>`)
    .join("\n");
  return `<!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8"/>
<title>Kargo etiketi</title>
<style>
  html, body { margin: 0; background: #fff; color: #111; }
  svg { display: block; max-width: 100%; height: auto; }
  .label { break-after: page; }
  .label:last-child { break-after: auto; }
</style>
</head>
<body>${sheets}</body>
</html>`;
}

export function wrapShipmentLabelHtml(svg: string): string {
  return wrapShipmentLabelsHtml([svg]);
}
