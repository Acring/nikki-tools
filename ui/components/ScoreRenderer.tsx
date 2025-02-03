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
        
        return `${accidental}${numberNote}`;
      };

      // 获取时值显示
      const getDurationDisplay = () => {
        const { base, dots, divisions } = note.duration;
        let durationStr = '';
        
        // 只处理延长音，附点将在 DOM 中单独处理
        if (base > 1) {
          durationStr += ' ' + '-'.repeat(base - 1);
        }

        return {
          text: durationStr,
          divisions: divisions > 1 ? divisions - 1 : 0,
          dots: dots // 返回附点数量
        };
      };

      return (
        <span className="inline-block mx-1 relative">
          <span className="relative">
            {getDisplayNote()}
            {/* 添加高八度圆点标记 */}
            {(note.pitch?.octaveShift ?? 0) > 0 && [...Array(note.pitch?.octaveShift)].map((_, index) => (
              <span
                key={`octave-up-${index}`}
                className="absolute w-[3px] h-[3px] bg-current rounded-full inline-block left-1/2"
                style={{
                  top: `${-8 - index * 6}px`,
                  transform: 'translateX(-50%)'
                }}
              />
            ))}
            {/* 添加低八度圆点标记 */}
            {(note.pitch?.octaveShift ?? 0) < 0 && [...Array(Math.abs(note.pitch?.octaveShift ?? 0))].map((_, index) => (
              <span
                key={`octave-down-${index}`}
                className="absolute w-[3px] h-[3px] bg-current rounded-full inline-block left-1/2"
                style={{
                  bottom: `${-8 - index * 6}px`,
                  transform: 'translateX(-50%)'
                }}
              />
            ))}
            {/* 添加附点显示 */}
            {[...Array(getDurationDisplay().dots)].map((_, index) => (
              <span
                key={`dot-${index}`}
                className="absolute top-1/2 text-[0.6em] inline-block w-[0.4em] h-[0.4em] bg-current rounded-full"
                style={{
                  transform: 'translateY(-50%)',
                  right: `${-0.4 - index * 0.4}em`
                }}
              />
            ))}
            {/* 渲染分部线 */}
            {[...Array(getDurationDisplay().divisions)].map((_, index) => (
              <span
                key={`division-${index}`}
                className="absolute left-[-10%] w-[120%] bg-neutral-800"
                style={{
                  height: '1.5px',
                  bottom: `${-4 - index * 3}px`
                }}
              />
            ))}
          </span>
          <span className="relative">
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
      <div className="mb-4">
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
      <div className="p-4 border rounded bg-white font-mono text-lg">
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