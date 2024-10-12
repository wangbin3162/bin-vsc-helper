import * as vscode from 'vscode'
import * as fs from 'fs'

// 注册一个命令，用于预览SVG文件
export const vscPreviewSvg = vscode.commands.registerCommand('vsc.preview-svg', () => {
  // 获取当前活动文本编辑器的路径
  const url = getActiveTextUrl()
  // 读取文件内容
  const content = fs.readFileSync(url, 'utf-8')
  // 打开webview
  openWebview(content)
})

// 获取当前活动文本编辑器的路径
function getActiveTextUrl() {
  // 获取当前活动文本编辑器
  const editor = vscode.window.activeTextEditor
  // 如果存在活动文本编辑器，则返回其文件路径，否则返回空字符串
  return editor ? editor.document.fileName : ''
}

// 定义一个函数，用于获取webview的内容
function getWebviewContent(content: string) {
  // 返回一个包含HTML、CSS和SVG内容的字符串
  return `<!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>SVG Preview</title>
      <style>
        html,
        body {
          width: 100%;
          height: 100%;
        }
        body {
          display: flex;
          justify-content: center;
          align-items: center;
        }
        svg {
          max-height: 90%;
        }
      </style>
    </head>
    <body>
      ${content}
    </body>
  </html>
  `
}

function openWebview(content: string) {
  const panel = vscode.window.createWebviewPanel(
    'SVGPreview',
    'SVG Preview',
    vscode.ViewColumn.Two,
    {},
  )
  panel.webview.html = getWebviewContent(content)
}
