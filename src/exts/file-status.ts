import * as vscode from 'vscode'
import * as fs from 'fs'

// 注册一个命令，命令名为vsc.file-status
export const vscFileStatus = vscode.commands.registerCommand('vsc.file-status', uri => {
  // 获取传入的uri参数的路径，并去掉第一个字符（路径分隔符）
  const filePath = uri.path.substring(1)
  // 使用fs模块的stat方法获取文件的状态
  fs.stat(filePath, (err, stats) => {
    if (err) {
      // 如果发生错误，则弹出一个错误提示
      vscode.window.showErrorMessage(`获取文件时遇到错误了${err}!!!`)
      return
    }
    if (stats.isDirectory()) {
      // 如果获取的是文件夹，则弹出一个警告提示
      vscode.window.showWarningMessage(`检测的是文件夹，不是文件，请重新选择！！！`)
    }
    if (stats.isFile()) {
      // 如果获取的是文件，则获取文件的大小、创建时间和修改时间，并弹出一个信息提示
      const size = stats.size
      const createTime = stats.birthtime.toLocaleString()
      const modifyTime = stats.mtime.toLocaleString()

      vscode.window.showInformationMessage(
        `文件大小为${size}字节，
创建时间为${createTime}，
修改时间为${modifyTime}!!!`,
        { modal: true },
      )
    }
  })

  // 使用fs模块的statSync方法获取文件的状态
  const stats = fs.statSync(filePath)
  console.log('stats', stats)
  console.log('isFile', stats.isFile())
})
