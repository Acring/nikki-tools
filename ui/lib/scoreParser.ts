import { Score, Note, Pitch, Duration, ScoreHeader } from '../type/score';

/**
 * 简谱解析器 - 将简谱字符串转换为对象
 */



export class ScoreParser {
  private static readonly NOTE_PATTERN = /([_^=]*)([A-Ga-gz1-7])([,']*)(\/+|\d+|[<>])?(\.*)?/;
  private static readonly HEADER_PATTERN = /^([TCMK]):\s*(.+)$/;
  private static readonly PITCH_MAP: { [key: string]: string } = {
    '1': 'C', '2': 'D', '3': 'E', '4': 'F',
    '5': 'G', '6': 'A', '7': 'B'
  };

  /**
   * 解析乐谱头部信息
   * @param lines 乐谱文本行
   */
  private static parseHeader(lines: string[]): ScoreHeader {
    const header: ScoreHeader = {
      titles: [],
      composers: [],
      meter: '4/4',  // 默认4/4拍
      key: 'C',       // 默认C调
    };

    for (const line of lines) {
      const match = line.match(this.HEADER_PATTERN);
      if (!match) continue;

      const [_, type, value] = match;
      switch (type) {
        case 'T':
          header.titles.push(value.trim());
          break;
        case 'C':
          header.composers.push(value.trim());
          break;
        case 'M':
          header.meter = this.parseMeter(value.trim());
          break;
        case 'K':
          header.key = value.trim();
          break;
      }
    }

    return header;
  }

  /**
   * 解析节拍信息
   * @param meterStr 节拍字符串
   */
  private static parseMeter(meterStr: string): string {
    if (meterStr === 'C') return '4/4';
    if (meterStr === 'C\\') return '2/2';
    return meterStr;
  }

  /**
   * 解析简谱字符串
   * @param scoreStr 简谱字符串
   */
  static parseScore(scoreStr: string): Note[] {
    const notes: Note[] = [];
    const noteStrings = scoreStr.split(/\s+/);

    for (let i = 0; i < noteStrings.length; i++) {
      const noteStr = noteStrings[i];
      if (!noteStr.trim()) continue;
      
      // 处理小节线
      if (noteStr === '|') {
        notes.push({
          type: 'barline',
          duration: { base: 0, divisions: 1, dots: 0, augmentation: 0 }
        });
        continue;
      }

      // 处理延长音
      if (noteStr === '-') {
        if (notes.length > 0 && notes[notes.length - 1].type === 'note') {
          const prevNote = notes[notes.length - 1];
          // 每个延长符号增加一个基本时值单位
          if (prevNote.duration) {
            prevNote.duration.base += 1;
          }
        }
        continue;  // 添加 continue 以跳过后续处理
      }

      // 处理装饰音
      if (noteStr.includes('{')) {
        // TODO: 实现装饰音解析
        continue;
      }

      try {
        // 检查是否是有效的音符格式
        if (this.isValidNote(noteStr)) {
          const note = this.parseNote(noteStr);
          notes.push(note);
        }
      } catch (error) {
        console.error(`解析音符失败: ${noteStr}`, error);
      }
    }

    return notes;
  }

  /**
   * 解析完整的乐谱字符串
   * @param scoreStr 乐谱字符串
   */
  static parseFullScore(scoreStr: string): Score {
    const lines = scoreStr.split('\n').map(line => line.trim());
    
    // 收集所有头部信息行（不包括歌词行）
    const headerLines = lines.filter(line => line.match(/^[TCMK]:/));
    
    // 找到最后一个头部信息行的索引
    const lastHeaderIndex = lines.reduce((lastIndex, line, index) => {
      return line.match(/^[TCMK]:/) ? index : lastIndex;
    }, -1);

    // 解析音符内容
    const notesStr = lines
      .slice(lastHeaderIndex + 1)
      .filter(line => line.trim())
      .join(' ');

    return {
      header: this.parseHeader(headerLines),
      notes: this.parseScore(notesStr)
    };
  }

  /**
   * 将完整乐谱对象转换为字符串
   * @param score 乐谱对象
   */
  static stringifyFullScore(score: Score): string {
    const headerLines: string[] = [];
    
    // 添加标题
    score.header.titles.forEach(title => {
      headerLines.push(`T: ${title}`);
    });

    // 添加作者
    score.header.composers.forEach(composer => {
      headerLines.push(`C: ${composer}`);
    });

    // 添加节拍
    headerLines.push(`M: ${score.header.meter}`);

    // 添加调号
    headerLines.push(`K: ${score.header.key}`);

    // 添加音符
    const notesStr = this.stringifyScore(score.notes);

    return [...headerLines, '', notesStr].join('\n');
  }

  /**
   * 解析单个音符
   * @param noteStr 音符字符串
   */
  static parseNote(noteStr: string): Note {
    // 处理休止符
    if (noteStr.toLowerCase() === 'z') {
      return {
        type: 'rest',
        duration: this.parseDuration(undefined, undefined)
      };
    }

    const match = noteStr.match(this.NOTE_PATTERN);
    if (!match) throw new Error(`无效的音符格式: ${noteStr}`);

    const [_, accidentals, noteName, octaveMarks, durationMark, dots] = match;

    // 处理音高
    const pitch: Pitch = {
      step: this.PITCH_MAP[noteName] || noteName.toUpperCase(),
      octaveShift: this.calculateOctaveShift(noteName, octaveMarks),
      accidental: this.parseAccidental(accidentals)
    };

    return {
      type: 'note',
      pitch,
      duration: this.parseDuration(durationMark, dots)
    };
  }

  /**
   * 解析时值标记
   */
  private static parseDuration(durationMark: string | undefined, dots: string | undefined): Duration {
    const duration: Duration = {
      base: 1.0,
      divisions: 1,
      dots: (dots || '').length,
      augmentation: 0
    };

    if (!durationMark) return duration;

    if (durationMark.includes('/')) {
      duration.divisions = durationMark.length + 1;
    } else if (durationMark === '>') {
      duration.augmentation = 1;
    } else if (durationMark === '<') {
      duration.augmentation = -1;
    } else {
      const num = parseInt(durationMark);
      if (!isNaN(num)) {
        duration.base = num;
      }
    }

    return duration;
  }

  /**
   * 计算八度偏移
   */
  private static calculateOctaveShift(noteName: string, octaveMarks: string): number {
    if (!octaveMarks) {
      // 小写字母表示高八度
      return noteName === noteName.toLowerCase() && !this.PITCH_MAP[noteName] ? 1 : 0;
    }
    
    // 处理 , 和 ' 符号
    if (octaveMarks.includes(',')) {
      return -octaveMarks.length;
    } else if (octaveMarks.includes("'")) {
      return octaveMarks.length;
    }

    return 0;
  }

  /**
   * 解析变音记号
   */
  private static parseAccidental(accidentals: string): string | null {
    if (!accidentals) return null;

    const accidentalMap: { [key: string]: string } = {
      '^': 'sharp',
      '^^': 'double-sharp',
      '_': 'flat',
      '__': 'double-flat',
      '=': 'natural'
    };

    return accidentalMap[accidentals] || null;
  }

  /**
   * 检查是否是有效的音符
   * @param noteStr 音符字符串
   */
  private static isValidNote(noteStr: string): boolean {
    if (noteStr.toLowerCase() === 'z') return true;
    const match = noteStr.match(this.NOTE_PATTERN);
    if (!match) return false;

    const [_, __, noteName] = match;
    // 检查是否是有效的音名或数字
    return /^[A-Ga-g1-7]$/.test(noteName);
  }

  /**
   * 将音符对象转换为字符串
   * @param note 音符对象
   */
  static stringifyNote(note: Note): string {
    if (note.type === 'rest') {
      return 'z';
    }
    
    if (note.type === 'barline') {
      return '|';
    }

    let result = '';
    
    // 添加变音记号
    if (note.pitch?.accidental) {
      const accidentalMap: { [key: string]: string } = {
        'sharp': '^',
        'double-sharp': '^^',
        'flat': '_',
        'double-flat': '__',
        'natural': '='
      };
      result += accidentalMap[note.pitch.accidental] || '';
    }

    // 添加音名
    if (note.pitch) {
      // 尝试使用数字简谱
      const numeral = Object.entries(this.PITCH_MAP).find(([_, value]) => value === note.pitch?.step)?.[0];
      result += numeral || note.pitch.step;
    }

    // 添加八度标记
    if (note.pitch?.octaveShift) {
      if (note.pitch.octaveShift > 0) {
        result += "'".repeat(note.pitch.octaveShift);
      } else if (note.pitch.octaveShift < 0) {
        result += ",".repeat(-note.pitch.octaveShift);
      }
    }

    // 添加时值标记
    if (note.duration) {
      if (note.duration.divisions > 1) {
        result += '/'.repeat(note.duration.divisions - 1);
      }

      if (note.duration.augmentation === 1) {
        result += '>';
      } else if (note.duration.augmentation === -1) {
        result += '<';
      }

      if (note.duration.dots > 0) {
        result += '.'.repeat(note.duration.dots);
      }
    }

    return result;
  }

  /**
   * 将音符数组转换为字符串
   * @param notes 音符数组
   */
  static stringifyScore(notes: Note[]): string {
    const result: string[] = [];
    
    for (let i = 0; i < notes.length; i++) {
      const note = notes[i];
      
      if (note.type === 'note' && note.duration) {
        // 输出基本音符
        result.push(this.stringifyNote({
          ...note,
          duration: { ...note.duration, base: 1 }
        }));
        
        // 根据 base 值添加对应数量的延长线
        if (note.duration.base > 1) {
          for (let j = 1; j < note.duration.base; j++) {
            result.push('-');
          }
        }
      } else {
        result.push(this.stringifyNote(note));
      }
    }
    
    return result.join(' ');
  }
} 