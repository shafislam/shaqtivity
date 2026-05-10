import { useState, useEffect } from 'react';
import { registerPlugin } from '@capacitor/core'

const WidgetSync = registerPlugin('WidgetSync');
const API_BASE = import.meta.env.VITE_API_URL || '';

const DEFAULT_EXERCISES = {
  chest: ['Cable Crossover', 'Dips', 'Decline Press', 'Flyes', 'Incline Press', 'Pec Deck', 'Bench Press', 'Pushups', 'DB Pullover', 'Fl Press'],
  back: ['Straight-Arm Pulldown', 'Pullups', 'Good Mornings', 'Deadlift', 'Lat Pulldown', 'Chin-ups', 'Barbell Row', 'T-Bars', 'Seated Row', 'Pullovers'],
  shoulders: ['Cable Upright Row', 'Shrugs', 'Reverse Pec Deck', 'Arnold', 'Landmine Press', 'Fronts', 'Lateral Raises', 'Upright', 'Overhead Press', 'Push Press'],
  biceps: ['Concentration Curl', 'Cable Curl', 'Preacher Curl', 'Spider', 'Dumbbell Curl', 'Reverse', 'Barbell Curl', 'Incline', 'Zottman Curl', 'Hammer'],
  triceps: ['Overhead Extension', 'Dips', 'Close Grip Bench', 'JM Press', 'Tricep Pushdown', 'Kickbacks', 'Diamond Pushups', 'Tate Press', 'Skull Crushers', 'Rope Push'],
  legs: ['Bulgarian Split Squat', 'Squat', 'Romanian Deadlift', 'Lunges', 'Leg Extensions', 'Leg Curl', 'Glute Bridges', 'Leg Press', 'Calf Raises', 'H Squat'],
  core: ['Hanging Leg Raises', 'Plank', 'Bicycle Crunches', 'V-Ups', 'Russian Twists', 'Ab Wheel', 'Cable Crunches', 'Crunches', 'Side Plank', 'Leg Lifts'],
  cardio: ['Shadow Boxing', 'Rowing', 'Battle Ropes', 'Cycling', 'Stairmaster', 'Sprints', 'Elliptical', 'Burpees', 'Jump Rope', 'Treadmill']
};

const NYC_ACTIVITIES = [
  { id: 'WL', category: 'Strength', name: 'LIFTING', icon: '🏋️' },
  { id: 'BK', category: 'Sports', name: 'BASKETBALL', icon: '🏀' },
  { id: 'RC', category: 'Sports', name: 'CLIMBING', icon: '🧗' },
  { id: 'YG', category: 'Flexibility', name: 'YOGA', icon: '🧘‍♂️' },
  { id: 'RN', category: 'Cardio', name: 'RUNNING', icon: '🏃' },
  { id: 'CL', category: 'Strength', name: 'BODYWT', icon: '💪' },
  { id: 'VB', category: 'Sports', name: 'VOLLEYBALL', icon: '🏐' },
  { id: 'HI', category: 'Cardio', name: 'HIIT', icon: '⏱️' },
  { id: 'BX', category: 'Combat', name: 'BOXING', icon: '🥊' },
  { id: 'ST', category: 'Flexibility', name: 'STRETCH', icon: '🤸' },
  { id: 'KB', category: 'Strength', name: 'KICKBOX', icon: '🥊' },
  { id: 'GF', category: 'Sports', name: 'GOLF', icon: '🏌️' },
  { id: 'CY', category: 'Cardio', name: 'CYCLING', icon: '🚴' },
  { id: 'SW', category: 'Cardio', name: 'SWIMMING', icon: '🏊' },
  { id: 'BB', category: 'Sports', name: 'BASEBALL', icon: '⚾' },
  { id: 'JR', category: 'Cardio', name: 'ROPE', icon: '🪢' },
  { id: 'SC', category: 'Sports', name: 'SOCCER', icon: '⚽' },
  { id: 'TN', category: 'Sports', name: 'TENNIS', icon: '🎾' },
  { id: 'FB', category: 'Sports', name: 'FOOTBALL', icon: '🏈' },
  { id: 'MA', category: 'Combat', name: 'MMA', icon: '🥋' },
  { id: 'RW', category: 'Cardio', name: 'ROWING', icon: '🚣' },
  { id: 'SQ', category: 'Sports', name: 'SQUASH', icon: '🏸' },
  { id: 'CF', category: 'Strength', name: 'CROSSFIT', icon: '🚜' },
  { id: 'HK', category: 'Cardio', name: 'HIKING', icon: '🥾' },
  { id: 'SP', category: 'Cardio', name: 'SPRINTING', icon: '⚡' },
  { id: 'PL', category: 'Flexibility', name: 'PILATES', icon: '🧎' },
  { id: 'RB', category: 'Sports', name: 'RUGBY', icon: '🏉' },
  { id: 'WK', category: 'Strength', name: 'WALKING', icon: '🚶' }
];

const DEFAULT_STATE = {
  playerName: 'SHAQ',
  level: 1,
  effortXp: 0,
  stats: {
    chest: 100, back: 90, legs: 135, cardio: 15,
    shoulders: 85, biceps: 110, triceps: 95, core: 120
  },
  ghostStats: { chest: 120, back: 100, legs: 150, cardio: 20 },
  history: [],
  enabledActivities: NYC_ACTIVITIES.map(a => a.name),
  enabledExercises: DEFAULT_EXERCISES
};

export default function App() {
  const [activeTab, setActiveTab] = useState('Home');
  const [gameState, setGameState] = useState(null); // null means not logged in
  const [isLoading, setIsLoading] = useState(true);
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'onboarding'

  const syncWithBackend = (codeOverride) => {
    const saveCode = codeOverride || localStorage.getItem('shaqtivity_saveCode');
    if (!saveCode) {
      setIsLoading(false);
      return Promise.resolve();
    }

    return fetch(`${API_BASE}/api/user/${saveCode}`)
      .then(res => {
        if (!res.ok) throw new Error('No user');
        return res.json();
      })
      .then(dbUser => {
        const mappedState = mapDbUserToGameState(dbUser);
        setGameState(mappedState);
        
        // Push the latest data to the native iOS Widget via Capacitor Plugin
        try {
          WidgetSync.syncData({
            level: mappedState.level,
            effortXp: mappedState.effortXp,
            avatarUrl: mappedState.avatarUrl
          });
        } catch (e) {
          // It will fail gracefully if not running in the native iOS app
        }
        
        setIsLoading(false);
      })
      .catch(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    syncWithBackend();
  }, []);

  const handleLoginSuccess = (saveCode) => {
    localStorage.setItem('shaqtivity_saveCode', saveCode);
    setIsLoading(true);
    syncWithBackend(saveCode);
  };

  const renderTab = () => {
    switch (activeTab) {
      case 'Home': return <Dashboard state={gameState} />;
      case 'Calendar': return <CalendarTab state={gameState} />;
      case 'Log': return <LoggerTab state={gameState} setGameState={setGameState} syncWithBackend={syncWithBackend} />;
      case 'Stats': return <StatsTab state={gameState} />;
      case 'Widget': return <WidgetTab state={gameState} />;
      case 'Settings': return <SettingsTab state={gameState} setGameState={setGameState} />;
      default: return <SettingsTab state={gameState} setGameState={setGameState} />;
    }
  }

  if (isLoading) {
    return (
      <div style={{ background: '#000', color: 'var(--accent-green)', height: '100vh', width: '100vw', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        LOADING...
      </div>
    );
  }

  if (!gameState) {
    if (authMode === 'onboarding') {
      return <OnboardingScreen setGameState={setGameState} onComplete={handleLoginSuccess} onCancel={() => setAuthMode('login')} />;
    }
    return <LoginScreen onLoginSuccess={handleLoginSuccess} onStartNewGame={() => setAuthMode('onboarding')} />;
  }

  return (
    <>
      <div className="header" style={{ fontSize: '14px', letterSpacing: '1px', paddingTop: 'env(safe-area-inset-top, 40px)' }}>SHAQTIVITY</div>
      <div className="content-area" style={{ overflow: 'hidden' }}>
        {renderTab()}
      </div>
      <div className="tab-bar" style={{ padding: '10px 0' }}>
        {['Home', 'Calendar', 'Log', 'Stats', 'Settings'].map(tab => (
          <button
            key={tab}
            className={`tab-button ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
            style={{ fontSize: '10px', padding: '10px' }}
          >
            <div className="tab-icon" style={{ fontSize: '16px', marginBottom: '5px' }}>{getIcon(tab)}</div>
            {tab === 'Settings' ? 'SETTING' : tab.toUpperCase()}
          </button>
        ))}
      </div>
    </>
  )
}

function RetroKeyboard({ onKey, onBackspace, onConfirm }) {
  const keys = [
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['Z', 'X', 'C', 'V', 'B', 'N', 'M']
  ];

  return (
    <div style={{ background: '#1a1a2e', padding: '10px', display: 'flex', flexDirection: 'column', gap: '5px', width: '100%', borderTop: '2px solid #333' }}>
      {keys.map((row, i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'center', gap: '5px' }}>
          {row.map(key => (
            <button
              key={key}
              onClick={() => onKey(key)}
              style={{
                flex: 1,
                maxWidth: '35px',
                height: '40px',
                background: '#2d3748',
                color: 'white',
                border: '2px solid #444',
                borderRadius: '4px',
                fontSize: '14px',
                fontFamily: 'inherit',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                boxShadow: '2px 2px 0 #000'
              }}
            >
              {key}
            </button>
          ))}
          {i === 3 && (
            <button
              onClick={onBackspace}
              style={{
                padding: '0 10px',
                height: '40px',
                background: '#e53e3e',
                color: 'white',
                border: '2px solid #444',
                borderRadius: '4px',
                fontSize: '12px',
                fontFamily: 'inherit',
                boxShadow: '2px 2px 0 #000'
              }}
            >
              DEL
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

function LoginScreen({ onLoginSuccess, onStartNewGame }) {
  const [saveCode, setSaveCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleKey = (key) => {
    if (saveCode.length < 6) setSaveCode(prev => prev + key);
  };

  const handleBackspace = () => {
    setSaveCode(prev => prev.slice(0, -1));
  };

  const handleLogin = async () => {
    if (saveCode.length < 6) return;
    setIsLoading(true);
    setError('');
    
    try {
      const res = await fetch(`${API_BASE}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ saveCode })
      });
      
      if (!res.ok) {
        setError('INVALID SAVE CODE');
        setIsLoading(false);
        return;
      }
      
      const user = await res.json();
      onLoginSuccess(user.saveCode);
    } catch (err) {
      setError('NETWORK ERROR');
      setIsLoading(false);
    }
  };

  return (
    <div style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column', background: '#000' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', gap: '20px', paddingTop: 'env(safe-area-inset-top, 60px)' }}>
        <div style={{ textAlign: 'center', width: '100%', padding: '0 20px', marginBottom: '10px' }}>
          <div style={{ fontSize: '8vw', color: 'var(--accent-green)', textShadow: '4px 4px 0 #000', textAlign: 'center' }}>SHAQTIVITY</div>
          <div style={{ fontSize: '8px', color: 'var(--accent-orange)', marginTop: '5px' }}>RPG FITNESS TRACKER</div>
        </div>

        <div className="panel" style={{ width: '100%', maxWidth: '300px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
          <div style={{ fontSize: '10px', color: 'var(--text-main)' }}>ENTER SAVE CODE</div>
          <div style={{ 
            background: '#000', 
            border: '2px solid #444', 
            color: 'var(--accent-green)', 
            padding: '10px', 
            width: '160px', 
            textAlign: 'center', 
            fontSize: '18px',
            minHeight: '45px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            letterSpacing: '2px'
          }}>
            {saveCode || 'XXXXXX'}
            <span className="blink" style={{ marginLeft: '2px', borderLeft: '2px solid var(--accent-green)', height: '20px' }}></span>
          </div>
          {error && <div style={{ color: 'red', fontSize: '8px' }}>{error}</div>}
          <button 
            onClick={handleLogin}
            disabled={isLoading || saveCode.length < 6}
            className="retro-btn btn-action" 
            style={{ width: '100%', marginTop: '10px', opacity: (isLoading || saveCode.length < 6) ? 0.5 : 1 }}
          >
            {isLoading ? 'LOADING...' : 'CONTINUE'}
          </button>
        </div>

        <button onClick={onStartNewGame} className="retro-btn btn-warning" style={{ width: '100%', maxWidth: '300px' }}>
          NEW GAME
        </button>
      </div>

      <RetroKeyboard onKey={handleKey} onBackspace={handleBackspace} onConfirm={handleLogin} />
    </div>
  );
}

function mapDbUserToGameState(dbUser) {
  const stats = {};
  if (dbUser.stats) {
    dbUser.stats.forEach(s => {
      stats[s.muscleGroup] = s.powerLevel;
    });
  }

  const history = (dbUser.sessions || []).map(sess => ({
    id: sess.id,
    date: sess.sessionDate,
    status: sess.status,
    reason: sess.excuseReason,
    exercises: (sess.exercises || []).map(ex => ({
      id: ex.id,
      name: ex.exerciseName,
      muscle: ex.targetMuscle,
      sets: (ex.sets || []).map(set => ({
        id: set.id,
        reps: set.reps,
        targetReps: set.targetReps,
        weight: set.weight,
        minutes: set.minutes,
        targetMinutes: set.targetMinutes,
        completed: set.isCompleted
      }))
    }))
  }));

  let enabledActivities = [...DEFAULT_STATE.enabledActivities];
  let enabledExercises = JSON.parse(JSON.stringify(DEFAULT_STATE.enabledExercises));
  
  if (dbUser.preferences && dbUser.preferences.length > 0) {
    dbUser.preferences.forEach(pref => {
      if (pref.type === 'ACTIVITY') {
        if (!pref.isEnabled) {
          enabledActivities = enabledActivities.filter(a => a !== pref.name);
        } else if (!enabledActivities.includes(pref.name)) {
          enabledActivities.push(pref.name);
        }
      } else if (pref.type === 'EXERCISE') {
        for (const [muscle, exercises] of Object.entries(enabledExercises)) {
          if (exercises.includes(pref.name) && !pref.isEnabled) {
            enabledExercises[muscle] = exercises.filter(e => e !== pref.name);
          }
        }
      }
    });
  }

  return {
    ...DEFAULT_STATE,
    id: dbUser.id,
    saveCode: dbUser.saveCode,
    playerName: dbUser.playerName,
    avatarUrl: dbUser.avatarUrl,
    level: dbUser.level,
    effortXp: dbUser.effortXp,
    stats,
    history,
    enabledActivities,
    enabledExercises
  };
}

function getIcon(tab) {
  switch (tab) {
    case 'Home': return '🏠'; case 'Calendar': return '📅';
    case 'Log': return '📝'; case 'Stats': return '📊'; case 'Widget': return '📱'; case 'Settings': return '⚙️';
    default: return 'X';
  }
}

function OnboardingScreen({ setGameState, onComplete, onCancel }) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [charClass, setCharClass] = useState(null);
  const [powerLevel, setPowerLevel] = useState(null);
  const [environment, setEnvironment] = useState(null);
  const [selectedAvatar, setSelectedAvatar] = useState('/avatars/male/male_01.png');
  const [avatarFilter, setAvatarFilter] = useState('male');
  const [isFinishing, setIsFinishing] = useState(false);
  const [onboardingError, setOnboardingError] = useState('');

  const completeOnboarding = async () => {
    setIsFinishing(true);
    setOnboardingError('');
    try {
      const response = await fetch(`${API_BASE}/api/user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerName: name || 'PLAYER 1',
          startingClass: charClass,
          powerLevel,
          environment,
          avatarUrl: selectedAvatar
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`SERVER ERROR: ${response.status} - ${errorText.substring(0, 50)}`);
      }
      
      const data = await response.json();
      onComplete(data.saveCode);
    } catch (err) {
      console.error("Failed to save user to DB:", err);
      setOnboardingError(err.message.includes('SERVER ERROR') ? err.message : 'NETWORK ERROR. CHECK CONNECTION.');
      setIsFinishing(false);
    }
  };

  const getAvatarsList = (gender) => {
    const list = [];
    for (let i = 1; i <= 6; i++) {
      list.push(`/avatars/${gender}/${gender}_${i.toString().padStart(2, '0')}.png`);
    }
    return list;
  };

  return (
    <div style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-color)', color: 'var(--text-main)' }}>
      <div className="header" style={{ fontSize: '14px', borderBottom: '4px solid var(--panel-border)', background: 'var(--panel-bg)' }}>NEW GAME+</div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '20px', minHeight: 0 }}>
      
      {step === 1 && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '20px' }}>
          <div style={{ fontSize: '10px', color: 'var(--accent-orange)', textAlign: 'center' }}>ENTER PLAYER NAME</div>
          <div style={{ 
            background: '#000', 
            color: 'var(--accent-green)', 
            border: '4px solid var(--panel-border)', 
            padding: '15px', 
            fontSize: '16px', 
            textAlign: 'center',
            minHeight: '55px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            {name || '...'}
            <span className="blink" style={{ marginLeft: '2px', borderLeft: '2px solid var(--accent-green)', height: '20px' }}></span>
          </div>
          
          <div style={{ flex: 1 }}></div>
          
          <RetroKeyboard 
            onKey={(k) => name.length < 12 && setName(prev => prev + k)} 
            onBackspace={() => setName(prev => prev.slice(0, -1))}
            onConfirm={() => name && setStep(2)}
          />

          <button 
            disabled={!name}
            onClick={() => setStep(2)}
            className="retro-btn btn-action" style={{ opacity: name ? 1 : 0.5, marginTop: '10px' }}
          >
            CONFIRM
          </button>
        </div>
      )}

      {step === 2 && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div style={{ fontSize: '10px', color: 'var(--accent-orange)', textAlign: 'center', marginBottom: '10px' }}>SELECT STARTING CLASS</div>
          {[
            { id: 'brawler', icon: '🥊', name: 'THE BRAWLER', desc: '+ Combat & Sports' },
            { id: 'tank', icon: '🛡️', name: 'THE TANK', desc: '+ Strength & Lifting' },
            { id: 'sprinter', icon: '⚡', name: 'THE SPRINTER', desc: '+ Cardio & Speed' },
            { id: 'acrobat', icon: '🤸', name: 'THE ACROBAT', desc: '+ Flexibility & Core' },
          ].map(c => (
            <button 
              key={c.id}
              onClick={() => { setCharClass(c.id); setStep(3); }}
              className="retro-btn"
              style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '15px', textAlign: 'left', backgroundColor: 'var(--btn-bg)' }}
            >
              <div style={{ fontSize: '24px' }}>{c.icon}</div>
              <div>
                <div style={{ fontSize: '12px' }}>{c.name}</div>
                <div style={{ fontSize: '8px', color: 'var(--text-muted)', marginTop: '5px' }}>{c.desc}</div>
              </div>
            </button>
          ))}
        </div>
      )}

      {step === 3 && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '15px', justifyContent: 'center' }}>
          <div style={{ fontSize: '10px', color: 'var(--accent-orange)', textAlign: 'center', marginBottom: '20px' }}>ASSESS CURRENT POWER LEVEL</div>
          {[
            { id: 'beginner', name: 'NOOB', desc: 'Just starting the grind' },
            { id: 'intermediate', name: 'CASUAL', desc: 'Some experience' },
            { id: 'advanced', name: 'VETERAN', desc: 'Already a beast' }
          ].map(lvl => (
            <button 
              key={lvl.id}
              onClick={() => { setPowerLevel(lvl.id); setStep(4); }}
              className="retro-btn" style={{ padding: '15px' }}
            >
              <div style={{ fontSize: '12px', marginBottom: '5px' }}>{lvl.name}</div>
              <div style={{ fontSize: '8px', color: 'var(--text-muted)' }}>{lvl.desc}</div>
            </button>
          ))}
        </div>
      )}

      {step === 4 && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '15px', justifyContent: 'center' }}>
          <div style={{ fontSize: '10px', color: 'var(--accent-orange)', textAlign: 'center', marginBottom: '20px' }}>TRAINING GROUND</div>
          {[
            { id: 'gym', name: 'COMMERCIAL GYM', desc: 'All equipment available' },
            { id: 'home', name: 'HOME GYM', desc: 'Dumbbells & basic gear' },
            { id: 'bodyweight', name: 'NO EQUIPMENT', desc: 'Pure bodyweight only' }
          ].map(env => (
            <button 
              key={env.id}
              onClick={() => { setEnvironment(env.id); setStep(5); }}
              className="retro-btn" style={{ padding: '15px' }}
            >
              <div style={{ fontSize: '12px', marginBottom: '5px' }}>{env.name}</div>
              <div style={{ fontSize: '8px', color: 'var(--text-muted)' }}>{env.desc}</div>
            </button>
          ))}
        </div>
      )}

      {step === 5 && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div style={{ fontSize: '10px', color: 'var(--accent-orange)', textAlign: 'center' }}>CHARACTER SELECTION</div>
          <div style={{ fontSize: '8px', color: 'var(--text-muted)', textAlign: 'center' }}>CHOOSE YOUR PIXEL SPRITE</div>
          
          <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '10px' }}>
            <button 
              onClick={() => setAvatarFilter('male')}
              className={`retro-btn ${avatarFilter === 'male' ? 'active' : ''}`}
              style={{ padding: '8px', flex: 1, background: avatarFilter === 'male' ? 'var(--accent-blue)' : '#222', color: avatarFilter === 'male' ? '#000' : '#fff' }}
            >MALE</button>
            <button 
              onClick={() => setAvatarFilter('female')}
              className={`retro-btn ${avatarFilter === 'female' ? 'active' : ''}`}
              style={{ padding: '8px', flex: 1, background: avatarFilter === 'female' ? 'var(--accent-blue)' : '#222', color: avatarFilter === 'female' ? '#000' : '#fff' }}
            >FEMALE</button>
          </div>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(2, 1fr)', 
            gap: '30px', 
            padding: '10px 40px', 
            marginTop: '10px', 
            overflow: 'hidden',
            justifyItems: 'center'
          }}>
            {getAvatarsList(avatarFilter).map(url => (
              <div 
                key={url}
                onClick={() => setSelectedAvatar(url)}
                style={{
                  background: '#000',
                  border: selectedAvatar === url ? '2px solid var(--accent-green)' : '2px solid #333',
                  borderRadius: '8px',
                  padding: '5px',
                  cursor: 'pointer',
                  aspectRatio: '1/1',
                  width: '100px',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  boxSizing: 'border-box'
                }}
              >
                <img src={url} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'contain', imageRendering: 'pixelated' }} />
              </div>
            ))}
          </div>

          <div style={{ padding: '10px 0 20px 0', display: 'flex', flexDirection: 'column', gap: '10px', flexShrink: 0 }}>
            {onboardingError && <div style={{ color: 'red', fontSize: '8px', textAlign: 'center' }}>{onboardingError}</div>}

            <button 
              onClick={completeOnboarding} 
              disabled={isFinishing}
              className="retro-btn btn-action" 
              style={{ padding: '15px', fontSize: '12px', opacity: isFinishing ? 0.7 : 1 }}
            >
              {isFinishing ? 'LOADING...' : 'FINISH'}
            </button>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

function getShorthand(name) {
  const map = {
    'BASKETBALL': 'B-BALL',
    'VOLLEYBALL': 'V-BALL',
    'FOOTBALL': 'F-BALL',
    'WEIGHTLIFTING': 'LIFT',
    'LIFTING': 'LIFT',
    'SPRINTING': 'SPRINT',
    'CLIMBING': 'CLIMB',
    'KICKBOX': 'K-BOX',
    'STRETCH': 'STRTCH',
    'SWIMMING': 'SWIM',
    'CROSSFIT': 'X-FIT',
    'BICYCLE CRUNCHES': 'BIKE CR',
    'BODYWT': 'BODYWT'
  };
  return map[name.toUpperCase()] || name;
}

const MUSCLE_COLORS = {
  chest: 'var(--accent-orange)',
  back: '#ff00ff',
  shoulders: 'var(--accent-blue)',
  biceps: 'white',
  legs: 'yellow',
  triceps: 'var(--accent-green)',
  core: 'red',
  cardio: '#00f5ff'
};

function Dashboard({ state }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', paddingTop: '10px', height: '100%' }}>

      <div className="panel" style={{ borderColor: 'var(--accent-blue)', padding: '13px 12px 10px 12px' }}>
        <div className="panel-title" style={{ fontSize: '10px' }}>PLAYER STATUS</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="text-blue" style={{ fontSize: '14px', textTransform: 'uppercase' }}>{state.playerName}</div>
          <div style={{ fontSize: '10px' }}>LVL: {state.level}</div>
          <div className="text-muted" style={{ fontSize: '10px' }}>EFFORT: {state.effortXp}/{state.level * 500}</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '10px' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div className="panel text-center" style={{ padding: '12px 0', borderColor: MUSCLE_COLORS.chest }}>
            <div className="panel-title" style={{ fontSize: '8px' }}>CHEST</div>
            <div style={{ color: MUSCLE_COLORS.chest, fontSize: '28px' }}>{state.stats.chest || 100}</div>
          </div>
          <div className="panel text-center" style={{ padding: '12px 0', borderColor: MUSCLE_COLORS.back }}>
            <div className="panel-title" style={{ fontSize: '8px' }}>BACK</div>
            <div style={{ color: MUSCLE_COLORS.back, fontSize: '28px' }}>{state.stats.back || 90}</div>
          </div>
          <div className="panel text-center" style={{ padding: '12px 0', borderColor: MUSCLE_COLORS.shoulders }}>
            <div className="panel-title" style={{ fontSize: '8px' }}>SHLDR</div>
            <div style={{ color: MUSCLE_COLORS.shoulders, fontSize: '28px' }}>{state.stats.shoulders || 85}</div>
          </div>
          <div className="panel text-center" style={{ padding: '12px 0', borderColor: MUSCLE_COLORS.biceps }}>
            <div className="panel-title" style={{ fontSize: '8px' }}>BICEP</div>
            <div style={{ color: MUSCLE_COLORS.biceps, fontSize: '28px' }}>{state.stats.biceps || 110}</div>
          </div>
        </div>

        <div style={{ flex: 1.5, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '0 5px' }}>
          <img
            src={state.avatarUrl ? `${state.avatarUrl}?t=${new Date().getTime()}` : `/avatar_front.png?t=${new Date().getTime()}`}
            alt="Player Avatar"
            style={{
              width: '100%',
              objectFit: 'contain',
              imageRendering: 'pixelated',
              filter: 'drop-shadow(0 0 15px rgba(74, 222, 128, 0.4))'
            }}
          />
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div className="panel text-center" style={{ padding: '12px 0', borderColor: MUSCLE_COLORS.legs }}>
            <div className="panel-title" style={{ fontSize: '8px' }}>LEGS</div>
            <div style={{ color: MUSCLE_COLORS.legs, fontSize: '28px' }}>{state.stats.legs || 135}</div>
          </div>
          <div className="panel text-center" style={{ padding: '12px 0', borderColor: MUSCLE_COLORS.triceps }}>
            <div className="panel-title" style={{ fontSize: '8px' }}>TRICP</div>
            <div style={{ color: MUSCLE_COLORS.triceps, fontSize: '28px' }}>{state.stats.triceps || 95}</div>
          </div>
          <div className="panel text-center" style={{ padding: '12px 0', borderColor: MUSCLE_COLORS.core }}>
            <div className="panel-title" style={{ fontSize: '8px' }}>CORE</div>
            <div style={{ color: MUSCLE_COLORS.core, fontSize: '28px' }}>{state.stats.core || 120}</div>
          </div>
          <div className="panel text-center" style={{ padding: '12px 0', borderColor: MUSCLE_COLORS.cardio }}>
            <div className="panel-title" style={{ fontSize: '8px' }}>CARDIO</div>
            <div style={{ color: MUSCLE_COLORS.cardio, fontSize: '28px' }}>{state.stats.cardio || 15}</div>
          </div>
        </div>
      </div>

      <div className="panel" style={{ borderColor: 'var(--text-muted)' }}>
        <div className="panel-title" style={{ fontSize: '10px' }}>TODAY'S PLAN</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', paddingTop: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ fontSize: '32px' }}>🏀</div>
            <div style={{ fontSize: '12px', lineHeight: '18px' }}>{getShorthand('BASKETBALL')}<br /><span className="text-muted" style={{ fontSize: '8px' }}>PICKUP GAMES</span></div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ fontSize: '32px' }}>🏋️</div>
            <div style={{ fontSize: '12px', lineHeight: '18px' }}>{getShorthand('LIFTING')}<br /><span className="text-muted" style={{ fontSize: '8px' }}>PUSH DAY</span></div>
          </div>
        </div>
      </div>
    </div>
  )
}

function SettingsTab({ state, setGameState }) {
  const [selectedMuscle, setSelectedMuscle] = useState('chest');

  const exportData = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", "true_fitness_save.json");
    dlAnchorElem.click();
  };

  const importData = (event) => {
    const fileReader = new FileReader();
    fileReader.readAsText(event.target.files[0], "UTF-8");
    fileReader.onload = e => {
      try {
        const loaded = JSON.parse(e.target.result);
        if (loaded.stats && loaded.playerName) {
          setGameState(loaded);
          alert('Save file loaded successfully!');
        } else {
          alert('Corrupted save file.');
        }
      } catch (err) {
        alert('Invalid save file format!');
      }
    };
  };

  const toggleActivity = async (actName) => {
    const isEnabled = !state.enabledActivities.includes(actName);
    
    // Optimistic UI update
    setGameState(prev => ({
      ...prev,
      enabledActivities: isEnabled
        ? [...prev.enabledActivities, actName]
        : prev.enabledActivities.filter(n => n !== actName)
    }));

    try {
      await fetch(`${API_BASE}/api/preferences`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: state.id,
          type: 'ACTIVITY',
          name: actName,
          isEnabled
        })
      });
    } catch (err) {
      console.error("Failed to save preference", err);
    }
  };

  const toggleExercise = async (muscle, exerciseName) => {
    const muscleExs = state.enabledExercises[muscle] || [];
    const isEnabled = !muscleExs.includes(exerciseName);
    
    // Optimistic UI update
    setGameState(prev => ({
      ...prev,
      enabledExercises: {
        ...prev.enabledExercises,
        [muscle]: isEnabled
          ? [...muscleExs, exerciseName]
          : muscleExs.filter(n => n !== exerciseName)
      }
    }));

    try {
      await fetch(`${API_BASE}/api/preferences`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: state.id,
          type: 'EXERCISE',
          name: exerciseName,
          isEnabled
        })
      });
    } catch (err) {
      console.error("Failed to save preference", err);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', height: '100%', overflow: 'hidden', paddingTop: '10px' }}>

      {/* Top 2 Sections - Profile and Data Management */}
      <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
        <div className="panel" style={{ flex: 1, borderColor: 'var(--accent-blue)', padding: '12px 10px' }}>
          <div className="panel-title" style={{ fontSize: '10px' }}>PROFILE</div>
          <div style={{ marginTop: '5px' }}>
            <input
              value={state.playerName}
              onChange={e => setGameState(prev => ({ ...prev, playerName: e.target.value }))}
              style={{ background: '#000', color: 'var(--text-main)', border: '2px solid #555', padding: '5px', fontFamily: 'inherit', fontSize: '10px', width: '100%', outline: 'none' }}
            />
          </div>
        </div>

        <div className="panel" style={{ flex: 1, borderColor: 'var(--accent-orange)', padding: '12px 10px' }}>
          <div className="panel-title" style={{ fontSize: '10px' }}>YOUR SAVE CODE</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginTop: '5px' }}>
            <div style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--accent-green)', textAlign: 'center', letterSpacing: '4px' }}>
              {state.saveCode}
            </div>
            <div style={{ fontSize: '7px', color: 'var(--text-muted)', textAlign: 'center' }}>SAVE THIS TO LOG IN ON OTHER DEVICES</div>
          </div>
        </div>
      </div>

      {/* Activities Grid */}
      <div className="panel" style={{ flex: 1, borderColor: '#ff00ff', padding: '12px 10px', display: 'flex', flexDirection: 'column' }}>
        <div className="panel-title" style={{ fontSize: '10px' }}>ACTIVITIES</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', rowGap: '4px', columnGap: '2px', flex: 1, alignContent: 'space-between', padding: '5px 8px' }}>
          {NYC_ACTIVITIES.map(act => (
            <label key={act.id} style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center', cursor: 'pointer', textAlign: 'center', width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <input
                  type="checkbox"
                  checked={(state.enabledActivities || []).includes(act.name)}
                  onChange={() => toggleActivity(act.name)}
                  style={{ accentColor: '#ff00ff', margin: 0, width: '12px', height: '12px', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '14px', lineHeight: '14px' }}>{act.icon}</span>
              </div>
              <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', width: '100%', fontSize: '7px' }}>{act.name}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Exercise Grid */}
      <div className="panel" style={{ flex: 1, borderColor: 'var(--accent-green)', padding: '12px 10px', display: 'flex', flexDirection: 'column' }}>
        <div className="panel-title" style={{ fontSize: '10px' }}>EXERCISES</div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px', marginBottom: '8px', flexShrink: 0, paddingTop: '5px' }}>
          {Object.keys(DEFAULT_EXERCISES).map(m => (
            <button
              key={m}
              onClick={() => setSelectedMuscle(m)}
              style={{
                background: selectedMuscle === m ? 'var(--accent-green)' : '#222',
                color: selectedMuscle === m ? '#000' : 'white',
                border: 'none', padding: '4px 2px', fontFamily: 'inherit', fontSize: '8px', cursor: 'pointer'
              }}
            >
              {m.toUpperCase()}
            </button>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', justifyItems: 'start', rowGap: '8px', columnGap: '12px', flex: 1, alignContent: 'space-between', padding: '5px 12px' }}>
          {DEFAULT_EXERCISES[selectedMuscle].map(ex => (
            <label key={ex} style={{ display: 'flex', gap: '10px', alignItems: 'center', cursor: 'pointer', width: '100%' }}>
              <input
                type="checkbox"
                checked={(state.enabledExercises[selectedMuscle] || []).includes(ex)}
                onChange={() => toggleExercise(selectedMuscle, ex)}
                style={{ accentColor: 'var(--accent-green)', margin: 0, width: '16px', height: '16px' }}
              />
              <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', fontSize: '8px' }}>{ex.toUpperCase()}</span>
            </label>
          ))}
        </div>
      </div>

    </div>
  );
}

let globalIdCounter = 1000;

function LoggerTab({ state, setGameState, syncWithBackend }) {
  const [isAddPopupOpen, setIsAddPopupOpen] = useState(false);
  const [popupTab, setPopupTab] = useState('lifts');
  const [workout, setWorkout] = useState([
    {
      id: 'ex1', exercise: 'Bench Press', muscle: 'chest',
      sets: [
        { id: 's1', reps: 10, targetReps: 10, weight: 135, completed: false },
        { id: 's2', reps: 8, targetReps: 8, weight: 155, completed: false },
        { id: 's3', reps: 6, targetReps: 6, weight: 165, completed: false }
      ]
    },
    {
      id: 'ex2', exercise: 'Incline DB Press', muscle: 'chest',
      sets: [
        { id: 's4', reps: 10, targetReps: 10, weight: 60, completed: false },
        { id: 's2_2', reps: 8, targetReps: 8, weight: 155, completed: false }
      ]
    },
    {
      id: 'ex3', exercise: 'Overhead Press', muscle: 'shoulders',
      sets: [
        { id: 's3_2', reps: 10, targetReps: 10, weight: 95, completed: false },
        { id: 's4_2', reps: 8, targetReps: 8, weight: 105, completed: false }
      ]
    },
    {
      id: 'ex4', exercise: 'Tricep Pushdown', muscle: 'triceps',
      sets: [
        { id: 's5', reps: 12, targetReps: 12, weight: 50, completed: false },
        { id: 's6', reps: 12, targetReps: 12, weight: 60, completed: false }
      ]
    },
    {
      id: 'ex5', exercise: 'Crunches', muscle: 'core',
      sets: [
        { id: 's7', reps: 20, targetReps: 20, completed: false },
        { id: 's8', reps: 20, targetReps: 20, completed: false },
        { id: 's9', reps: 20, targetReps: 20, completed: false }
      ]
    },
    {
      id: 'ex6', exercise: 'Treadmill', muscle: 'cardio',
      sets: [
        { id: 's10', minutes: 20, targetMinutes: 20, completed: false }
      ]
    }
  ]);

  const toggleSet = (exId, setId) => {
    setWorkout(prev => prev.map(ex => {
      if (ex.id !== exId) return ex;
      const tSet = ex.sets.find(s => s.id === setId);
      const isCompleting = !tSet.completed;

      const newSets = ex.sets.map(s => s.id === setId ? { ...s, completed: isCompleting } : s);

      if (isCompleting) {
        setGameState(curr => {
          const newStats = { ...curr.stats };
          let newEffort = curr.effortXp + 50;
          let newLevel = curr.level;

          if (ex.muscle === 'cardio') {
            if (tSet.minutes > tSet.targetMinutes) newEffort += 100;
            if (!newStats.cardio) newStats.cardio = 50;
            if (tSet.minutes > newStats.cardio) newStats.cardio = tSet.minutes;
          } else if (ex.muscle === 'core') {
            if (tSet.reps > tSet.targetReps) newEffort += 100;
            if (!newStats.core) newStats.core = 50;
            if (tSet.reps > newStats.core) newStats.core = tSet.reps;
          } else {
            const oneRM = Math.floor(tSet.weight * (1 + (tSet.reps / 30)));
            if (tSet.reps > tSet.targetReps) newEffort += 100;
            if (!newStats[ex.muscle]) newStats[ex.muscle] = 50;
            if (oneRM > newStats[ex.muscle]) newStats[ex.muscle] = oneRM;
          }

          if (newEffort >= newLevel * 500) newLevel++;
          return { ...curr, stats: newStats, effortXp: newEffort, level: newLevel };
        });
      }
      return { ...ex, sets: newSets };
    }));
  };

  const adjust = (exId, setId, field, amount) => {
    setWorkout(prev => prev.map(ex => {
      if (ex.id !== exId) return ex;
      return {
        ...ex,
        sets: ex.sets.map(s => s.id === setId && !s.completed ? { ...s, [field]: Math.max(0, s[field] + amount) } : s)
      };
    }));
  };

  const removeExercise = (exId) => {
    setWorkout(prev => prev.filter(ex => ex.id !== exId));
  };

  const removeSet = (exId, setId) => {
    setWorkout(prev => {
      const mapped = prev.map(ex => {
        if (ex.id !== exId) return ex;
        return { ...ex, sets: ex.sets.filter(s => s.id !== setId) };
      });
      return mapped.filter(ex => ex.sets.length > 0);
    });
  };

  const addSet = (exId) => {
    setWorkout(prev => prev.map(ex => {
      if (ex.id !== exId) return ex;
      globalIdCounter++;
      const lastSet = ex.sets[ex.sets.length - 1];
      const newSet = { ...lastSet, id: 's_dup_' + globalIdCounter, completed: false };
      return { ...ex, sets: [...ex.sets, newSet] };
    }));
  };

  const handleAdd = (exerciseName, muscle) => {
    globalIdCounter++;
    const newId = 'ex_new_' + globalIdCounter;
    let baseSet;
    let limit = 3;
    if (muscle === 'cardio') {
      baseSet = { minutes: 20, targetMinutes: 20, completed: false };
      limit = 1;
    } else if (muscle === 'core') {
      baseSet = { reps: 20, targetReps: 20, completed: false };
    } else {
      baseSet = { reps: 10, targetReps: 10, weight: 100, completed: false };
    }

    const sets = Array.from({ length: limit }).map(() => {
      globalIdCounter++;
      return { ...baseSet, id: 's_new_' + globalIdCounter };
    });

    const newBlock = { id: newId, exercise: exerciseName, muscle: muscle, sets };
    setWorkout(prev => [...prev, newBlock]);
    setIsAddPopupOpen(false);
  };

  const targetMuscles = [...new Set(workout.filter(w => w.muscle !== 'core' && w.muscle !== 'cardio').map(w => w.muscle))];
  const allMainMuscles = ['chest', 'back', 'shoulders', 'biceps', 'triceps', 'legs'];
  const otherMuscles = allMainMuscles.filter(m => !targetMuscles.includes(m));
  const allChecked = workout.length > 0 && workout.every(ex => ex.sets.every(s => s.completed));

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '8px', overflow: 'hidden', paddingTop: '8px' }}>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, overflowY: 'auto', paddingRight: '2px', paddingTop: '12px' }}>
        {workout.map(ex => (
          <div key={ex.id} className="panel" style={{ display: 'flex', flexDirection: 'column', padding: '10px 6px 4px 6px', borderColor: MUSCLE_COLORS[ex.muscle] || 'var(--accent-orange)' }}>
            <div className="panel-title" style={{ fontSize: '9px', color: 'white', fontWeight: 'bold' }}>{ex.exercise.toUpperCase()}</div>
            <div style={{ position: 'absolute', top: '-16px', right: '5px', display: 'flex', gap: '8px' }}>
              <button onClick={() => removeExercise(ex.id)} style={{ padding: 0, fontSize: '18px', fontWeight: 'bold', margin: '0 4px', color: 'red', border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '24px', width: '24px', textShadow: '2px 2px 0 #000' }}>X</button>
              <button onClick={() => addSet(ex.id)} style={{ padding: 0, fontSize: '22px', fontWeight: 'bold', margin: 0, color: 'var(--accent-green)', border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '24px', width: '24px', textShadow: '2px 2px 0 #000' }}>+</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '4px' }}>
              {ex.sets.map((set, idx) => (
                <div key={set.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '2px 4px', backgroundColor: set.completed ? 'var(--accent-green)' : '#111', color: set.completed ? '#000' : '#fff', border: '1px solid #333' }}>

                  <div style={{ fontSize: '8px', width: '15px' }} className={set.completed ? "text-black" : "text-muted"}>S{idx + 1}</div>

                  <div style={{ display: 'flex', flex: 1, justifyContent: 'space-evenly' }}>
                    {ex.muscle === 'cardio' ? (
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <button onClick={() => adjust(ex.id, set.id, 'minutes', -5)} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: '0 6px' }}>-</button>
                        <span style={{ width: '28px', textAlign: 'center', fontSize: '10px', color: set.completed ? '#000' : (set.minutes > set.targetMinutes ? 'var(--accent-green)' : 'white') }}>{set.minutes}</span>
                        <button onClick={() => adjust(ex.id, set.id, 'minutes', 5)} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: '0 6px' }}>+</button>
                        <span style={{ fontSize: '5px', opacity: 0.6, width: '15px', marginLeft: '6px' }}>MIN</span>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <button onClick={() => adjust(ex.id, set.id, 'reps', -1)} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: '0 6px' }}>-</button>
                        <span style={{ width: '28px', textAlign: 'center', fontSize: '10px', color: set.completed ? '#000' : (set.reps > set.targetReps ? 'var(--accent-green)' : 'white') }}>{set.reps}</span>
                        <button onClick={() => adjust(ex.id, set.id, 'reps', 1)} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: '0 6px' }}>+</button>
                        <span style={{ fontSize: '5px', opacity: 0.6, width: '15px', marginLeft: '6px' }}>REP</span>
                      </div>
                    )}

                    {ex.muscle !== 'cardio' && ex.muscle !== 'core' && (
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <button onClick={() => adjust(ex.id, set.id, 'weight', -5)} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: '0 6px' }}>-</button>
                        <span style={{ width: '32px', textAlign: 'center', fontSize: '10px' }}>{set.weight}</span>
                        <button onClick={() => adjust(ex.id, set.id, 'weight', 5)} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: '0 6px' }}>+</button>
                        <span style={{ fontSize: '5px', opacity: 0.6, width: '15px', marginLeft: '6px' }}>LBS</span>
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {!set.completed && (
                      <button onClick={() => removeSet(ex.id, set.id)} style={{ background: 'none', border: 'none', width: '18px', height: '18px', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', color: 'red', fontSize: '18px', fontWeight: 'bold', padding: 0 }}>
                        −
                      </button>
                    )}
                    <button
                      onClick={() => toggleSet(ex.id, set.id)}
                      style={{
                        background: set.completed ? 'var(--accent-green)' : 'black',
                        border: '2px solid currentColor',
                        width: '18px',
                        height: '18px',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        cursor: 'pointer',
                        color: set.completed ? 'black' : 'white',
                        padding: 0,
                        boxShadow: '1px 1px 0 #444'
                      }}
                    >
                      {set.completed && '⬛'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
        <button onClick={() => setIsAddPopupOpen(true)} className="retro-btn btn-warning" style={{ padding: '10px', fontSize: '10px', flex: 1 }}>
          ADD EXERCISE
        </button>
        <button
          disabled={!allChecked}
          onClick={async () => {
            const payload = {
              userId: state.id,
              sessionDate: new Date().toISOString(),
              status: "COMPLETED",
              effortXp: state.effortXp,
              level: state.level,
              stats: state.stats,
              exercises: workout.map(ex => ({
                name: ex.exercise,
                muscle: ex.muscle,
                sets: ex.sets.map(s => ({
                  reps: s.reps,
                  targetReps: s.targetReps,
                  weight: s.weight,
                  minutes: s.minutes,
                  targetMinutes: s.targetMinutes,
                  completed: s.completed
                }))
              }))
            };

            try {
              const res = await fetch(`${API_BASE}/api/sessions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
              });

              if (!res.ok) {
                const errorData = await res.json();
                if (res.status === 500) {
                  alert('Workout already logged today! Come back tomorrow to keep your streak alive.');
                } else {
                  alert('Error saving workout: ' + errorData.error);
                }
                return;
              }

              await syncWithBackend();
              alert('WORKOUT COMPLETE & SAVED TO DATABASE!');
            } catch (err) {
              console.error("Failed to post session:", err);
              alert("Network error: Could not reach the server.");
            }
          }}
          className="retro-btn btn-action"
          style={{ padding: '10px', fontSize: '10px', flex: 1, opacity: allChecked ? 1 : 0.4, cursor: allChecked ? 'pointer' : 'not-allowed' }}
        >
          FINISH WORKOUT
        </button>
      </div>

      {isAddPopupOpen && (
        <div className="modal-overlay" style={{ zIndex: 100 }}>
          <div className="modal-content panel" style={{ padding: '12px', gap: '10px', maxHeight: '85vh', overflowY: 'auto' }}>

            <div style={{ display: 'flex', borderBottom: '2px solid #444', paddingBottom: '4px', gap: '8px' }}>
              <button onClick={() => setPopupTab('lifts')} style={{ flex: 1, padding: '6px', fontSize: '8px', background: 'none', border: 'none', color: popupTab === 'lifts' ? 'var(--accent-orange)' : '#888', borderBottom: popupTab === 'lifts' ? '2px solid var(--accent-orange)' : 'none', cursor: 'pointer' }}>LIFTS</button>
              <button onClick={() => setPopupTab('cardio')} style={{ flex: 1, padding: '6px', fontSize: '8px', background: 'none', border: 'none', color: popupTab === 'cardio' ? 'white' : '#888', borderBottom: popupTab === 'cardio' ? '2px solid white' : 'none', cursor: 'pointer' }}>ABS & CARDIO</button>
            </div>

            {popupTab === 'lifts' && (
              <>
                <div style={{ fontSize: '8px', color: 'white', marginTop: '4px' }}>TARGET GROUP</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {targetMuscles.map(m => (
                    (state.enabledExercises[m] || []).map(exName => (
                      <button key={exName} onClick={() => handleAdd(exName, m)} className="retro-btn" style={{ fontSize: '7px', padding: '6px', background: 'var(--btn-bg)', borderColor: MUSCLE_COLORS[m], cursor: 'pointer', flex: '1 1 calc(50% - 4px)' }}>
                        {exName.toUpperCase()}
                      </button>
                    ))
                  ))}
                </div>

                <div style={{ fontSize: '8px', color: 'white', marginTop: '8px' }}>OTHER SECTORS</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {otherMuscles.map(m => (
                    (state.enabledExercises[m] || []).map(exName => (
                      <button key={exName} onClick={() => handleAdd(exName, m)} className="retro-btn" style={{ fontSize: '7px', padding: '6px', background: 'transparent', borderColor: MUSCLE_COLORS[m], cursor: 'pointer', flex: '1 1 calc(50% - 4px)' }}>
                        {exName.toUpperCase()}
                      </button>
                    ))
                  ))}
                </div>
              </>
            )}

            {popupTab === 'cardio' && (
              <>
                <div style={{ fontSize: '8px', color: 'white', marginTop: '4px' }}>ABS</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {(state.enabledExercises['core'] || []).map(exName => (
                    <button key={exName} onClick={() => handleAdd(exName, 'core')} className="retro-btn" style={{ fontSize: '7px', padding: '6px', background: '#222', borderColor: MUSCLE_COLORS['core'], cursor: 'pointer', flex: '1 1 calc(50% - 4px)' }}>
                      {exName.toUpperCase()}
                    </button>
                  ))}
                </div>

                <div style={{ fontSize: '8px', color: 'white', marginTop: '8px' }}>CARDIO</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {(state.enabledExercises['cardio'] || []).map(exName => (
                    <button key={exName} onClick={() => handleAdd(exName, 'cardio')} className="retro-btn" style={{ fontSize: '7px', padding: '6px', background: '#222', borderColor: MUSCLE_COLORS['cardio'], cursor: 'pointer', flex: '1 1 calc(50% - 4px)' }}>
                      {exName.toUpperCase()}
                    </button>
                  ))}
                </div>
              </>
            )}

            <button onClick={() => setIsAddPopupOpen(false)} className="retro-btn" style={{ marginTop: '12px', padding: '8px', fontSize: '8px', borderColor: 'black' }}>
              CANCEL
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function CalendarTab({ state }) {
  const ObjectKeys = Object.keys;
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const [plannerOpen, setPlannerOpen] = useState(false);
  const [excuseOpen, setExcuseOpen] = useState(false);
  const [excuseDays, setExcuseDays] = useState(1);
  const [activeExcuse, setActiveExcuse] = useState(null);
  const [tempExcuseType, setTempExcuseType] = useState(null);

  const [dailyPlan, setDailyPlan] = useState([
    { id: 1, type: 'Activity Slot 1', selected: 'BASKETBALL', subType: 'Activity', daysSince: 4 },
    { id: 2, type: 'Activity Slot 2', selected: 'PUSH DAY', subType: 'Lift', daysSince: 1 }
  ]);

  const defaultSuggested = [
    { id: 1, type: 'Activity Slot 1', selected: 'BASKETBALL', subType: 'Activity', daysSince: 4 },
    { id: 2, type: 'Activity Slot 2', selected: 'PUSH DAY', subType: 'Lift', daysSince: 1 }
  ];

  const excuseTypes = [
    { name: 'SICK', icon: '🤒', image: '/excuse_sick_16bit.png', lastUsed: 12 },
    { name: 'VACATION', icon: '🏖️', image: '/excuse_vacation_16bit.png', lastUsed: 45 },
    { name: 'REST', icon: '😴', image: '/excuse_rest_16bit.png', lastUsed: 3 },
    { name: 'INJURY', icon: '🤕', image: '/excuse_injury_16bit.png', lastUsed: 120 }
  ];

  const availableActivities = NYC_ACTIVITIES.filter(a => state.enabledActivities.includes(a.name));

  return (
    <>
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '10px', overflow: 'hidden', paddingTop: '10px' }}>
        <div className="panel" style={{ padding: '16px 12px 12px 12px' }}>
          <div className="panel-title" style={{ fontSize: '10px' }}>{new Date().toLocaleString('default', { month: 'long' }).toUpperCase()}</div>
          <div className="panel-title" style={{ fontSize: '14px', top: '-11px', left: 'auto', right: '10px', cursor: 'pointer', display: 'flex', gap: '12px' }}>
            <span>◀</span>
            <span>▶</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, idx) => <div key={d + idx} className="text-muted text-center" style={{ fontSize: '6px' }}>{d}</div>)}
            {days.map(d => {
              const today = new Date().getDate();
              const hasData = state.history.some(h => {
                const hDate = new Date(h.date);
                return hDate.getDate() === d && hDate.getMonth() === new Date().getMonth();
              });
              return (
                <div key={d} className="text-center" style={{
                  border: '2px solid #555', padding: '6px 0', fontSize: '8px',
                  color: d === today ? 'black' : hasData ? 'black' : 'white', cursor: 'pointer',
                  backgroundColor: d === today ? 'var(--accent-orange)' : hasData ? 'var(--accent-green)' : d < today ? 'var(--btn-bg)' : 'transparent',
                  boxShadow: d === today ? '2px 2px 0 var(--shadow-color)' : 'none'
                }}>{d}</div>
              )
            })}
          </div>
        </div>

        <div className="panel" style={{ flex: 1, borderColor: 'var(--accent-orange)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <div className="text-orange" style={{ fontSize: '10px' }}>{new Date().toLocaleString('default', { weekday: 'long' }).toUpperCase()}</div>
            <div style={{ display: 'flex', gap: '6px' }}>
              {!activeExcuse && (
                <>
                  <button onClick={() => setExcuseOpen(true)} className="retro-btn" style={{ padding: '4px', width: 'auto', fontSize: '8px', borderColor: 'var(--text-muted)' }}>MAKE EXCUSE</button>
                  <button onClick={() => setPlannerOpen(true)} className="retro-btn" style={{ padding: '4px', width: 'auto', fontSize: '8px', borderColor: 'var(--accent-orange)' }}>ADD ACTIVITY</button>
                </>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px', overflowY: 'auto', paddingRight: '2px', flex: 1 }}>
            {activeExcuse ? (
              <div style={{ position: 'relative', display: 'flex', gap: '12px', alignItems: 'center', backgroundColor: '#1a1a1a', border: '2px solid #555', padding: '12px', boxShadow: '2px 2px 0 var(--shadow-color)' }}>
                <div style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img
                    src={activeExcuse.image}
                    alt={activeExcuse.name}
                    onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }}
                    style={{ width: '100%', imageRendering: 'pixelated' }}
                  />
                  <div style={{ fontSize: '32px', display: 'none' }}>{activeExcuse.icon}</div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '10px', color: 'white' }}>{activeExcuse.name}</div>
                  <div style={{ fontSize: '5px', color: 'var(--text-muted)', marginTop: '8px' }}>
                    LAST USED: {activeExcuse.lastUsed} DAYS AGO
                  </div>
                </div>
                <button
                  onClick={() => {
                    setActiveExcuse(null);
                    setDailyPlan(defaultSuggested);
                  }}
                  className="retro-btn"
                  style={{ padding: '4px 8px', fontSize: '8px', width: 'auto' }}
                >
                  LOCK IN
                </button>
              </div>
            ) : (
              dailyPlan.map(slot => (
                <div key={slot.id} style={{ position: 'relative', display: 'flex', gap: '12px', alignItems: 'center', backgroundColor: 'var(--btn-bg)', border: '2px solid var(--panel-border)', padding: '12px', boxShadow: '2px 2px 0 var(--shadow-color)' }}>
                  <div style={{ fontSize: '24px' }}>
                    {(slot.selected === 'PUSH DAY' || slot.subType === 'Lift') ? '🏋️' : (availableActivities.find(a => a.name === slot.selected)?.icon || '⚪')}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '10px', color: 'white' }}>{slot.selected.toUpperCase()}</div>
                    <div style={{ fontSize: '5px', color: 'var(--text-muted)', marginTop: '8px' }}>
                      LAST: {slot.daysSince} DAYS AGO
                    </div>
                  </div>
                  <button
                    onClick={() => setDailyPlan(prev => prev.filter(p => p.id !== slot.id))}
                    style={{ background: 'none', border: 'none', color: 'red', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', padding: '4px' }}
                  >
                    X
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {plannerOpen && (
        <div className="modal-overlay" style={{ zIndex: 110 }}>
          <div className="modal-content panel" style={{ padding: '12px', gap: '10px', maxHeight: '85vh', overflowY: 'auto' }}>
            <div className="text-white text-center" style={{ fontSize: '10px', marginBottom: '8px' }}>ADD ACTIVITY</div>

            {[
              { label: 'SPORT', names: ['BASKETBALL', 'VOLLEYBALL', 'BOXING', 'GOLF', 'BASEBALL', 'SOCCER', 'TENNIS', 'FOOTBALL', 'MMA', 'SQUASH', 'SPRINTING', 'RUGBY', 'CLIMBING'] },
              { label: 'NATURE', names: ['HIKING', 'RUNNING', 'CYCLING', 'SWIMMING', 'ROWING'] },
              { label: 'WELLNESS', names: ['YOGA', 'BODYWT', 'HIIT', 'STRETCH', 'KICKBOX', 'ROPE', 'CROSSFIT', 'PILATES', 'WALKING', 'LIFTING'] }
            ].map(group => (
              <div key={group.label} style={{ marginBottom: '8px' }}>
                <div style={{ fontSize: '8px', color: 'white', marginBottom: '8px' }}>{group.label}</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {group.names.map(name => {
                    const act = NYC_ACTIVITIES.find(a => a.name === name);
                    if (!act) return null;
                    return (
                      <button
                        key={name}
                        onClick={() => {
                          const displayLabel = (name === 'LIFTING') ? 'PUSH DAY' : name;
                          const subType = (name === 'LIFTING') ? 'Lift' : 'Activity';
                          setDailyPlan(prev => [...prev, { id: Date.now(), type: 'Added Activity', selected: displayLabel, subType, daysSince: Math.floor(Math.random() * 5) + 1 }]);
                          setPlannerOpen(false);
                        }}
                        className="retro-btn"
                        style={{ fontSize: '10px', padding: '6px', background: 'var(--btn-bg)', borderColor: '#444', cursor: 'pointer', flex: '1 1 calc(33.33% - 4px)', whiteSpace: 'nowrap', overflow: 'hidden' }}
                      >
                        {act.icon} {getShorthand(name).toUpperCase()}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            <button onClick={() => setPlannerOpen(false)} className="retro-btn" style={{ marginTop: '12px', padding: '8px', fontSize: '8px', borderColor: 'black' }}>
              CANCEL
            </button>
          </div>
        </div>
      )}

      {excuseOpen && (
        <div className="modal-overlay" style={{ zIndex: 110 }}>
          <div className="modal-content panel" style={{ padding: '15px', gap: '12px' }}>
            <div className="text-white text-center" style={{ fontSize: '10px' }}>MAKE EXCUSE</div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {excuseTypes.map(type => (
                <button
                  key={type.name}
                  onClick={() => setTempExcuseType(type)}
                  className="retro-btn"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '10px',
                    backgroundColor: 'var(--btn-bg)',
                    borderColor: tempExcuseType?.name === type.name ? 'var(--accent-orange)' : '#444',
                    boxShadow: tempExcuseType?.name === type.name ? 'inset 0 0 10px rgba(255, 122, 0, 0.3)' : 'none'
                  }}
                >
                  <div style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <img
                      src={type.image}
                      alt={type.name}
                      onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }}
                      style={{ width: '100%', imageRendering: 'pixelated' }}
                    />
                    <div style={{ fontSize: '24px', display: 'none' }}>{type.icon}</div>
                  </div>
                  <div style={{ fontSize: '8px' }}>{type.name}</div>
                </button>
              ))}
            </div>

            <div style={{ marginTop: '5px' }}>
              <div style={{ fontSize: '10px', color: 'white', marginBottom: '8px', textAlign: 'center' }}>DAYS AFFECTED</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px', justifyContent: 'center' }}>
                <button
                  onClick={() => setExcuseDays(Math.max(1, excuseDays - 1))}
                  className="retro-btn"
                  style={{ width: '40px', height: '40px', fontSize: '20px', padding: 0 }}
                >-</button>
                <div style={{
                  fontSize: '24px',
                  width: '60px',
                  textAlign: 'center',
                  border: '2px solid #555',
                  padding: '5px',
                  background: 'black'
                }}>{excuseDays}</div>
                <button
                  onClick={() => setExcuseDays(Math.min(100, excuseDays + 1))}
                  className="retro-btn"
                  style={{ width: '40px', height: '40px', fontSize: '20px', padding: 0 }}
                >+</button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
              <button
                onClick={() => {
                  setExcuseOpen(false);
                  setTempExcuseType(null);
                  setExcuseDays(1);
                }}
                className="retro-btn"
                style={{ flex: 1, padding: '8px', fontSize: '8px', borderColor: 'black' }}
              >
                CANCEL
              </button>
              <button
                disabled={!tempExcuseType}
                onClick={() => {
                  setActiveExcuse(tempExcuseType);
                  setDailyPlan([]);
                  setExcuseOpen(false);
                  setExcuseDays(1);
                  setTempExcuseType(null);
                }}
                className="retro-btn btn-action"
                style={{ flex: 1, padding: '8px', fontSize: '8px', opacity: tempExcuseType ? 1 : 0.4 }}
              >
                CONFIRM
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function StatsTab({ state }) {
  const [statsSubTab, setStatsSubTab] = useState('Trends');

  const blocks = Array.from({ length: 1008 }, (_, i) => {
    const normalized = i / 1008;
    const threshold = 0.3 + ((1 - normalized) * 0.4);
    return (i % 7 !== 0) && (Math.random() > threshold);
  });

  const allMuscleGroups = Object.keys(MUSCLE_COLORS);

  const renderContent = () => {
    switch (statsSubTab) {
      case 'Trends':
        return (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px', overflow: 'hidden' }}>
            <div className="panel" style={{ flex: 1, padding: '15px', borderColor: 'var(--accent-orange)', display: 'flex', flexDirection: 'column' }}>
              <div className="panel-title" style={{ fontSize: '10px', paddingBottom: '6px' }}>TRENDS</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', rowGap: '35px', columnGap: '20px', flex: 1, alignContent: 'center', justifyItems: 'center' }}>
                {allMuscleGroups.map(m => {
                  const hasRecent = (state.history || []).some(h => {
                    const daysAgo = (Date.now() - new Date(h.date).getTime()) / (1000 * 3600 * 24);
                    return daysAgo <= 4 && (h.exercises || []).some(e => e.muscle === m);
                  });
                  return (
                    <div key={m} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <div style={{ fontSize: '36px', color: 'white', textShadow: '3px 3px 0 #000' }}>{state.stats[m] || 50}</div>
                        <div style={{ fontSize: '36px', color: hasRecent ? 'var(--accent-green)' : 'red', textShadow: '2px 2px 0 #000' }}>
                          {hasRecent ? '▲' : '▼'}
                        </div>
                      </div>
                      <div style={{ fontSize: '12px', color: MUSCLE_COLORS[m] }}>{m.toUpperCase()}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="panel" style={{ flexShrink: 0, padding: '12px 15px' }}>
              <div className="panel-title" style={{ fontSize: '10px', paddingBottom: '6px' }}>CURRENT STREAK</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '10px' }}>
                  <span style={{ fontSize: '14px' }}>🥈</span>
                  <span>20 DAYS</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '8px' }}>
                  <span className="text-yellow">BEST: 84D</span>
                </div>
              </div>
            </div>
          </div>
        );

      case 'Consistency':
        return (
          <div className="panel" style={{ padding: '15px', flex: 1, display: 'flex', flexDirection: 'column', borderColor: 'var(--accent-green)' }}>
            <div className="panel-title" style={{ fontSize: '10px', paddingBottom: '6px' }}>CONSISTENCY MAP</div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(28, 1fr)',
              gridAutoRows: '1fr',
              gap: '2px',
              padding: '10px',
              background: '#0a0a0a',
              border: '2px solid #333',
              flex: 1
            }}>
              {blocks.map((completed, i) => (
                <div key={i} style={{
                  backgroundColor: completed ? 'var(--accent-green)' : '#333',
                  boxShadow: completed ? 'inset 1px 1px 0 rgba(255,255,255,0.2)' : 'none'
                }}></div>
              ))}
            </div>
          </div>
        );

      case 'History':
        const last14Days = Array.from({ length: 14 }, (_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - i);
          return d.toLocaleDateString();
        });

        return (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div className="panel" style={{ flex: 1, padding: '10px 15px', display: 'flex', flexDirection: 'column' }}>
              <div className="panel-title" style={{ fontSize: '10px', paddingBottom: '6px' }}>SESSION HISTORY</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', paddingRight: '2px', flex: 1, marginTop: '2px' }}>
                {last14Days.map((dateStr, i) => {
                  const sess = (state.history || []).find(h => h.date === dateStr);

                  if (sess && sess.status === 'EXCUSE') {
                    return (
                      <div key={i} style={{ padding: '10px 8px', border: '2px solid #555', backgroundColor: '#222', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: '8px', color: 'white' }}>{dateStr}</div>
                          <div style={{ fontSize: '6px', color: 'var(--text-muted)' }}>{sess.reason}</div>
                        </div>
                        <div style={{ fontSize: '8px', color: 'var(--accent-orange)' }}>EXCUSED</div>
                      </div>
                    );
                  }

                  if (sess) {
                    return (
                      <div key={i} style={{ padding: '10px 8px', border: '2px solid #333', backgroundColor: 'var(--btn-bg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: '8px', color: 'white' }}>{dateStr}</div>
                          <div style={{ fontSize: '6px', color: 'var(--text-muted)' }}>
                            {(sess.exercises || []).map(e => e.name.slice(0, 10)).join(', ').toUpperCase()}
                          </div>
                        </div>
                        <div style={{ fontSize: '8px', color: 'var(--accent-green)' }}>COMPLETED</div>
                      </div>
                    );
                  }

                  return (
                    <div key={i} style={{ padding: '10px 8px', border: '2px dotted #444', backgroundColor: 'transparent', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontSize: '8px', color: 'var(--text-muted)' }}>{dateStr}</div>
                      <div style={{ fontSize: '8px', color: 'red' }}>MISSED</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '10px', overflow: 'hidden', paddingTop: '10px' }}>

      <div style={{ display: 'flex', gap: '5px', flexShrink: 0 }}>
        {['Trends', 'Consistency', 'History'].map(tab => (
          <button
            key={tab}
            onClick={() => setStatsSubTab(tab)}
            className={`retro-btn ${statsSubTab === tab ? 'btn-action' : ''}`}
            style={{
              flex: 1,
              padding: '8px',
              fontSize: '10px',
              opacity: statsSubTab === tab ? 1 : 0.6,
              borderColor: statsSubTab === tab ? 'white' : '#444'
            }}
          >
            {tab.toUpperCase()}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', paddingTop: '10px' }}>
        {renderContent()}
      </div>

    </div>
  );
}

function WidgetTab({ state }) {
  const [view, setView] = useState('overview');

  const mockWorkout = [
    {
      id: 'ex1', exercise: 'Bench Press',
      sets: [
        { id: 's1', reps: 10, weight: 135, completed: true },
        { id: 's2', reps: 8, weight: 155, completed: false },
      ]
    },
    {
      id: 'ex5', exercise: 'Crunches',
      sets: [
        { id: 's7', reps: 20, completed: false },
      ]
    }
  ];

  const getFatigue = (muscle) => {
    let minDaysAgo = 999;
    if (!state.history) return minDaysAgo;
    state.history.forEach(session => {
      if (session.status === 'EXCUSE') return;
      const sessionDate = new Date(session.date);
      const daysAgo = Math.floor((new Date() - sessionDate) / (1000 * 60 * 60 * 24));
      if (session.exercises && session.exercises.some(e => e.muscle === muscle)) {
        if (daysAgo < minDaysAgo) minDaysAgo = daysAgo;
      }
    });
    return minDaysAgo;
  };

  const getFatigueColor = (muscle) => {
    const daysAgo = getFatigue(muscle);
    if (daysAgo <= 1) return 'rgba(255, 0, 0, 0.7)';
    if (daysAgo <= 3) return 'rgba(255, 165, 0, 0.7)';
    return 'rgba(0, 255, 0, 0.7)';
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
      <div style={{
        width: '320px', 
        height: '320px', 
        backgroundColor: '#111', 
        borderRadius: '24px', 
        padding: '16px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        border: '2px solid #333'
      }}>
        <button 
          onClick={() => setView(view === 'overview' ? 'workout' : 'overview')}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'var(--accent-blue)',
            border: 'none',
            color: '#000',
            padding: '4px 8px',
            borderRadius: '12px',
            fontSize: '8px',
            cursor: 'pointer',
            zIndex: 10
          }}
        >
          {view === 'overview' ? '▶ WORKOUT' : '▶ OVERVIEW'}
        </button>

        {view === 'overview' ? (
          <div style={{ display: 'flex', gap: '10px', height: '100%' }}>
            
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ fontSize: '10px', color: 'var(--accent-orange)', marginBottom: '4px' }}>DAY OVERVIEW</div>
              
              <div style={{ background: '#222', padding: '10px', borderRadius: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <div style={{ fontSize: '10px', color: 'white' }}>LVL {state.level}</div>
                  <div style={{ fontSize: '8px', color: 'var(--accent-green)' }}>{state.effortXp} / {state.level * 500} XP</div>
                </div>
                <div style={{ width: '100%', height: '8px', background: '#000', borderRadius: '4px', overflow: 'hidden', border: '1px solid #444' }}>
                  <div style={{ width: `${Math.min(100, (state.effortXp / (state.level * 500)) * 100)}%`, height: '100%', background: 'var(--accent-green)' }} />
                </div>
              </div>

              <div style={{ flex: 1, background: '#222', padding: '10px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ fontSize: '8px', color: 'var(--text-muted)' }}>TODAY'S PLAN</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ fontSize: '20px' }}>🏀</div>
                  <div style={{ fontSize: '8px' }}>B-BALL<br/><span style={{ fontSize: '6px', color: 'var(--text-muted)' }}>PICKUP GAMES</span></div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ fontSize: '20px' }}>🏋️</div>
                  <div style={{ fontSize: '8px' }}>LIFT<br/><span style={{ fontSize: '6px', color: 'var(--text-muted)' }}>PUSH DAY</span></div>
                </div>
              </div>
            </div>

            <div style={{ width: '120px', background: '#000', borderRadius: '12px', position: 'relative', overflow: 'hidden', border: '2px solid #444', display: 'flex', justifyContent: 'center', padding: '16px' }}>
              <img src={state.avatarUrl || "/avatar_front.png"} style={{ height: '100%', objectFit: 'contain' }} />
            </div>

          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', height: '100%', overflow: 'hidden' }}>
            <div style={{ fontSize: '12px', color: 'var(--accent-green)' }}>WORKOUT LOG</div>
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px', paddingRight: '4px' }}>
              {mockWorkout.map(ex => (
                <div key={ex.id} style={{ background: '#222', padding: '8px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '8px', color: 'white', marginBottom: '4px' }}>{ex.exercise.toUpperCase()}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {ex.sets.map((set, idx) => (
                      <div key={set.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: set.completed ? 'var(--accent-green)' : '#111', padding: '4px 8px', borderRadius: '4px', color: set.completed ? '#000' : '#fff' }}>
                        <div style={{ fontSize: '8px', opacity: 0.8 }}>S{idx + 1}</div>
                        <div style={{ fontSize: '8px' }}>
                          {set.reps} REP {set.weight ? `${set.weight} LBS` : ''}
                        </div>
                        <div style={{ 
                          width: '12px', height: '12px', 
                          border: set.completed ? '1px solid #000' : '1px solid #666',
                          background: set.completed ? '#000' : 'transparent',
                          display: 'flex', justifyContent: 'center', alignItems: 'center'
                        }}>
                          {set.completed && <div style={{ width: '6px', height: '6px', background: 'var(--accent-green)' }} />}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
