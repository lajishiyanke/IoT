import { saveAs } from 'file-saver'
import * as XLSX from 'xlsx'

// CSV导出
export const exportCSV = (data, filename = 'export.csv') => {
  const csvContent = convertToCSV(data)
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8' })
  saveAs(blob, filename)
}

// Excel导出
export const exportExcel = (data, filename = 'export.xlsx') => {
  const ws = XLSX.utils.json_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1')
  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  saveAs(blob, filename)
}

// PDF导出
export const exportPDF = async (element, filename = 'export.pdf') => {
  const { jsPDF } = await import('jspdf')
  const { default: html2canvas } = await import('html2canvas')
  
  const canvas = await html2canvas(element)
  const imgData = canvas.toDataURL('image/png')
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'px'
  })
  
  pdf.addImage(imgData, 'PNG', 0, 0)
  pdf.save(filename)
}

// 辅助函数：转换为CSV格式
const convertToCSV = (data) => {
  if (!data || !data.length) return ''
  
  const header = Object.keys(data[0])
  const rows = data.map(item => header.map(key => item[key]))
  
  return [
    header.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n')
} 