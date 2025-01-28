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

# 添加音乐相关的常量和配置
TEMPO = 120  # 默认速度，每分钟120拍
BEAT_DURATION = 60.0 / TEMPO  # 一拍的持续时间（秒）

# 音符时值映射（以一拍为基准）
NOTE_DURATION = {
    '1': 4.0,    # 全音符 = 4拍
    '2': 2.0,    # 半音符 = 2拍
    '4': 1.0,    # 四分音符 = 1拍
    '8': 0.5,    # 八分音符 = 1/2拍
    '16': 0.25,  # 十六分音符 = 1/4拍
}

# 在 NOTE_MAPPING 后添加新的常量
SONG_SELECTION = 1  # 1 代表小星星，2 代表恭喜发财

class Note:
    def __init__(self, pitch, duration='4', is_dot=False, is_rest=False):
        """
        初始化音符
        :param pitch: 音高（1-7或休止符'-'）
        :param duration: 时值（'1', '2', '4', '8', '16'）
        :param is_dot: 是否为附点音符
        :param is_rest: 是否为休止符
        """
        self.pitch = pitch
        self.duration = duration
        self.is_dot = is_dot
        self.is_rest = is_rest or pitch == '-'
    
    def get_duration(self, tempo=TEMPO):
        """计算音符实际持续时间（秒）"""
        base_duration = NOTE_DURATION[self.duration] * (60.0 / tempo)
        if self.is_dot:
            base_duration *= 1.5
        return base_duration

class MusicPlayer:
    def __init__(self, tempo=TEMPO):
        self.tempo = tempo
    
    def play_note(self, note, accompaniment=None):
        """
        播放单个音符
        :param note: Note对象
        :param accompaniment: 伴奏音符（Note对象）
        """
        duration = note.get_duration(self.tempo)
        
        if note.is_rest:
            time.sleep(duration)
            return
            
        if accompaniment and not accompaniment.is_rest:
            # 同时播放主旋律和伴奏
            play_chord([note.pitch, accompaniment.pitch], duration)
        else:
            # 只播放主旋律
            key = NOTE_MAPPING[note.pitch]
            keyboard.press(key)
            time.sleep(duration)
            keyboard.release(key)
        
        time.sleep(0.05)  # 短暂间隔防止音符重叠

    def play_music(self, melody, accompaniment=None):
        """
        播放完整乐曲
        :param melody: 主旋律音符列表
        :param accompaniment: 伴奏音符列表（可选）
        """
        for i, note in enumerate(melody):
            acc_note = accompaniment[i] if accompaniment and i < len(accompaniment) else None
            self.play_note(note, acc_note)

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
    """使用新的音乐系统弹奏小星星"""
    player = MusicPlayer(tempo=120)  # 设置速度为120拍/分钟
    
    # 主旋律（右手）- 根据谱子重写
    melody = [
        Note('1', '4'), Note('1', '4'), Note('5', '4'), Note('5', '4'),
        Note('6', '4'), Note('6', '4'), Note('5', '2'),
        Note('4', '4'), Note('4', '4'), Note('3', '4'), Note('3', '4'),
        Note('2', '4'), Note('2', '4'), Note('1', '2'),
        Note('5', '4'), Note('5', '4'), Note('4', '4'), Note('4', '4'),
        Note('3', '4'), Note('3', '4'), Note('2', '2'),
        Note('5', '4'), Note('5', '4'), Note('4', '4'), Note('4', '4'),
        Note('3', '4'), Note('3', '4'), Note('2', '2'),
        Note('1', '4'), Note('1', '4'), Note('5', '4'), Note('5', '4'),
        Note('6', '4'), Note('6', '4'), Note('5', '2'),
        Note('4', '4'), Note('4', '4'), Note('3', '4'), Note('3', '4'),
        Note('2', '4'), Note('2', '4'), Note('1', '2')
    ]
    
    # 左手伴奏 - 根据谱子重写
    accompaniment = [
        Note('1.', '4'), Note('5.', '4'), Note('3.', '4'), Note('5.', '4'),
        Note('4.', '4'), Note('5.', '4'), Note('1.', '2'),
        Note('2.', '4'), Note('5.', '4'), Note('3.', '4'), Note('5.', '4'),
        Note('1.', '4'), Note('5.', '4'), Note('1.', '2'),
        Note('5.', '4'), Note('2.', '4'), Note('4.', '4'), Note('2.', '4'),
        Note('3.', '4'), Note('5.', '4'), Note('2.', '2'),
        Note('5.', '4'), Note('2.', '4'), Note('4.', '4'), Note('2.', '4'),
        Note('3.', '4'), Note('5.', '4'), Note('2.', '2'),
        Note('1.', '4'), Note('5.', '4'), Note('3.', '4'), Note('5.', '4'),
        Note('4.', '4'), Note('5.', '4'), Note('1.', '2'),
        Note('2.', '4'), Note('5.', '4'), Note('3.', '4'), Note('5.', '4'),
        Note('1.', '4'), Note('5.', '4'), Note('1.', '2')
    ]
    
    player.play_music(melody, accompaniment)
    print("小星星弹奏完成")

def play_gong_xi_fa_cai():
    """演奏恭喜发财"""
    player = MusicPlayer(tempo=200)
    
    # 主旋律（根据乐谱转换，考虑下划线表示八分音符）
    melody = [
        # A段
        Note('2', '4'), Note('3', '4'), Note('5', '4'), Note('3', '4'),
        Note('2', '8'), Note('3', '8'), Note('2', '8'), Note('1', '8'), Note('6.', '4'), Note('-', '4'),
        Note('2', '4'), Note('3', '4'), Note('5', '4'), Note('3', '4'),
        Note('2', '8'), Note('3', '8'), Note('2', '8'), Note('6.', '8'), Note('1', '4'), Note('-', '4'),
        
        # B段
        Note('0', '8'), Note('3', '8'), 
        Note('6', '8'), Note('5', '8'), Note('6', '8'), Note('5', '8'), Note('3', '4'), Note('3', '4'), 
        Note('-', '4'), Note('-', '4'), Note('0', '8'), Note('5', '8'),
        Note('6', '4'), Note('5', '4'), Note('6', '4'), Note('5', '8'), Note('6', '8'), Note('6', '4'), 
        Note('-', '4'), Note('-', '4'),Note('0', '8'), Note('3', '8'),
        
        # C段
        Note('2', '8'), Note('3', '16'), Note('2', '8'), Note('1', '8'), Note('6.', '4'), Note('3', '8'),
        Note('2', '8'), Note('3', '16'), Note('2', '8'), Note('1', '8'), Note('2', '4'), Note('-', '4'),
        Note('1', '4'), Note('2', '4'), Note('3', '4'), Note('5', '4'), 
        Note('6', '4'), Note('-', '4'), Note('-', '4'),
    ]
    
    # 简单的伴奏（根据主旋律节奏调整）
    accompaniment = [
        Note('5.', '4') for _ in range(len(melody))
    ]
    
    player.play_music(melody, accompaniment)
    print("恭喜发财弹奏完成")

def delayed_key_press():
    time.sleep(3)  # 等待3秒切换窗口
    if SONG_SELECTION == 1:
        play_little_star()
    else:
        play_gong_xi_fa_cai()
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
    global SONG_SELECTION
    print("快捷键监听程序已启动...")
    print("按 CMD+Shift+W 开始弹奏")
    print("按 1 切换到小星星")
    print("按 2 切换到恭喜发财")
    print("按 CMD+Shift+Q 退出程序")
    
    def on_key_press(event):
        global SONG_SELECTION
        if event.name == '1':
            SONG_SELECTION = 1
            print("已切换到：小星星")
        elif event.name == '2':
            SONG_SELECTION = 2
            print("已切换到：恭喜发财")
    
    keyboard.on_press(on_key_press)
    
    # 启动监听
    with kb.Listener(on_press=on_press, on_release=on_release) as listener:
        listener.join()


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n程序已退出")
        sys.exit(0) 