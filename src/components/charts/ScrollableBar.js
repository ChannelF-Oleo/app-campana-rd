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

  return (
    <div className="scrollable-chart">
      <div className="scrollable-chart__inner" style={{ width }}>
        <Bar data={data} options={options} />
      </div>
    </div>
  );
}

export default ScrollableBar;
