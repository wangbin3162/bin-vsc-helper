import { window, commands, Uri, env } from 'vscode'
import * as fs from 'fs'
import * as path from 'path'

const vsHelp = {
  /**
   * 展示信息提示框
   *
   * @param {string} content 提示内容
   * @returns {Thenable<string>}
   */
  showInfo(content: string): Thenable<string | undefined> {
    return window.showInformationMessage(content)
  },
  /**
   * 提示信息并重启
   *
   * @param {any} content 提示内容
   * @returns {Thenable<void>}
   */
  async showInfoRestart(content: any): Thenable<void> {
    return await window.showInformationMessage(content, { title: 'Reload' }).then(async item => {
      if (!item) {
        return
      }
      await commands.executeCommand('workbench.action.reloadWindow')
    })
  },

  /**
   *
   */
  async reloadWindow() {
    await commands.executeCommand('workbench.action.reloadWindow')
  },

  /**
   * 检查文件夹是否存在
   * @param folderPath
   * @returns
   */
  checkFolder(folderPath: string): boolean {
    if (!folderPath) {
      return false
    }
    // 判断路径是否存在
    let fsStatus = fs.existsSync(path.resolve(folderPath))
    if (!fsStatus) {
      return false
    }
    // 判断是否为目录路径
    let stat = fs.statSync(folderPath)
    if (!stat.isDirectory()) {
      return false
    }

    return true
  },

  /**
   * 获取指定路径下的图片列表
   * @param pathUrl
   * @returns
   */
  getFolderImgList(pathUrl: string): string[] {
    if (!pathUrl || pathUrl === '') {
      return []
    }
    // 获取目录下的所有图片
    let files: string[] = fs.readdirSync(path.resolve(pathUrl)).filter(s => {
      return (
        s.endsWith('.png') ||
        s.endsWith('.PNG') ||
        s.endsWith('.jpg') ||
        s.endsWith('.JPG') ||
        s.endsWith('.jpeg') ||
        s.endsWith('.gif') ||
        s.endsWith('.webp') ||
        s.endsWith('.bmp') ||
        s.endsWith('.jfif')
      )
    })

    return files
  },

  /**
   * 获取文件内容
   * @param filePath
   * @returns
   */
  getFileContent(filePath: string): string {
    if (!filePath || filePath === '') {
      return ''
    }
    return fs.readFileSync(filePath, 'utf-8')
  },

  /**
   * 设置文件内容
   *
   * @private
   * @param {string} content
   */
  saveFileContent(filePath: string, content: string): void {
    fs.writeFileSync(filePath, content, 'utf-8')
  },

  /**
   * 本地图片文件转base64
   * @var mixed
   */
  imageToBase64(imagePath: string): string {
    try {
      let extname = path.extname(imagePath)
      extname = extname.substr(1)
      let base64 = fs.readFileSync(path.resolve(imagePath)).toString('base64')
      return `data:image/${extname};base64,${base64}`
    } catch (e) {
      return ''
    }
  },

  /**
   * 将本地图片路径转换为VSCode路径
   * @param ostype
   * @param imagePath
   * @returns
   */
  localImgToVsc(ostype: string, imagePath: string): string {
    // 根据操作系统类型设置路径分隔符
    var separator = ostype === 'Linux' ? '' : '/'
    // 构造VSCode路径
    var url = 'vscode-file://vscode-app' + separator + imagePath
    // 返回VSCode路径
    return Uri.parse(url).toString()
  },
}

export { vsHelp }
