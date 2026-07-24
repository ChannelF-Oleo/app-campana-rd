import React from "react";
import { Bar } from "react-chartjs-2";

/**
 * Envuelve un <Bar> de react-chartjs-2 en un contenedor con scroll horizontal.
 *
 * Cuando hay más etiquetas que `maxVisible`, el área del chart se ensancha a
 * `labels.length * minBarWidth` px (se extiende más allá del card y aparece la
 * barra de scroll horizontal, manteniendo las etiquetas legibles). Si hay pocas
 * etiquetas, el ancho es 100% y el chart llena el card sin scroll.
 *
 * El alto lo da el card contenedor (chart-card, 400px); por eso el chart debe
 * conservar maintainAspectRatio:false. El ancho lo controla este wrapper.
 *
 * TÍTULO: el título del chart se extrae de `options.plugins.title.text` y se
 * renderiza como un encabezado HTML FIJO arriba del área scrolleable (y se
 * desactiva el título interno del canvas). Si no, al ensancharse el canvas el
 * título queda centrado sobre ese ancho grande y se sale de la vista (aparecía
 * cortado a la derecha o directamente invisible en los gráficos con scroll).
 *
 * @param {object} props
 * @param {object} props.data      data de chart.js (labels + datasets)
 * @param {object} props.options   options de chart.js
 * @param {number} [props.maxVisible=8] barras visibles antes de activar scroll
 * @param {number} [props.minBarWidth=80] ancho por barra (px) al scrollear
 */
function ScrollableBar({ data, options, maxVisible = 8, minBarWidth = 80 }) {
  const count = data?.labels?.length || 0;
  const needsScroll = count > maxVisible;
  const width = needsScroll ? `${count * minBarWidth}px` : "100%";

  // Extrae el título del canvas para pintarlo como HTML fijo; desactiva el
  // título interno para que no se dibuje (y se pierda) sobre el canvas ancho.
  const titleText = options?.plugins?.title?.text;
  const chartOptions = titleText
    ? {
        ...options,
        plugins: {
          ...options.plugins,
          title: { ...options.plugins.title, display: false },
        },
      }
    : options;

  return (
    <div className="scrollable-chart-body">
      {titleText && <div className="scrollable-chart-title">{titleText}</div>}
      <div className="scrollable-chart">
        <div className="scrollable-chart__inner" style={{ width }}>
          <Bar data={data} options={chartOptions} />
        </div>
      </div>
    </div>
  );
}

export default ScrollableBar;
