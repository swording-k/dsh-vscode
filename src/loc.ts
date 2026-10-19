/** Localised strings for the launcher webview. */
import * as vscode from 'vscode'

const isChinese = vscode.env.language.startsWith('zh')

export const L = {
  loading: isChinese ? '正在连接 dsh web 服务…' : 'Connecting to dsh web…',
  noFolder: isChinese ? '在 VS Code 中打开一个文件夹后，这里会显示它的对话。' : 'Open a folder in VS Code to see its conversations here.',
  startFailed: isChinese ? 'dsh web 启动失败：' : 'dsh web failed to start: ',
  alignFailed: isChinese ? '工作区对齐失败：' : 'Workspace alignment failed: ',
  newConversation: isChinese ? '＋ 新建对话' : '＋ New Conversation',
  emptyList: isChinese ? '还没有对话，点上面开始。' : 'No conversations yet. Click above to start one.',
  refresh: isChinese ? '刷新列表' : 'Refresh',
  labelNew: isChinese ? '新对话' : 'New Conversation',
  labelDefault: isChinese ? '对话' : 'Conversation',
  running: isChinese ? '运行中' : 'Running',
  justNow: isChinese ? '刚刚' : 'Just now',
  minutesAgo: (n: number) => isChinese ? `${n} 分钟前` : `${n} min ago`,
  hoursAgo: (n: number) => isChinese ? `${n} 小时前` : `${n} hours ago`,
  daysAgo: (n: number) => isChinese ? `${n} 天前` : `${n} days ago`,
}