'use client';

import { useState, useEffect } from 'react';
import { Score, Note } from '@/type/score';
import { Soundfont } from 'smplr';

interface ScorePlayerProps {
  score: Score | null;
}

export default function ScorePlayer({ score }: ScorePlayerProps) {
  const [piano, setPiano] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  useEffect(() => {
    const initPiano = async () => {
      const audioContext = new AudioContext();
      const soundfont = new Soundfont(audioContext, {
        instrument: 'acoustic_grand_piano',
      });
      await soundfont.loaded();
      setPiano(soundfont);
    };
    initPiano();
  }, []);

  const playNote = async (note: Note) => {
    if (!piano || note.type !== 'note' || !note.pitch) return;
    
    // 计算 MIDI 音符号
    const baseNote = 60; // 中音 C4 的 MIDI 音符号
    const scale = [0, 2, 4, 5, 7, 9, 11]; // 大调音阶的半音数
    const stepToNumber: { [key: string]: number } = {
      'C': 0, 'D': 1, 'E': 2, 'F': 3, 'G': 4, 'A': 5, 'B': 6
    };

    const noteNumber = stepToNumber[note.pitch.step];
    if (noteNumber === undefined) return;
    
    const midiNote = baseNote + scale[noteNumber] + (note.pitch.octaveShift * 12);
    
    // 计算持续时间（毫秒）
    const baseDuration = 500; // 一拍的基本时长（毫秒）
    const duration = baseDuration * (4 / note.duration.divisions) * 
      (1 + note.duration.dots * 0.5);
    
    await piano.start({ note: midiNote });
    setTimeout(() => piano.stop({ note: midiNote }), duration);
    
    // 等待音符播放完成
    await new Promise(resolve => setTimeout(resolve, duration));
  };

  const playScore = async () => {
    if (!score || !piano || isPlaying) return;
    setIsPlaying(true);
    
    try {
      for (const note of score.notes) {
        if (note.type === 'note') {
          await playNote(note);
        } else if (note.type === 'rest') {
          // 处理休止符
          const baseDuration = 500;
          const duration = baseDuration * (4 / note.duration.divisions) * 
            (1 + note.duration.dots * 0.5) * note.duration.augmentation;
          await new Promise(resolve => setTimeout(resolve, duration));
        }
      }
    } catch (error) {
      console.error('播放出错:', error);
    } finally {
      setIsPlaying(false);
    }
  };

  return (
    <button
      onClick={playScore}
      disabled={!score || !piano || isPlaying}
      className={`px-4 py-2 rounded-lg ${
        !score || !piano || isPlaying
          ? 'bg-gray-300 cursor-not-allowed'
          : 'bg-blue-500 hover:bg-blue-600 text-white'
      }`}
    >
      {isPlaying ? '播放中...' : '播放'}
    </button>
  );
} 