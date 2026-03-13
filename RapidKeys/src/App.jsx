import React, { useState, useEffect, useRef, useCallback } from 'react';
import Chart from 'chart.js/auto';

const SENTENCE_BANK = {
  easy: [
    "investments involve putting money into stocks or assets to earn profit.",
    "to make a career in ai start with basics like python mathematics and data science.",
    "coding is the process of using a programming language to get a computer to behave.",
    "the quick brown fox jumps over the lazy dog in the middle of the green forest.",
    "sunsets are beautiful when the sky turns orange and pink over the horizon.",
    "reading books every day helps you gain knowledge and improves your focus.",
    "drinking water is essential for staying hydrated and maintaining good health."
  ],
  medium: [
    "Html is the foundation of every website and stands for HyperText Markup Language.",
    "Javascript is used to make Websites Dynamic and Interactive. Developers Manipulate the DOM.",
    "The MERN stack consists of MongoDB, Express, React, and Node.js for Full-Stack builds.",
    "Cascading Style Sheets allow developers to create beautiful layouts and responsive designs.",
    "Cloud Computing provides on-demand data storage and computing power over the Internet.",
    "Mobile applications have changed the way we interact with technology and each other.",
    "Cybersecurity is vital for protecting sensitive information from digital attacks and theft."
  ],
  hard: [
    "PostgreSQL 13! stores data securely in Tables & Columns. SELECT name, age FROM users;",
    "React 18! uses Components, Props & State to build dynamic UIs. Hooks like useEffect().",
    "Algorithm complexity is often measured using Big O notation, such as O(n log n) or O(1).",
    "Microservices architecture breaks down applications into smaller, independent services.",
    "Machine Learning models utilize Neural Networks and Backpropagation for deep learning.",
    "Docker containers allow developers to package applications with all necessary dependencies.",
    "The fetch() API provides an interface for fetching resources across the entire network."
  ]
};

const RapidKeys = () => {
  const [theme, setTheme] = useState(() => localStorage.getItem('rk-theme') || 'dark');
  const [difficulty, setDifficulty] = useState(() => localStorage.getItem('rk-diff') || 'easy');
  const [duration, setDuration] = useState(() => Number(localStorage.getItem('rk-dur')) || 30);
  const [highScore, setHighScore] = useState(() => Number(localStorage.getItem('rk-highscore')) || 0);
  
  const [timeLeft, setTimeLeft] = useState(duration);
  const [isRunning, setIsRunning] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [referenceText, setReferenceText] = useState('');
  const [userInput, setUserInput] = useState('');
  
  const [stats, setStats] = useState({ 
    wpm: 0, accuracy: 100, errors: 0, totalKeystrokes: 0, correctKeystrokes: 0 
  });
  
  const chartDataRef = useRef({ labels: [], wpm: [], acc: [] });
  const inputRef = useRef(null);
  const chartRef = useRef(null);
  const chartInstance = useRef(null);
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);
  const containerRef = useRef(null);

  const colors = {
    bg: theme === 'dark' ? 'bg-[#000000]' : 'bg-[#ffffff]',
    panel: theme === 'dark' ? 'bg-[#080808]' : 'bg-[#fcfcfc]',
    box: theme === 'dark' ? 'bg-white/5' : 'bg-black/5',
    text: theme === 'dark' ? 'text-[#ffffff]' : 'text-[#000000]',
    accent: theme === 'dark' ? 'text-white' : 'text-black',
    untyped: theme === 'dark' ? 'text-white/10' : 'text-black/20',
    border: theme === 'dark' ? 'border-white/10' : 'border-black/10',
    labelColor: theme === 'dark' ? 'text-[#d1d1d1]' : 'text-[#1a1a1a]',
    speed: theme === 'dark' ? '#38bdf8' : '#2563eb',
    correct: theme === 'dark' ? '#4ade80' : '#059669',
    incorrect: theme === 'dark' ? '#f43f5e' : '#dc2626',
    timeValue: theme === 'dark' ? 'text-white' : 'text-[#a1a1a1]'
  };

  const diffColors = {
    easy: 'text-green-500 hover:bg-green-500/10',
    medium: 'text-yellow-500 hover:bg-yellow-500/10',
    hard: 'text-red-500 hover:bg-red-500/10'
  };

  const activeDiffBg = {
    easy: 'bg-green-500 text-black shadow-[0_0_20px_rgba(34,197,94,0.3)]',
    medium: 'bg-yellow-500 text-black shadow-[0_0_20px_rgba(234,179,8,0.3)]',
    hard: 'bg-red-500 text-black shadow-[0_0_20px_rgba(239,68,68,0.3)]'
  };

  useEffect(() => {
    localStorage.setItem('rk-theme', theme);
    localStorage.setItem('rk-diff', difficulty);
    localStorage.setItem('rk-dur', duration);
  }, [theme, difficulty, duration]);

  const updateChart = useCallback(() => {
    if (!chartRef.current) return;
    const ctx = chartRef.current.getContext('2d');
    
    if (!chartInstance.current) {
      chartInstance.current = new Chart(ctx, {
        type: 'line',
        data: {
          labels: chartDataRef.current.labels,
          datasets: [
            { label: 'Speed', data: chartDataRef.current.wpm, borderColor: colors.speed, borderWidth: 3, tension: 0.3, pointRadius: 0 },
            { label: 'Accuracy', data: chartDataRef.current.acc, borderColor: colors.correct, borderWidth: 2, tension: 0.3, pointRadius: 0 }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          layout: { padding: { top: 30, bottom: 10, left: 10, right: 40 } },
          animation: false,
          clip: false,
          scales: {
            x: { display: false },
            y: { 
              display: true, 
              position: 'right', 
              min: 0, 
              max: 150, 
              ticks: { 
                color: theme === 'dark' ? '#444' : '#ccc', 
                font: { family: 'monospace', size: 10, weight: 'bold' },
                padding: 10
              }, 
              grid: { color: theme === 'dark' ? '#111' : '#f0f0f0', drawBorder: false } 
            }
          },
          plugins: { legend: { display: false } }
        }
      });
    } else {
      chartInstance.current.data.labels = chartDataRef.current.labels;
      chartInstance.current.data.datasets[0].data = chartDataRef.current.wpm;
      chartInstance.current.data.datasets[1].data = chartDataRef.current.acc;
      chartInstance.current.update('none');
    }
  }, [colors.speed, colors.correct, theme]);

  const resetTest = useCallback(() => {
    clearInterval(timerRef.current);
    const sentences = SENTENCE_BANK[difficulty];
    setReferenceText(sentences[Math.floor(Math.random() * sentences.length)]);
    setUserInput('');
    setIsRunning(false);
    setIsFinished(false);
    setTimeLeft(duration);
    setStats({ wpm: 0, accuracy: 100, errors: 0, totalKeystrokes: 0, correctKeystrokes: 0 });
    chartDataRef.current = { labels: [], wpm: [], acc: [] };
    if (chartInstance.current) { chartInstance.current.destroy(); chartInstance.current = null; }
    updateChart();
    startTimeRef.current = null;
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [difficulty, duration, updateChart]);

  useEffect(() => {
    resetTest();
    const handleGlobalClick = () => inputRef.current?.focus();
    window.addEventListener('keydown', handleGlobalClick);
    return () => {
      clearInterval(timerRef.current);
      window.removeEventListener('keydown', handleGlobalClick);
    };
  }, [resetTest]);

  const handleInput = (e) => {
    if (isFinished) return;
    const val = e.target.value;
    const prevVal = userInput;

    if (!isRunning && val.length > 0) {
      setIsRunning(true);
      startTimeRef.current = Date.now();
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setIsRunning(false);
            setIsFinished(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    if (val.length > referenceText.length) return;

    if (val.length > prevVal.length) {
      const charIndex = val.length - 1;
      const isCorrect = val[charIndex] === referenceText[charIndex];
      setStats(prev => {
        const newTotal = prev.totalKeystrokes + 1;
        const newCorrect = isCorrect ? prev.correctKeystrokes + 1 : prev.correctKeystrokes;
        const elapsed = (Date.now() - startTimeRef.current) / 60000;
        const newWpm = elapsed > 0 ? Math.round((newCorrect / 5) / elapsed) : 0;
        return {
          totalKeystrokes: newTotal,
          correctKeystrokes: newCorrect,
          errors: isCorrect ? prev.errors : prev.errors + 1,
          accuracy: Math.round((newCorrect / newTotal) * 100),
          wpm: newWpm
        };
      });
    }
    setUserInput(val);
    if (val.length === referenceText.length) {
      clearInterval(timerRef.current);
      setIsRunning(false);
      setIsFinished(true);
    }
  };

  useEffect(() => {
    if (isFinished) {
      if (stats.wpm > highScore) {
        setHighScore(stats.wpm);
        localStorage.setItem('rk-highscore', stats.wpm);
      }
    }
  }, [isFinished, stats.wpm, highScore]);

  useEffect(() => {
    if (isRunning) {
      chartDataRef.current.labels.push(duration - timeLeft);
      chartDataRef.current.wpm.push(Math.min(stats.wpm, 200));
      chartDataRef.current.acc.push(stats.accuracy);
      updateChart();
    }
  }, [timeLeft, isRunning, stats.wpm, stats.accuracy, duration, updateChart]);

  const getTransform = () => {
    if (!containerRef.current) return 'translateX(0px)';
    const containerWidth = containerRef.current.offsetWidth;
    const charWidth = 35; 
    const currentPos = userInput.length * charWidth;
    const centerOffset = containerWidth / 2;
    return currentPos < centerOffset ? 'translateX(0px)' : `translateX(-${currentPos - centerOffset}px)`;
  };

  return (
    <div className={`h-screen w-screen overflow-hidden flex flex-col justify-center items-center ${colors.bg} font-mono p-10`}>
      <input ref={inputRef} type="text" className="fixed top-[-100px] left-[-100px] opacity-0" value={userInput} onChange={handleInput} autoFocus />
      
      <main className="w-full max-w-6xl h-full flex flex-col gap-6 overflow-hidden">
        <header className="flex justify-between items-center px-2 flex-shrink-0">
          <h1 className={`text-2xl font-bold tracking-tight ${colors.accent}`}>RapidKeys</h1>
          <button 
            onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')} 
            className={`p-2 rounded-xl border-2 ${colors.border} ${colors.text} transition-all active:scale-90 hover:bg-white/5`}
          >
            {theme === 'dark' ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.364l-.707-.707M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>
        </header>

        <div className="grid grid-cols-4 gap-6 flex-shrink-0">
          <Stat label="WPM" val={stats.wpm} valStyle={{ color: colors.speed }} labelColor={colors.labelColor} boxBg={colors.box} border={colors.border} />
          <Stat label="ACC" val={`${stats.accuracy}%`} valStyle={{ color: colors.correct }} labelColor={colors.labelColor} boxBg={colors.box} border={colors.border} />
          <Stat label="TIME" val={timeLeft} valStyle={{}} valClass={colors.timeValue} labelColor={colors.labelColor} boxBg={colors.box} border={colors.border} />
          <Stat label="ERR" val={stats.errors} valStyle={{ color: colors.incorrect }} labelColor={colors.labelColor} boxBg={colors.box} border={colors.border} />
        </div>

        <section 
          ref={containerRef}
          className={`relative h-[25vh] flex-shrink-0 flex items-center p-12 rounded-[2rem] border-2 ${colors.border} ${colors.panel} overflow-hidden`}
        >
          <div className="flex items-center transition-transform duration-75 ease-linear will-change-transform" style={{ transform: getTransform() }}>
            <div className="text-5xl md:text-6xl font-black whitespace-nowrap tracking-tight">
              {referenceText.split('').map((char, i) => {
                let charStyle = colors.untyped;
                if (i < userInput.length) {
                  charStyle = userInput[i] === char ? colors.text : "text-red-500 underline decoration-4";
                }
                const isCursor = i === userInput.length && !isFinished;
                return (
                  <span key={i} className={`${charStyle} relative inline-block`}>
                    {char === ' ' ? '\u00A0' : char}
                    {isCursor && <span className="absolute bottom-[-10px] left-0 w-full h-[10px] bg-blue-500" />}
                  </span>
                );
              })}
            </div>
          </div>
          <div className={`absolute inset-y-0 left-0 w-32 z-10 bg-gradient-to-r ${theme === 'dark' ? 'from-[#080808]' : 'from-[#fcfcfc]'} to-transparent`} />
          <div className={`absolute inset-y-0 right-0 w-32 z-10 bg-gradient-to-l ${theme === 'dark' ? 'from-[#080808]' : 'from-[#fcfcfc]'} to-transparent`} />

          {isFinished && (
            <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-[100] animate-in zoom-in duration-200">
               <div className={`${theme === 'dark' ? 'bg-[#0a0a0a]' : 'bg-white'} border-2 ${colors.border} p-8 rounded-[2rem] shadow-2xl flex flex-col items-center w-full max-w-[320px]`}>
                  <div className="w-full flex justify-between items-start mb-4">
                    <div className="flex flex-col">
                        <p className="text-blue-500 text-[9px] font-black tracking-widest uppercase mb-1">SCORE</p>
                        <h2 className={`${colors.accent} text-6xl font-black leading-none`}>{stats.wpm}</h2>
                        <p className="text-gray-500 text-[8px] font-black uppercase tracking-tighter">NET WPM</p>
                    </div>
                    <div className="flex flex-col items-end">
                        <p className="text-yellow-500 text-[9px] font-black tracking-widest uppercase mb-1">BEST</p>
                        <h2 className={`${colors.accent} text-3xl font-black leading-none`}>{highScore}</h2>
                    </div>
                  </div>
                  <div className="flex justify-between w-full mb-8 border-y border-white/5 py-4 px-2">
                    <div className="text-center">
                      <p className={`text-[9px] ${colors.labelColor} font-bold`}>ACCURACY</p>
                      <p className="font-black text-xl" style={{ color: colors.correct }}>{stats.accuracy}%</p>
                    </div>
                    <div className="text-center">
                      <p className={`text-[9px] ${colors.labelColor} font-bold`}>MISTAKES</p>
                      <p className="font-black text-xl" style={{ color: colors.incorrect }}>{stats.errors}</p>
                    </div>
                  </div>
                  <button onClick={resetTest} className="group p-5 bg-blue-600 text-white rounded-full hover:bg-blue-500 transition-all active:scale-90">
                    <svg className="w-6 h-6 group-hover:rotate-180 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
               </div>
            </div>
          )}
        </section>

        <div className="flex flex-col gap-4 items-center flex-shrink-0">
          <div className="flex gap-4">
            {['easy', 'medium', 'hard'].map(d => (
              <button key={d} onClick={() => setDifficulty(d)} className={`text-[10px] font-black px-8 py-2 rounded-full uppercase transition-all active:scale-95 ${difficulty === d ? activeDiffBg[d] : diffColors[d]}`}>{d}</button>
            ))}
          </div>
          <div className="flex gap-4">
            {[15, 30, 60].map(t => (
              <button key={t} onClick={() => setDuration(t)} className={`text-[10px] font-black px-8 py-2 rounded-full border ${duration === t ? (theme === 'dark' ? 'bg-white text-black' : 'bg-black text-white') : colors.border + ' ' + colors.text} uppercase tracking-widest transition-all shadow-sm active:scale-95`}>{t}S</button>
            ))}
          </div>
        </div>

        <div className={`flex-grow min-h-0 p-4 rounded-[2rem] border-2 ${colors.border} ${colors.panel} relative flex flex-col`}>
          <div className="flex justify-end items-center mb-2 flex-shrink-0">
            <div className="flex gap-4 text-[9px] font-bold uppercase tracking-widest mr-4">
               <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full" style={{ backgroundColor: colors.speed }}></div><span className={colors.labelColor}>Speed</span></div>
               <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full" style={{ backgroundColor: colors.correct }}></div><span className={colors.labelColor}>Accuracy</span></div>
            </div>
          </div>
          <div className="flex-grow w-full h-full overflow-hidden">
             <canvas ref={chartRef}></canvas>
          </div>
        </div>
      </main>
    </div>
  );
};

const Stat = ({ label, val, valStyle, valClass, labelColor, boxBg, border }) => (
  <div className={`flex flex-col items-center justify-center p-5 rounded-3xl border ${border} ${boxBg} transition-all`}>
    <span className={`text-[10px] font-black uppercase tracking-[0.3em] mb-1 ${labelColor}`}>{label}</span>
    <span className={`text-4xl font-black ${valClass || ''}`} style={valStyle}>{val}</span>
  </div>
);

export default RapidKeys;