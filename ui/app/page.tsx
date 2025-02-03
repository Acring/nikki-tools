'use client';

import ScoreRenderer from '../components/ScoreRenderer';
import ScorePlayer from '../components/ScorePlayer';
import { useState, useEffect } from 'react';
import type { NextPage } from 'next';
import { ScoreParser } from '../lib/scoreParser';
import { Score } from '@/type/score';

const defaultText = `T: 小星星
C: 莫扎特改编
M: 4/4
K: C

1 1 5 5 | 6 6 5 - |
4 4 3 3 | 2 2 1 - |
5 5 4 4 | 3 3 2 - |
5 5 4 4 | 3 3 2 - |
1 1 5 5 | 6 6 5 - |
4 4 3 3 | 2 2 1 - |`;

const Home: NextPage = () => {
  const [inputText, setInputText] = useState<string>(defaultText);
  const [parsedScore, setParsedScore] = useState<string | null>(null);
  const [score, setScore] = useState<Score | null>(null);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setInputText(newText);
    try {
      const score = ScoreParser.parseFullScore(newText);
      setParsedScore(JSON.stringify(score, null, 2));
      setScore(score);
    } catch (error) {
      console.error('解析错误:', error);
      setParsedScore(`解析出错: ${error instanceof Error ? error.message : '未知错误'}`);
      setScore(null);
    }
  };

  useEffect(() => {
    handleTextChange({ target: { value: defaultText } } as React.ChangeEvent<HTMLTextAreaElement>);
  }, []);

  return (
    <main className="min-h-screen p-4">
      <h1 className="text-2xl font-bold mb-4">简谱编辑器</h1>
      <div className="flex gap-4">
        {/* 左侧编辑区 */}
        <div className="w-1/2">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">输入区</h2>
            <ScorePlayer score={score} />
          </div>
          <div className="mb-2 text-sm text-gray-600">
            支持的格式：
            <ul className="list-disc list-inside">
              <li>T: 标题</li>
              <li>C: 作者</li>
              <li>M: 节拍，如 4/4、C(4/4)、C\(2/2)</li>
              <li>K: 调号，如 C</li>
              <li>音符：1-7 或 A-G</li>
              <li>升降号：^ (升号)、^^ (重升号)、_ (降号)、__ (重降号)、= (还原号)</li>
              <li>八度：高音加 ' (如 1')、低音加 , (如 1,)，可叠加使用</li>
              <li>时值：基本音符为一拍，/ 表示减半(如 1/ 为半拍)， . 表示附点(如 1. 表示一拍半)</li>
              <li>小节线：|</li>
              <li>休止符：z</li>
              <li>延长线：-</li>
            </ul>
          </div>
          <textarea
            className="w-full h-[500px] p-4 border rounded-lg font-mono"
            value={inputText}
            onChange={handleTextChange}
            placeholder="在此输入简谱文本..."
          />
        </div>

        {/* 右侧预览区 */}
        <div className="w-1/2">
          <h2 className="text-lg font-semibold mb-2">预览</h2>
          {score ? (
            <ScoreRenderer score={score} />
          ) : (
            <div className="w-full h-[500px] p-4 border rounded-lg bg-gray-50">
              等待输入有效的简谱...
            </div>
          )}
          <details className="mt-4">
            <summary className="cursor-pointer text-sm text-gray-600">查看解析结果</summary>
            <pre className="mt-2 p-4 border rounded-lg bg-gray-50 overflow-auto text-sm h-[500px]">
              {parsedScore ? parsedScore : ''}
            </pre>
          </details>
        </div>
      </div>
    </main>
  );
};

export default Home;
