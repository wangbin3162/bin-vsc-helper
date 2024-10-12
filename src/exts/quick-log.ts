import * as vscode from 'vscode'

export const vscQuickLog = vscode.commands.registerCommand('vsc.quick-log', () => {
  const editor = vscode.window.activeTextEditor
  if (!editor) {
    vscode.window.showErrorMessage('No active editor!')
    return
  }
  const reg = /(\S+)$/
  // 获取当前编辑器的选中和文档
  const { selection, document } = editor
  const text = editor.document.getText(selection)
  // 获取当前选中的单词位置
  const position = document.getWordRangeAtPosition(selection.anchor, reg)

  // 如果没有匹配到，则提示用户
  if (!position) {
    // 获取光标位置
    const position = editor.selection.active
    // 插入新的一行代码
    editor.edit(editBuilder => {
      // 在光标位置插入一行代码
      editBuilder.insert(position, `console.log('--------------------------------------------')`)
    })
    return
  }

  const docText = document.getText(position)
  const tempArr = reg.exec(docText)
  const prefix = tempArr && tempArr[1]

  const replaceText = `console.log('${prefix} ========>', ${prefix})`

  editor
    .edit(edit => {
      edit.replace(position, replaceText)
    })
    .then(() => {
      const line = position.start.line
      const index = document.lineAt(line).firstNonWhitespaceCharacterIndex

      editor.selection = new vscode.Selection(
        new vscode.Position(line, replaceText.length + index),
        new vscode.Position(line, replaceText.length + index),
      )
    })
})
