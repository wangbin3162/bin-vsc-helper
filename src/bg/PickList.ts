import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'
import { ImgItem } from './ImgItem'
import { FileDom } from './FileDom'
import { vsHelp } from '../utils/vsHelp'
import {
  QuickPick,
  QuickPickItemKind,
  workspace,
  commands,
  Uri,
  env,
  window,
  WorkspaceConfiguration,
  ConfigurationTarget,
  InputBoxOptions,
} from 'vscode'

export class PickList {
  public static itemList: PickList | undefined
  // 下拉列表
  private readonly quickPick: QuickPick<ImgItem> | any

  // 当前配置
  private config: WorkspaceConfiguration
  // 当前配置的背景图路径
  private imgPath: string
  // 当前配置的背景图透明度
  private opacity: number
  // 当前配置的背景图尺寸模式
  private sizeModel: string
  // 图片类型 1:本地文件，2：https
  private imageFileType: number
  // 当前系统标识
  private osType: number

  private _disposables: Disposable[] = []

  private constructor(config: WorkspaceConfiguration, pickList?: QuickPick<ImgItem>) {
    this.config = config
    this.imgPath = config.imagePath
    this.opacity = config.opacity
    this.sizeModel = config.sizeModel || 'cover'
    this.imageFileType = 0

    switch (os.type()) {
      case 'Windows_NT':
        this.osType = 1
        break
      case 'Darwin':
        this.osType = 2
        break
      case 'Linux':
        this.osType = 3
        break
      default:
        this.osType = 1
        break
    }

    if (pickList) {
      this.quickPick = pickList
      this.quickPick.onDidAccept((e: any) =>
        this.listChange(
          this.quickPick.selectedItems[0].imageType,
          this.quickPick.selectedItems[0].path,
        ),
      )
      this.quickPick.onDidHide(
        () => {
          this.dispose()
        },
        null,
        this._disposables,
      )
      this.quickPick.show()
    }
  }

  // 获取配置
  private static getConfig(): WorkspaceConfiguration {
    return workspace.getConfiguration('binBgConfig')
  }

  /**
   * 启动时自动更新背景
   */
  public static autoUpdateBackground() {
    // 获取配置项
    let config: WorkspaceConfiguration = this.getConfig()
    // console.log('config.imgPath ========>', config.imgPath)
    // console.log('config ========>', config.randomImageFolder, config.autoStatus)
    if (!config.randomImageFolder || !config.autoStatus) {
      return false
    }
    PickList.itemList = new PickList(config)
    // 更新PickList.itemList的背景
    PickList.itemList.autoUpdateBackground()
    // 将PickList.itemList设置为undefined
    return (PickList.itemList = undefined)
  }

  /**
   * 初始下拉列表
   */
  public static createItemList() {
    let config: WorkspaceConfiguration = this.getConfig()
    let list: QuickPick<ImgItem> = window.createQuickPick<ImgItem>()
    list.placeholder = 'Please choose configuration! / 请选择相关配置！'
    list.totalSteps = 2
    let items: ImgItem[] = [
      {
        label: '$(file-media)    Select Pictures               ',
        description: '选择一张背景图',
        imageType: 1,
      },
      {
        label: '$(file-directory)    Add Directory                ',
        description: '添加图片目录',
        imageType: 2,
      },
      {
        label: '$(settings)    Background Opacity      ',
        description: '更新图片不透明度',
        imageType: 5,
      },
      {
        label: '$(layout)    Size Mode                      ',
        description: '尺寸适应模式 / size adaptive mode',
        imageType: 15,
      },
      {
        label: '$(pencil)    Input : Path/Https          ',
        description: '输入图片路径：本地/https',
        imageType: 6,
      },
      {
        label: '$(eye-closed)    Closing Background      ',
        description: '关闭背景图',
        imageType: 7,
      },
    ]
    if (config.autoStatus) {
      items.push({
        label: '$(sync)    OFF Start Replacement  ',
        description: '关闭启动自动更换',
        imageType: 10,
      })
    } else {
      items.push({
        label: '$(sync)    ON Start Replacement   ',
        description: '开启启动自动更换',
        imageType: 11,
      })
    }
    // 更多
    items.push(
      {
        label: '',
        description: '--------------------',
        imageType: 0,
        kind: QuickPickItemKind.Separator,
      },
      {
        label: '$(github)    Github                            ',
        description: 'Github信息',
        imageType: 12,
      },
    )
    list.items = items
    list.title = '背景图设置'

    PickList.itemList = new PickList(config, list)
  }

  /**
   *  随机更新一张背景
   */
  public static randomUpdateBackground() {
    let config = this.getConfig()
    if (!config.randomImageFolder) {
      window.showWarningMessage('Please add a directory! / 请添加目录！')
      return false
    }
    PickList.itemList = new PickList(config)
    PickList.itemList.autoUpdateBackground()
    PickList.itemList = undefined
    vsHelp.reloadWindow()
  }

  /**
   * 更新图片路径
   * @param path 图片路径
   * @returns
   */
  public static updateImgPath(path: string) {
    // 检测图片地址格式
    let isUrl = path.substr(0, 8).toLowerCase() === 'https://'
    if (!isUrl) {
      vsHelp.showInfo(
        '非https格式图片，不支持配置！ / Non HTTPS format image, configuration not supported!',
      )
      return false
    }
    let config = this.getConfig()
    PickList.itemList = new PickList(config)
    PickList.itemList.setImageFileType(2)
    PickList.itemList.updateBackgound(path)
  }

  public setImageFileType(value: number) {
    this.imageFileType = value
  }

  // 列表点击事件分配
  private listChange(type: number, path?: string) {
    // console.log('type|path ========>', type, path)
    switch (type) {
      case 1:
        this.imgList() // 展示图片列表
        break
      case 2:
        this.openFieldDialog('folder') // 弹出选择文件夹对话框
        break
      case 3:
        this.openFieldDialog('file') // 弹出选择图片文件对话框
        break
      case 4:
        this.updateBackgound(path) // 选择列表内图片，更新背景css
        break
      case 5:
        this.showInputBox(2) // 更改透明度
        break
      case 6:
        this.showInputBox(1) // 输入图片路径更新背景
        break
      case 7:
        this.updateDom(true) // 关闭背景图片展示
        break
      case 8:
        vsHelp.reloadWindow() // 重新加载窗口，使设置生效
        break
      case 9:
        this.quickPick.hide() // 隐藏设置弹窗
        break
      case 10:
        this.setConfigValue('autoStatus', false, false)
        this.quickPick.hide()
        break
      case 11:
        if (!this.config.randomImageFolder) {
          window.showWarningMessage('Please add a directory! / 请添加目录后再来开启！')
        } else {
          this.setConfigValue('autoStatus', true, false)
          this.autoUpdateBackground()
        }
        this.quickPick.hide()
        break
      case 12:
        this.moreMenu()
        break
      case 13:
        this.gotoPath(path)
        break
      case 14:
        // PickList.gotoFilePath(path)
        break
      case 15:
        this.sizeModelView()
        break
      case 16:
        this.setSizeModel(path)
        break
      case 17:
        // 打开viewsContainers
        // commands.executeCommand('workbench.view.extension.backgroundCover-explorer')
        break
      default:
        break
    }
  }

  private moreMenu() {
    let items: ImgItem[] = [
      {
        label: '$(github)    Repository               ',
        description: '仓库地址',
        imageType: 13,
        path: 'https://github.com/wangbin/bin-vsc-helper',
      },
      // {
      //   label: '$(star)    Star                           ',
      //   description: '给作者点个Star吧',
      //   imageType: 13,
      //   path: 'https://github.com/wangbin/bg-extension',
      // },
    ]

    this.quickPick.items = items
    this.quickPick.show()
  }

  private gotoPath(path?: string) {
    if (path === undefined) {
      return window.showWarningMessage('无效菜单')
    }
    let tmpUri: string = path

    env.openExternal(Uri.parse(tmpUri))
  }

  // 启动时自动更新背景
  private autoUpdateBackground() {
    // console.log('autoUpdateBackground ========>')
    if (vsHelp.checkFolder(this.config.randomImageFolder)) {
      // 获取目录下的所有图片
      let files: string[] = vsHelp.getFolderImgList(this.config.randomImageFolder)
      // 是否存在图片
      if (files.length > 0) {
        // 获取一个随机路径存入数组中
        let randomFile = files[Math.floor(Math.random() * files.length)]
        let file = path.join(this.config.randomImageFolder, randomFile)
        this.listChange(4, file)
      }
    }
    return true
  }

  // 1.根据图片目录展示图片列表
  private imgList(folderPath?: string) {
    let items: ImgItem[] = [
      {
        label: '$(diff-added)  Manual selection',
        description: '选择一张背景图',
        imageType: 3,
      },
    ]

    let randomPath: any = folderPath ? folderPath : this.config.randomImageFolder
    // console.log('randomPath ========>', randomPath)
    if (vsHelp.checkFolder(randomPath)) {
      // 获取目录下的所有图片
      let files: string[] = vsHelp.getFolderImgList(randomPath)
      // 是否存在图片
      if (files.length > 0) {
        // 获取一个随机路径存入数组中
        let randomFile = files[Math.floor(Math.random() * files.length)]
        items.push({
          label: '$(light-bulb)  Random pictures',
          description: '随机自动选择       ctrl+shift+F7',
          imageType: 4,
          path: path.join(randomPath, randomFile),
        })
        items.push({
          label: '',
          description: '',
          imageType: 0,
          kind: QuickPickItemKind.Separator,
        })
        items = items.concat(
          files.map(e => new ImgItem('$(tag) ' + e, e, 4, path.join(randomPath, e))),
        )
      }
    }

    this.quickPick.items = items
    this.quickPick.show()
  }

  // 2/3.   弹出选择文件夹/图片文件对话框
  private async openFieldDialog(fileType: string) {
    let isFolders = fileType === 'folder'
    let isFiles = fileType === 'file'
    let filters = isFiles
      ? { Images: ['png', 'jpg', 'gif', 'jpeg', 'jfif', 'webp', 'bmp'] }
      : undefined

    let folderUris = await window.showOpenDialog({
      canSelectFolders: isFolders,
      canSelectFiles: isFiles,
      canSelectMany: false,
      openLabel: 'Select folder',
      filters: filters,
    })
    if (!folderUris) {
      return false
    }
    let fileUri = folderUris[0]
    if (isFolders) {
      this.setConfigValue('randomImageFolder', fileUri.fsPath, false)
      return this.imgList(fileUri.fsPath)
    }
    if (isFiles) {
      return this.setConfigValue('imagePath', fileUri.fsPath)
    }

    return false
  }

  //4. 更新配置
  public updateBackgound(path?: string) {
    if (!path) {
      return vsHelp.showInfo('Unfetched Picture Path / 未获取到图片路径')
    }
    this.setConfigValue('imagePath', path)
  }

  // 5/6. 创建一个输入框
  private showInputBox(type: number) {
    if (type <= 0 || type > 2) {
      return false
    }

    let placeString =
      type === 2
        ? 'Opacity ranges：0.00 - 1,current:(' + this.opacity + ')'
        : 'Please enter the image path to support local and HTTPS'
    let promptString = type === 2 ? '设置图片不透明度：0-1' : '请输入图片路径，支持本地及https'

    let option: InputBoxOptions = {
      ignoreFocusOut: true,
      password: false,
      placeHolder: placeString,
      prompt: promptString,
    }

    window.showInputBox(option).then(value => {
      //未输入值返回false
      if (!value) {
        window.showWarningMessage('Please enter configuration parameters / 请输入配置参数！')
        return
      }
      if (type === 1) {
        // 判断路径是否存在
        let fsStatus = fs.existsSync(path.resolve(value))
        let isUrl = value.substr(0, 8).toLowerCase() === 'https://'
        if (!fsStatus && !isUrl) {
          window.showWarningMessage(
            'No access to the file or the file does not exist! / 无权限访问文件或文件不存在！',
          )
          return false
        }
      } else {
        let isOpacity = parseFloat(value)

        if (isOpacity < 0 || isOpacity > 1 || isNaN(isOpacity)) {
          window.showWarningMessage('Opacity ranges in：0 - 1！')
          return false
        }
      }

      this.setConfigValue(
        type === 1 ? 'imagePath' : 'opacity',
        type === 1 ? value : parseFloat(value),
        true,
      )
    })
  }

  // 15. 设置填充
  private sizeModelView() {
    let items: ImgItem[] = [
      {
        label: '$(diff-ignored)    cover (default)               ',
        description: '填充(默认) ' + (this.sizeModel === 'cover' ? '$(check)' : ''),
        imageType: 16,
        path: 'cover',
      },
      {
        label: '$(layout-menubar)    repeat                            ',
        description: '平铺' + (this.sizeModel === 'repeat' ? '$(check)' : ''),
        imageType: 16,
        path: 'repeat',
      },
      {
        label: '$(diff-added)    contain                           ',
        description: '拉伸' + (this.sizeModel === 'contain' ? '$(check)' : ''),
        imageType: 16,
        path: 'contain',
      },
      {
        label: '$(diff-modified)    not(center)                     ',
        description: '无适应(居中)' + (this.sizeModel === 'not_center' ? '$(check)' : ''),
        imageType: 16,
        path: 'not_center',
      },
      {
        label: '$(layout)    not(right_bottom)          ',
        description: '无适应(右下角)' + (this.sizeModel === 'not_right_bottom' ? '$(check)' : ''),
        imageType: 16,
        path: 'not_right_bottom',
      },
      {
        label: '$(layout)    not(right_top)                ',
        description: '无适应(右上角)' + (this.sizeModel === 'not_right_top' ? '$(check)' : ''),
        imageType: 16,
        path: 'not_right_top',
      },
      {
        label: '$(layout)    not(left)                          ',
        description: '无适应(靠左)' + (this.sizeModel === 'not_left' ? '$(check)' : ''),
        imageType: 16,
        path: 'not_left',
      },
      {
        label: '$(layout)    not(right)                        ',
        description: '无适应(靠右)' + (this.sizeModel === 'not_right' ? '$(check)' : ''),
        imageType: 16,
        path: 'not_right',
      },
      {
        label: '$(layout)    not(top)                          ',
        description: '无适应(靠上)' + (this.sizeModel === 'not_top' ? '$(check)' : ''),
        imageType: 16,
        path: 'not_top',
      },
      {
        label: '$(layout)    not(bottom)                    ',
        description: '无适应(靠下)' + (this.sizeModel === 'not_bottom' ? '$(check)' : ''),
        imageType: 16,
        path: 'not_bottom',
      },
    ]

    this.quickPick.items = items
    this.quickPick.show()
  }

  private setSizeModel(value?: string) {
    if (!value) {
      return vsHelp.showInfo('No parameter value was obtained / 未获取到参数值')
    }
    this.setConfigValue('sizeModel', value, true)
  }

  // 更新配置
  private setConfigValue(name: string, value: any, updateDom: Boolean = true) {
    // console.log('name', name, 'value', value)
    // console.log('--------------------------------------------')
    // 更新变量
    this.config.update(name, value, ConfigurationTarget.Global)
    switch (name) {
      case 'opacity':
        this.opacity = value
        break
      case 'imagePath':
        this.imgPath = value
        break
      case 'sizeModel':
        this.sizeModel = value
        break
      default:
        break
    }
    // 是否需要更新Dom
    if (updateDom) {
      this.updateDom()
    }
    return true
  }

  // 更新、卸载css
  private updateDom(uninstall: boolean = false) {
    // console.log(this.imgPath, this.opacity, this.sizeModel)
    // console.log('--------------------------------------------')
    let dom: FileDom = new FileDom(this.imgPath, this.opacity, this.sizeModel)

    let result = false
    if (uninstall) {
      result = dom.uninstall()
    } else {
      if (this.osType === 1) {
        result = dom.install()
      } else if (this.osType === 2) {
        result = dom.installMac()
      } else if (this.osType === 3) {
        result = dom.install() // 暂未做对应处理
      }
    }
    if (result) {
      if (this.quickPick) {
        this.quickPick.placeholder = 'Reloading takes effect? / 重新加载生效？'
        this.quickPick.items = [
          {
            label: '$(check)   YES',
            description: '立即重新加载窗口生效',
            imageType: 8,
          },
          { label: '$(x)   NO', description: '稍后手动重启', imageType: 9 },
        ]
        this.quickPick.ignoreFocusOut = true
        this.quickPick.show()
      } else {
        // 通过在线图库更新提示弹窗
        if (this.imageFileType === 2) {
          // 弹出提示框确认是否重启
          window
            .showInformationMessage(
              '"' + this.imgPath + '"' + ' | Reloading takes effect? / 重新加载生效？',
              'YES',
              'NO',
            )
            .then(value => {
              if (value === 'YES') {
                vsHelp.reloadWindow()
              }
            })
        }
      }
    }
  }

  //释放资源
  private dispose() {
    PickList.itemList = undefined
    // Clean up our resources
    this.quickPick.hide()

    while (this._disposables.length) {
      const x = this._disposables.pop()
      if (x) {
        // @ts-ignore
        x.dispose()
      }
    }
  }
}
