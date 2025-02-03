export interface ScoreHeader {
  titles?: string[]; // 乐谱标题数组，支持多个标题
  composers?: string[]; // 作曲家数组，支持多个作曲家
  meter?: string; // 拍号，例如 "4/4", "3/4" 等
  bpm?: number; // 每分钟节拍数
  key?: string; // 调号，例如 "C", "G", "F" 等
}

export interface Score {
  header: ScoreHeader; // 乐谱头部信息
  notes: Note[]; // 乐谱中的所有音符、休止符和小节线
}

export interface Pitch {
  step: string; // 音高的基本音级，例如 "C", "D", "E" 等
  octaveShift: number; // 八度偏移量， 0 表示中央音区，正数向上，负数向下
  accidental: string | null; // 变音记号：'#' 升号 , 'b' 降号 , ' ♮ ' 还原号， null 表示无变音记号
}

export interface Duration {
  base: number; // 基本时值，展示延长音，例如： 1=1 ， 2=1 -， 4=1 - - -
  divisions: number; // 细分数，用于处理不规则节奏 , 例如 1 为 1 拍， 2 为 1/2 拍， 3 为 1/3 拍
  dots: number; // 附点数量，每个附点延长前面音符时值的一半
  augmentation: number; // 时值增益系数，用于特殊的时值计算
}

export interface Note {
  type: 'note' | 'rest' | 'barline'; // 音符类型：'note' 音符 , 'rest' 休止符 , 'barline' 小节线
  pitch?: Pitch; // 音高信息，休止符和小节线没有此属性
  duration: Duration; // 时值信息
}
