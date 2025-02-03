'use client';

import { useState, useEffect, useRef } from 'react';
import { Score, Note } from '@/type/score';
import { Soundfont } from 'smplr';

interface ScorePlayerProps {
  score: Score | null;
}

export default function ScorePlayer({ score }: ScorePlayerProps) {
  const [piano, setPiano] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const currentNoteIndex = useRef<number>(0);
  const shouldStop = useRef<boolean>(false);

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
      C: 0,
      D: 1,
      E: 2,
      F: 3,
      G: 4,
      A: 5,
      B: 6,
    };

    const noteNumber = stepToNumber[note.pitch.step];
    if (noteNumber === undefined) return;

    const midiNote = baseNote + scale[noteNumber] + note.pitch.octaveShift * 12;

    // 根据 BPM 计算持续时间
    const bpm = score?.header.bpm || 120;
    const beatDuration = 60000 / bpm;

    // 计算基础持续时间
    let baseDuration = beatDuration / note.duration.divisions;

    // 添加附点的额外时长
    baseDuration *= 1 + note.duration.dots * 0.5;

    // 根据基本时值计算延长音的时长
    const duration = baseDuration * note.duration.base;

    await piano.start({ note: midiNote });
    setTimeout(() => piano.stop({ note: midiNote }), duration);

    await new Promise(resolve => setTimeout(resolve, duration));
  };

  const playScore = async () => {
    if (!score || !piano) return;

    if (isPaused) {
      setIsPaused(false);
      setIsPlaying(true);
    } else {
      setIsPlaying(true);
      currentNoteIndex.current = 0;
    }

    shouldStop.current = false;

    try {
      for (let i = currentNoteIndex.current; i < score.notes.length; i++) {
        if (shouldStop.current) {
          break;
        }

        currentNoteIndex.current = i;
        const note = score.notes[i];

        if (note.type === 'note') {
          await playNote(note);
        } else if (note.type === 'rest') {
          const bpm = score.header.bpm || 120;
          const beatDuration = 60000 / bpm;
          // 修改休止符的持续时间计算
          let baseDuration = beatDuration / note.duration.divisions;
          baseDuration *= 1 + note.duration.dots * 0.5;
          const duration = baseDuration * note.duration.base;
          await new Promise(resolve => setTimeout(resolve, duration));
        }
      }
    } catch (error) {
      console.error(' 播放出错 :', error);
    } finally {
      if (!shouldStop.current) {
        setIsPlaying(false);
        setIsPaused(false);
        currentNoteIndex.current = 0;
      }
    }
  };

  const pauseScore = () => {
    shouldStop.current = true;
    setIsPlaying(false);
    setIsPaused(true);
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={isPlaying ? pauseScore : playScore}
        disabled={!score || !piano}
        className={`px-4 py-2 rounded-lg ${
          !score || !piano
            ? 'bg-gray-300 cursor-not-allowed'
            : 'bg-blue-500 hover:bg-blue-600 text-white'
        }`}
      >
        {isPlaying ? '暂停' : isPaused ? '继续' : '播放'}
      </button>
    </div>
  );
}
