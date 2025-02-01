import { ScoreParser } from '../scoreParser';
import { Note } from '../../type/score';

describe('ScoreParser', () => {
  describe('parseNote', () => {
    it('应该正确解析基本音符', () => {
      const note = ScoreParser.parseNote('C');
      expect(note).toEqual({
        type: 'note',
        pitch: {
          step: 'C',
          octaveShift: 0,
          accidental: null
        },
        duration: {
          base: 1.0,
          divisions: 1,
          dots: 0,
          augmentation: 0
        }
      });
    });

    it('应该正确解析数字简谱', () => {
      const note = ScoreParser.parseNote('1');
      expect(note.pitch?.step).toBe('C');
      
      const note2 = ScoreParser.parseNote('2');
      expect(note2.pitch?.step).toBe('D');
    });

    it('应该正确解析变音记号', () => {
      const sharpNote = ScoreParser.parseNote('^F');
      expect(sharpNote.pitch?.accidental).toBe('sharp');

      const doubleSharpNote = ScoreParser.parseNote('^^G');
      expect(doubleSharpNote.pitch?.accidental).toBe('double-sharp');

      const flatNote = ScoreParser.parseNote('_A');
      expect(flatNote.pitch?.accidental).toBe('flat');

      const naturalNote = ScoreParser.parseNote('=B');
      expect(naturalNote.pitch?.accidental).toBe('natural');
    });

    it('应该正确解析八度标记', () => {
      const lowOctave = ScoreParser.parseNote('C,');
      expect(lowOctave.pitch?.octaveShift).toBe(-1);

      const highOctave = ScoreParser.parseNote("C'");
      expect(highOctave.pitch?.octaveShift).toBe(1);

      const highOctaveLower = ScoreParser.parseNote('c');
      expect(highOctaveLower.pitch?.octaveShift).toBe(1);
    });

    it('应该正确解析时值', () => {
      const halfNote = ScoreParser.parseNote('C/');
      expect(halfNote.duration.divisions).toBe(2);

      const quarterNote = ScoreParser.parseNote('C//');
      expect(quarterNote.duration.divisions).toBe(3);

      const doubleNote = ScoreParser.parseNote('C2');
      expect(doubleNote.duration.base).toBe(2);

      const augmentedNote = ScoreParser.parseNote('C>');
      expect(augmentedNote.duration.augmentation).toBe(1);

      const diminishedNote = ScoreParser.parseNote('C<');
      expect(diminishedNote.duration.augmentation).toBe(-1);
    });

    it('应该正确解析休止符', () => {
      const rest = ScoreParser.parseNote('z');
      expect(rest.type).toBe('rest');
      expect(rest.pitch).toBeUndefined();

      const capitalRest = ScoreParser.parseNote('Z');
      expect(capitalRest.type).toBe('rest');
      expect(capitalRest.pitch).toBeUndefined();
    });

    it('应该正确解析带点音符', () => {
      const dottedNote = ScoreParser.parseNote('C.');
      expect(dottedNote.duration.dots).toBe(1);

      const doubleDottedNote = ScoreParser.parseNote('C..');
      expect(doubleDottedNote.duration.dots).toBe(2);

      // 测试带点音符与其他修饰符的组合
      const dottedHalfNote = ScoreParser.parseNote('C/.');
      expect(dottedHalfNote.duration.dots).toBe(1);
      expect(dottedHalfNote.duration.divisions).toBe(2);

      const dottedHighOctave = ScoreParser.parseNote("C'.");
      expect(dottedHighOctave.duration.dots).toBe(1);
      expect(dottedHighOctave.pitch?.octaveShift).toBe(1);
    });
  });

  describe('parseScore', () => {
    it('应该正确解析一串音符', () => {
      const score = ScoreParser.parseScore('C D E F');
      expect(score).toHaveLength(4);
      expect(score[0].pitch?.step).toBe('C');
      expect(score[1].pitch?.step).toBe('D');
      expect(score[2].pitch?.step).toBe('E');
      expect(score[3].pitch?.step).toBe('F');
    });

    it('应该正确解析包含休止符的乐谱', () => {
      const score = ScoreParser.parseScore('C z D z');
      expect(score).toHaveLength(4);
      expect(score[0].type).toBe('note');
      expect(score[1].type).toBe('rest');
      expect(score[2].type).toBe('note');
      expect(score[3].type).toBe('rest');
    });

    it('应该跳过空白字符', () => {
      const score = ScoreParser.parseScore('C  D    E\tF\nG');
      expect(score).toHaveLength(5);
    });

    it('应该跳过无效的音符', () => {
      const score = ScoreParser.parseScore('C D invalid E F');
      expect(score.length).toBeGreaterThan(0);
      expect(score[0].pitch?.step).toBe('C');
      expect(score[1].pitch?.step).toBe('D');
      expect(score.every(note => 
        note.type === 'note' && 
        note.pitch?.step.match(/[A-G]/)
      )).toBe(true);
    });

    it('应该正确解析单个延长音', () => {
      const input = '1 -';
      const notes = ScoreParser.parseScore(input);
      
      expect(notes).toHaveLength(1);
      expect(notes[0]).toMatchObject({
        type: 'note',
        pitch: { step: 'C' },
        duration: { base: 2, divisions: 1 }
      });
    });

    it('应该正确解析多个连续延长音', () => {
      const input = '1 - - -';
      const notes = ScoreParser.parseScore(input);
      
      expect(notes).toHaveLength(1);
      expect(notes[0]).toMatchObject({
        type: 'note',
        pitch: { step: 'C' },
        duration: { base: 4, divisions: 1 }
      });
    });

    it('应该正确解析多个音符中的延长音', () => {
      const input = '1 - 2 - 3';
      const notes = ScoreParser.parseScore(input);
      
      expect(notes).toHaveLength(3);
      expect(notes[0]).toMatchObject({
        type: 'note',
        pitch: { step: 'C' },
        duration: { base: 2, divisions: 1 }
      });
      expect(notes[1]).toMatchObject({
        type: 'note',
        pitch: { step: 'D' },
        duration: { base: 2, divisions: 1 }
      });
      expect(notes[2]).toMatchObject({
        type: 'note',
        pitch: { step: 'E' },
        duration: { base: 1, divisions: 1 }
      });
    });

    it('应该正确解析带点音符序列', () => {
      const score = ScoreParser.parseScore('1. 2.. 3.');
      expect(score).toHaveLength(3);
      expect(score[0].duration.dots).toBe(1);
      expect(score[1].duration.dots).toBe(2);
      expect(score[2].duration.dots).toBe(1);
    });
  });

  describe('stringifyNote', () => {
    it('应该正确转换基本音符', () => {
      const note = {
        type: 'note' as const,
        pitch: {
          step: 'C',
          octaveShift: 0,
          accidental: null
        },
        duration: {
          base: 1.0,
          divisions: 1,
          dots: 0,
          augmentation: 0
        }
      };
      expect(ScoreParser.stringifyNote(note)).toBe('1');
    });

    it('应该正确转换变音记号', () => {
      const sharpNote = {
        type: 'note' as const,
        pitch: {
          step: 'F',
          octaveShift: 0,
          accidental: 'sharp'
        },
        duration: {
          base: 1.0,
          divisions: 1,
          dots: 0,
          augmentation: 0
        }
      };
      expect(ScoreParser.stringifyNote(sharpNote)).toBe('^4');

      const flatNote = {
        type: 'note' as const,
        pitch: {
          step: 'B',
          octaveShift: 0,
          accidental: 'flat'
        },
        duration: {
          base: 1.0,
          divisions: 1,
          dots: 0,
          augmentation: 0
        }
      };
      expect(ScoreParser.stringifyNote(flatNote)).toBe('_7');
    });

    it('应该正确转换八度标记', () => {
      const highOctave = {
        type: 'note' as const,
        pitch: {
          step: 'C',
          octaveShift: 1,
          accidental: null
        },
        duration: {
          base: 1.0,
          divisions: 1,
          dots: 0,
          augmentation: 0
        }
      };
      expect(ScoreParser.stringifyNote(highOctave)).toBe("1'");

      const lowOctave = {
        type: 'note' as const,
        pitch: {
          step: 'C',
          octaveShift: -1,
          accidental: null
        },
        duration: {
          base: 1.0,
          divisions: 1,
          dots: 0,
          augmentation: 0
        }
      };
      expect(ScoreParser.stringifyNote(lowOctave)).toBe('1,');
    });

    it('应该正确转换时值', () => {
      const halfNote = {
        type: 'note' as const,
        pitch: {
          step: 'C',
          octaveShift: 0,
          accidental: null
        },
        duration: {
          base: 1.0,
          divisions: 2,
          dots: 0,
          augmentation: 0
        }
      };
      expect(ScoreParser.stringifyNote(halfNote)).toBe('1/');

      const doubleNote = {
        type: 'note' as const,
        pitch: {
          step: 'C',
          octaveShift: 0,
          accidental: null
        },
        duration: {
          base: 2.0,
          divisions: 1,
          dots: 0,
          augmentation: 0
        }
      };
      expect(ScoreParser.stringifyNote(doubleNote)).toBe('1');
    });

    it('应该正确转换休止符', () => {
      const rest = {
        type: 'rest' as const,
        duration: {
          base: 1.0,
          divisions: 1,
          dots: 0,
          augmentation: 0
        }
      };
      expect(ScoreParser.stringifyNote(rest)).toBe('z');
    });

    it('应该正确转换带点音符', () => {
      const dottedNote = {
        type: 'note' as const,
        pitch: {
          step: 'C',
          octaveShift: 0,
          accidental: null
        },
        duration: {
          base: 1.0,
          divisions: 1,
          dots: 1,
          augmentation: 0
        }
      };
      expect(ScoreParser.stringifyNote(dottedNote)).toBe('1.');

      const doubleDottedNote = {
        type: 'note' as const,
        pitch: {
          step: 'C',
          octaveShift: 0,
          accidental: null
        },
        duration: {
          base: 1.0,
          divisions: 1,
          dots: 2,
          augmentation: 0
        }
      };
      expect(ScoreParser.stringifyNote(doubleDottedNote)).toBe('1..');
    });
  });

  describe('stringifyScore', () => {
    it('应该正确转换音符序列', () => {
      const score = [
        {
          type: 'note' as const,
          pitch: { step: 'C', octaveShift: 0, accidental: null },
          duration: { base: 1.0, divisions: 1, dots: 0, augmentation: 0 }
        },
        {
          type: 'note' as const,
          pitch: { step: 'D', octaveShift: 0, accidental: null },
          duration: { base: 1.0, divisions: 1, dots: 0, augmentation: 0 }
        },
        {
          type: 'note' as const,
          pitch: { step: 'E', octaveShift: 0, accidental: null },
          duration: { base: 1.0, divisions: 1, dots: 0, augmentation: 0 }
        }
      ];
      expect(ScoreParser.stringifyScore(score)).toBe('1 2 3');
    });

    it('应该正确转换包含休止符的乐谱', () => {
      const score = [
        {
          type: 'note' as const,
          pitch: { step: 'C', octaveShift: 0, accidental: null },
          duration: { base: 1.0, divisions: 1, dots: 0, augmentation: 0 }
        },
        {
          type: 'rest' as const,
          duration: { base: 1.0, divisions: 1, dots: 0, augmentation: 0 }
        }
      ];
      expect(ScoreParser.stringifyScore(score)).toBe('1 z');
    });

    it('应该正确转换带延长音的音符', () => {
      const notes: Note[] = [{
        type: 'note',
        pitch: { 
          step: 'C',
          octaveShift: 0,
          accidental: null
        },
        duration: { base: 2, divisions: 1, dots: 0, augmentation: 0 }
      }];
      
      const result = ScoreParser.stringifyScore(notes);
      expect(result).toBe('1 -');
    });

    it('应该正确转换带多个延长音的音符', () => {
      const notes: Note[] = [{
        type: 'note',
        pitch: { 
          step: 'C',
          octaveShift: 0,
          accidental: null
        },
        duration: { base: 3, divisions: 1, dots: 0, augmentation: 0 }
      }];
      
      const result = ScoreParser.stringifyScore(notes);
      expect(result).toBe('1 - -');
    });

    it('应该正确转换多个带延长音的音符', () => {
      const notes: Note[] = [
        {
          type: 'note',
          pitch: { 
            step: 'C',
            octaveShift: 0,
            accidental: null
          },
          duration: { base: 2, divisions: 1, dots: 0, augmentation: 0 }
        },
        {
          type: 'note',
          pitch: { 
            step: 'D',
            octaveShift: 0,
            accidental: null
          },
          duration: { base: 2, divisions: 1, dots: 0, augmentation: 0 }
        }
      ];
      
      const result = ScoreParser.stringifyScore(notes);
      expect(result).toBe('1 - 2 -');
    });

    it('应该正确转换带点音符序列', () => {
      const score = [
        {
          type: 'note' as const,
          pitch: { step: 'C', octaveShift: 0, accidental: null },
          duration: { base: 1.0, divisions: 1, dots: 1, augmentation: 0 }
        },
        {
          type: 'note' as const,
          pitch: { step: 'D', octaveShift: 0, accidental: null },
          duration: { base: 1.0, divisions: 1, dots: 2, augmentation: 0 }
        }
      ];
      expect(ScoreParser.stringifyScore(score)).toBe('1. 2..');
    });
  });

  describe('parseFullScore', () => {
    it('应该正确解析完整的乐谱', () => {
      const scoreStr = `T: 《两只老虎》
C: 马小虎
M: 2/4
K: C
1 2 3 1 1 2 3 1 3 4 5 3 4 5`;

      const score = ScoreParser.parseFullScore(scoreStr);
      
      // 验证头部信息
      expect(score.header.titles).toEqual(['《两只老虎》']);
      expect(score.header.composers).toEqual(['马小虎']);
      expect(score.header.meter).toBe('2/4');
      expect(score.header.key).toBe('C');

      // 验证音符
      expect(score.notes).toHaveLength(14);
      expect(score.notes[0].pitch?.step).toBe('C');
      expect(score.notes[1].pitch?.step).toBe('D');
    });

    it('应该支持多个标题和作者', () => {
      const scoreStr = `T: 主标题
T: 副标题
C: 作者1
C: 作者2
M: 4/4
K: G
1 2 3`;

      const score = ScoreParser.parseFullScore(scoreStr);
      
      expect(score.header.titles).toEqual(['主标题', '副标题']);
      expect(score.header.composers).toEqual(['作者1', '作者2']);
    });

    it('应该正确处理特殊的节拍标记', () => {
      const scoreStr1 = `M: C
K: C
1 2 3`;
      const score1 = ScoreParser.parseFullScore(scoreStr1);
      expect(score1.header.meter).toBe('4/4');

      const scoreStr2 = `M: C\\
K: C
1 2 3`;
      const score2 = ScoreParser.parseFullScore(scoreStr2);
      expect(score2.header.meter).toBe('2/2');
    });

    it('应该使用默认值处理缺失的头部信息', () => {
      const scoreStr = `1 2 3 4`;
      const score = ScoreParser.parseFullScore(scoreStr);
      
      expect(score.header.titles).toEqual([]);
      expect(score.header.composers).toEqual([]);
      expect(score.header.meter).toBe('4/4');
      expect(score.header.key).toBe('C');
    });

    it('应该忽略无效的头部信息行', () => {
      const scoreStr = `T: 标题
Invalid: Line
X: Something
M: 3/4
1 2 3`;

      const score = ScoreParser.parseFullScore(scoreStr);
      expect(score.header.titles).toEqual(['标题']);
      expect(score.header.meter).toBe('3/4');
      expect(score.notes).toHaveLength(3);
    });
  });

  describe('stringifyFullScore', () => {
    it('应该正确转换完整的乐谱为字符串', () => {
      const score = {
        header: {
          titles: ['《两只老虎》'],
          composers: ['马小虎'],
          meter: '2/4',
          key: 'C',
          lyrics: []
        },
        notes: [
          ScoreParser.parseNote('1'),
          ScoreParser.parseNote('2'),
          ScoreParser.parseNote('3')
        ]
      };

      const expectedStr = `T: 《两只老虎》
C: 马小虎
M: 2/4
K: C

1 2 3`;

      expect(ScoreParser.stringifyFullScore(score).trim()).toBe(expectedStr.trim());
    });

    it('应该正确处理多个标题和作者', () => {
      const score = {
        header: {
          titles: ['主标题', '副标题'],
          composers: ['作者1', '作者2'],
          meter: '4/4',
          key: 'G',
          lyrics: []
        },
        notes: [ScoreParser.parseNote('1')]
      };

      const result = ScoreParser.stringifyFullScore(score);
      expect(result).toContain('T: 主标题');
      expect(result).toContain('T: 副标题');
      expect(result).toContain('C: 作者1');
      expect(result).toContain('C: 作者2');
    });
  });

  describe('小节线解析测试', () => {
    test('应该正确解析包含小节线的简谱', () => {
      const input = '1 2 3 4 | 5 6 7 1';
      const notes = ScoreParser.parseScore(input);
      
      expect(notes).toHaveLength(9); // 8个音符 + 1个小节线
      expect(notes[4]).toEqual({
        type: 'barline',
        duration: { base: 0, divisions: 1, dots: 0, augmentation: 0 }
      });
    });

    test('应该正确序列化包含小节线的简谱', () => {
      const notes = [
        {
          type: 'note' as const,
          pitch: { step: 'C', octaveShift: 0, accidental: null },
          duration: { base: 1, divisions: 1, dots: 0, augmentation: 0 }
        },
        {
          type: 'barline' as const,
          duration: { base: 0, divisions: 1, dots: 0, augmentation: 0 }
        },
        {
          type: 'note' as const,
          pitch: { step: 'D', octaveShift: 0, accidental: null },
          duration: { base: 1, divisions: 1, dots: 0, augmentation: 0 }
        }
      ];

      const result = ScoreParser.stringifyScore(notes);
      expect(result).toBe('1 | 2');
    });

    test('应该正确处理多个连续的小节线', () => {
      const input = '1 2 | | 3 4';
      const notes = ScoreParser.parseScore(input);
      
      expect(notes).toHaveLength(6); // 4个音符 + 2个小节线
      expect(notes[2]).toEqual({
        type: 'barline',
        duration: { base: 0, divisions: 1, dots: 0, augmentation: 0 }
      });
      expect(notes[3]).toEqual({
        type: 'barline',
        duration: { base: 0, divisions: 1, dots: 0, augmentation: 0 }
      });
    });

    test('应该正确解析完整乐谱中的小节线', () => {
      const input = `T: 测试曲目
M: 4/4
K: C
1 2 3 4 | 5 6 7 1`;

      const score = ScoreParser.parseFullScore(input);
      expect(score.notes).toHaveLength(9); // 8个音符 + 1个小节线
      expect(score.notes[4]).toEqual({
        type: 'barline',
        duration: { base: 0, divisions: 1, dots: 0, augmentation: 0 }
      });

      // 测试序列化
      const output = ScoreParser.stringifyFullScore(score);
      expect(output).toContain('1 2 3 4 | 5 6 7 1');
    });
  });
}); 