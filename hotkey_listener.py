from pynput import keyboard as kb
import keyboard
import time
import sys

# 定义要监听的快捷键组合（这里以 Ctrl+Alt+T 为例）
COMBINATION = {kb.Key.ctrl, kb.Key.alt, kb.KeyCode.from_char('t')}
current = set()

def on_press(key):
    try:
        print(f'按下按键: {key}')
        if key in COMBINATION:
            current.add(key)
            if all(k in current for k in COMBINATION):
                print("触发快捷键组合！")
                # 使用 keyboard 模块模拟按下 q 键
                keyboard.write('q')
    except Exception as e:
        print(f"错误: {e}")

def on_release(key):
    try:
        if key in COMBINATION:
            current.remove(key)
        # if key == kb.Key.esc:  # 按 ESC 退出程序
        #     return False
    except KeyError:
        pass

def main():
    print("快捷键监听程序已启动...")
    print("按 Ctrl+Alt+T 触发模拟按键（Enter）")
    print("按 ESC 退出程序")
    
    # 启动监听
    with kb.Listener(on_press=on_press, on_release=on_release) as listener:
        listener.join()

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n程序已退出")
        sys.exit(0) 