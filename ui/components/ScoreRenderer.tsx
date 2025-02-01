import React from 'react';
import { Score, Note } from '../type/score';

interface ScoreRendererProps {
  score: Score;
}

const ScoreRenderer: React.FC<ScoreRendererProps> = ({ score }) => {
  // 渲染音符的辅助函数
  const renderNote = (note: Note) => {
    if (note.type === 'barline') {
      return <span className="mx-1 text-gray-600">|</span>;
    }

    if (note.type === 'rest') {
      return <span className="mx-1">0</span>;
    }

    if (note.type === 'note' && note.pitch) {
      // 获取音高显示
      const getDisplayNote = () => {
        const base = note.pitch?.step;
        const accidental = note.pitch?.accidental 
          ? (note.pitch?.accidental === '#' ? '#' : note.pitch?.accidental === 'b' ? 'b' : '=')
          : '';
        
        // 将 CDEFGAB 转换为简谱数字
        const noteToNumber: { [key: string]: string } = {
          'C': '1',
          'D': '2',
          'E': '3',
          'F': '4',
          'G': '5',
          'A': '6',
          'B': '7'
        };
        
        const numberNote = noteToNumber[base as keyof typeof noteToNumber] || base;
        
        // 处理八度标记
        const octaveMark = note.pitch?.octaveShift ?? 0 > 0
          ? "·".repeat(note.pitch?.octaveShift ?? 0)  // 高八度用点在上方
          : (note.pitch?.octaveShift ?? 0) < 0
            ? ".".repeat(Math.abs(note.pitch?.octaveShift ?? 0))  // 低八度用点在下方
            : '';

        return `${accidental}${numberNote}${octaveMark}`;
      };

      // 获取时值显示
      const getDurationDisplay = () => {
        const { base, dots, divisions } = note.duration;
        let durationStr = '';
        
        // 处理附点
        if (dots > 0) {
          durationStr += '.'.repeat(dots);
        }

        // 处理延长音
        if (base > 1) {
          durationStr += ' ' + '-'.repeat(base - 1);
        }

        return {
          text: durationStr,
          divisions: divisions > 1 ? divisions - 1 : 0
        };
      };

      return (
        <span className="inline-block mx-1 relative">
          <span className="note-pitch relative">{getDisplayNote()}
          {[...Array(getDurationDisplay().divisions)].map((_, index) => (
              <span
                key={`division-${index}`}
                className="absolute left-0 right-0"
                style={{
                  height: '1.5px',
                  background: '#333',
                  bottom: `${-4 - index * 3}px`,
                  width: '120%',
                  left: '-10%',
                }}
              />
            ))}
          </span>
          <span className="note-duration relative">
            {getDurationDisplay().text}
            
          </span>
        </span>
      );
    }

    return null;
  };
  return (
    <div className="score-renderer">
      {/* 渲染标题和元数据 */}
      <div className="score-header mb-4">
        {score.header.titles && score.header.titles.map((title, index) => (
          <h2 key={`title-${index}`} className="text-xl font-bold mb-1">
            {title}
          </h2>
        ))}
        <div className="text-sm text-gray-600">
          {score.header.composers.map((composer, index) => (
            <span key={`composer-${index}`} className="mr-2">
              作曲: {composer}
            </span>
          ))}
          <span className="mr-2">拍号: {score.header.meter}</span>
          <span>调号: {score.header.key}</span>
        </div>
      </div>

      {/* 渲染乐谱内容 */}
      <div className="score-content p-4 border rounded bg-white font-mono text-lg">
        {score.notes.map((note, index) => (
          <React.Fragment key={index}>
            {renderNote(note)}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default ScoreRenderer; 