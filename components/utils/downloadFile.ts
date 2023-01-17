
export function downloadFile(data: string, name: string, type = `text/plain`) {
  const blob = new Blob([data], {type: `${type};charset=utf-8`})
  const url = URL.createObjectURL(blob)
  const downloadLink = document.createElement('a')
  downloadLink.href = url
  downloadLink.download = name
  document.body.appendChild(downloadLink)
  downloadLink.click()
  document.body.removeChild(downloadLink)
}