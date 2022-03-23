// html-based tooltip, mostly to prevent canvas from cropping
// See: https://www.chartjs.org/docs/latest/configuration/tooltip.html#external-custom-tooltips

export default function chartTooltip(tooltipModel) {
  let ele = document.getElementById('chartjs-tooltip')

  // Create element on first render
  if (!ele) {
    ele = document.createElement('div')
    ele.id = 'chartjs-tooltip'
    ele.innerHTML = '<table></table>'
    document.body.appendChild(ele)
  }

  // Hide if no tooltip
  if (tooltipModel.opacity === 0) {
    ele.style.opacity = '0'
    return
  }

  // Set caret Position
  ele.classList.remove('above', 'below', 'no-transform')
  if (tooltipModel.yAlign) {
    ele.classList.add(tooltipModel.yAlign)
  } else {
    ele.classList.add('no-transform')
  }

  function getBody(bodyItem) {
    return bodyItem.lines
  }

  // Set Text
  if (tooltipModel.body) {
    let bodyLines = tooltipModel.body.map(getBody)

    let innerHtml = '<thead>'
    innerHtml += '</thead><tbody>'

    bodyLines.forEach((body, i) => {
      let colors = tooltipModel.labelColors[i]
      let style = 'background:' + colors.backgroundColor
      style += ' border-color:' + colors.borderColor
      style += ' border-width: 2px'
      let span = '<span style="' + style + '"></span>'
      innerHtml += '<tr><td>' + span + body + '</td></tr>'
    })
    innerHtml += '</tbody>'

    let tableRoot = ele.querySelector('table')
    tableRoot.innerHTML = innerHtml
  }

  // `this` will be the overall tooltip
  let position = this._chart.canvas.getBoundingClientRect()

  // Display, position, and set styles for font
  ele.style.opacity = '1'
  ele.style.position = 'absolute'
  ele.style.left = position.left + window.pageXOffset + tooltipModel.caretX - 50 + 'px'
  ele.style.top = position.top + window.pageYOffset + tooltipModel.caretY - 35 + 'px'
  ele.style.fontFamily = tooltipModel._bodyFontFamily
  ele.style.fontSize = tooltipModel.bodyFontSize + 'px'
  ele.style.fontStyle = tooltipModel._bodyFontStyle
  ele.style.padding = tooltipModel.yPadding + 'px ' + tooltipModel.xPadding + 'px'
  ele.style.pointerEvents = 'none'
}