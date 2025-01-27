from pynput import keyboard as kb
import keyboard
import mouse  # 添加 mouse 模块
import time
import sys
from threading import Timer
# 添加 Windows API 相关导入
import win32api
import win32con
# 替换原来的输入模块
import pydirectinput
pydirectinput.PAUSE = 0.1  # 设置按键间隔
import ctypes

# 定义要监听的快捷键组合
TRIGGER_COMBINATION = {kb.Key.cmd, kb.Key.shift, kb.KeyCode.from_char('W')}  # CMD+Shift+W 触发按键
EXIT_COMBINATION = {kb.Key.cmd, kb.Key.shift, kb.KeyCode.from_char('Q')}     # CMD+Shift+Q 退出程序
current = set()

# 添加音符映射表
NOTE_MAPPING = {
    # 右手高音部分（数字对应键盘按键）
    '1': 'q',  # do
    '2': 'w',  # re
    '3': 'e',  # mi
    '4': 'r',  # fa
    '5': 't',  # sol
    '6': 'y',  # la
    '7': 'u',  # si
    
    # 左手低音部分
    '1.': 'a',  # 低音do
    '2.': 's',  # 低音re
    '3.': 'd',  # 低音mi
    '4.': 'f',  # 低音fa
    '5.': 'g',  # 低音sol
    '6.': 'h',  # 低音la
    '7.': 'j',  # 低音si
}

def play_note(note, duration=0.5):
    """播放单个音符"""
    if note in NOTE_MAPPING:
        key = NOTE_MAPPING[note]
        keyboard.press(key)
        time.sleep(duration)
        keyboard.release(key)
        time.sleep(0.05)  # 短暂间隔防止音符重叠

def play_chord(notes, duration=0.5):
    """同时播放多个音符（和弦）"""
    keys = [NOTE_MAPPING[note] for note in notes if note in NOTE_MAPPING]
    for key in keys:
        keyboard.press(key)
    time.sleep(duration)
    for key in keys:
        keyboard.release(key)
    time.sleep(0.05)

def play_little_star():
    """弹奏小星星（带左手伴奏）"""
    # 小星星简谱（右手部分）：1 1 5 5 6 6 5 - 4 4 3 3 2 2 1 -
    # 左手伴奏：1. - 5. - | 1. - 5. - | 1. - 5. - | 1. - 5. -
    melody = [
        # 第一段
        ('1', '1.'), ('1', None), ('5', '5.'), ('5', None),
        ('6', '1.'), ('6', None), ('5', '5.'), ('-', None),
        ('4', '1.'), ('4', None), ('3', '5.'), ('3', None),
        ('2', '1.'), ('2', None), ('1', '5.'), ('-', None),
        # 重复一遍
        ('1', '1.'), ('1', None), ('5', '5.'), ('5', None),
        ('6', '1.'), ('6', None), ('5', '5.'), ('-', None),
        ('4', '1.'), ('4', None), ('3', '5.'), ('3', None),
        ('2', '1.'), ('2', None), ('1', '5.'), ('-', None)
    ]
    
    for right_hand, left_hand in melody:
        if right_hand == '-':
            time.sleep(0.5)
        else:
            # 如果左手有音符则同时弹奏，否则只弹右手
            if left_hand:
                play_chord([right_hand, left_hand], 0.5)
            else:
                play_note(right_hand, 0.5)
            time.sleep(0.1)  # 音符间短暂停顿
    
    print("小星星弹奏完成")

def delayed_key_press():
    time.sleep(3)  # 等待3秒切换窗口
    play_little_star()
    print("已执行弹奏操作")

def on_press(key):
    try:
        print(f'按下按键: {key}')
        if key in TRIGGER_COMBINATION or key in EXIT_COMBINATION:
            current.add(key)
            
            # 检查触发按键的组合
            if all(k in current for k in TRIGGER_COMBINATION):
                current.clear()
                print("请在3秒内切换到目标应用...")
                timer = Timer(3.0, delayed_key_press)
                timer.start()
                
            # 检查退出程序的组合
            if all(k in current for k in EXIT_COMBINATION):
                print("退出程序！")
                current.clear()
                return False

    except Exception as e:
        print(f"错误: {e}")

def on_release(key):
    try:
        if key in TRIGGER_COMBINATION or key in EXIT_COMBINATION:
            current.remove(key)
            if len(current) > 0:  # 如果还有未释放的按键
                current.clear()  # 清空所有按键状态
    except KeyError:
        pass

def main():
    print("快捷键监听程序已启动...")
    print("按 CMD+Shift+W 开始弹奏小星星")
    print("按 CMD+Shift+Q 退出程序")
    
    # 启动监听
    with kb.Listener(on_press=on_press, on_release=on_release) as listener:
        listener.join()

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n程序已退出")
        sys.exit(0) 