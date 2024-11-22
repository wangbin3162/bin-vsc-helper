import { ExtensionContext, commands, extensions, window, StatusBarAlignment } from 'vscode'
import { vsHelp } from '../utils/vsHelp'
import { setContext } from '../utils/global'
import { PickList } from './PickList'
import ReaderViewProvider from './readerView'

// 插件入口文件
function main(context: ExtensionContext) {
  // 创建底部按钮
  let backImgBtn = window.createStatusBarItem(StatusBarAlignment.Right, -999)
  backImgBtn.text = '$(circuit-board)' // '$(file-media)'
  backImgBtn.command = 'vsc.bg.start'
  backImgBtn.tooltip = '背景图设置'
  backImgBtn.show()
  PickList.autoUpdateBackground()

  // 注册两个控制命令
  let randomCommand = commands.registerCommand('vsc.bg.refresh', () => {
    PickList.randomUpdateBackground()
  })
  let startCommand = commands.registerCommand('vsc.bg.start', () => {
    PickList.createItemList()
  })
  context.subscriptions.push(startCommand)
  context.subscriptions.push(randomCommand)

  // 监听主题变化
  window.onDidChangeActiveColorTheme(event => {
    PickList.autoUpdateBlendModel(event.kind)
  })
  // webview
  // const readerViewProvider = new ReaderViewProvider()
  // window.registerWebviewViewProvider('vsc.bg.readerView', readerViewProvider, {
  //   webviewOptions: {
  //     retainContextWhenHidden: true,
  //   },
  // })
  // commands.registerCommand('vsc.bg.refreshEntry', () => readerViewProvider.refresh())
  // commands.registerCommand('vsc.bg.home', () => readerViewProvider.home())

  // 首次打开的提示
  // let openVersion: string | undefined = context.globalState.get('ext_version')
  // let ex: Extension<any> | undefined = extensions.getExtension('wangbin.bin-vsc-helper')
  // console.log('openVersion ========>', openVersion)
  // console.log('ex ========>', ex)

  // let version: string = ex ? ex.packageJSON['version'] : ''
  // let title: string = ex ? ex.packageJSON['one_title'] : ''
  // console.log('version ========>', version)
  // console.log('title ========>', title)

  // if (openVersion !== version && title !== '') {
  //   context.globalState.update('ext_version', version)
  //   vsHelp.showInfo('🐷欢迎使用背景图插件🐷' + version)
  // }

  setContext(context)
}

export { main }
