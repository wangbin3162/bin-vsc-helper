import * as vscode from 'vscode'
import { vscFileStatus } from './exts/file-status'
import { vscPreviewSvg } from './exts/preview-svg'
import { vscQuickLog } from './exts/quick-log'

// 导出一个激活函数，当插件被激活时，这个函数会被调用
export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(vscFileStatus)
  context.subscriptions.push(vscPreviewSvg)
  context.subscriptions.push(vscQuickLog)
}

// 导出一个退出函数，当插件被退出时，这个函数会被调用
export function deactivate() {}
