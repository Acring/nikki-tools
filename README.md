# 快捷键监听工具

这是一个简单的 Python 程序，用于监听全局快捷键并触发模拟按键事件。

## 功能特点

- 监听全局快捷键组合（默认为 Ctrl+Alt+T）
- 当触发快捷键时模拟按下指定按键（默认为 Enter 键）
- 支持按 ESC 键退出程序

## 安装依赖

```bash
pip install -r requirements.txt
```

## 使用方法

1. 安装依赖包
2. 运行程序：
   ```bash
   python hotkey_listener.py
   ```
3. 程序启动后，按下 Ctrl+Alt+T 将触发模拟按下 Enter 键
4. 按 ESC 键退出程序

## 自定义设置

如果要修改快捷键组合或模拟按键，请编辑 `hotkey_listener.py` 文件：

- 修改 `COMBINATION` 变量来更改触发快捷键
- 在 `on_press` 函数中修改 `keyboard.press_and_release()` 的参数来更改模拟按键

## 注意事项

- 程序需要管理员权限才能监听全局快捷键
- 在 macOS 上可能需要授予辅助功能权限 