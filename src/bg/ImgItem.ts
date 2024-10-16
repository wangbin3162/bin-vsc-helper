import { QuickPickItem, QuickPickItemKind } from 'vscode'

// 导出一个ImgItem类，实现QuickPickItem接口
export class ImgItem implements QuickPickItem {
  // 标签
  label: string
  // 描述
  description: string | undefined
  // 图片类型
  imageType: number
  // 路径
  path?: string | undefined
  // 类型
  kind?: QuickPickItemKind | undefined

  // 构造函数，传入标签、描述、类型、路径
  constructor(label: string, description: string, type: number, path?: string | undefined) {
    this.label = label
    this.description = description
    this.imageType = type
    this.path = path
  }
}
