function LoginScreen({ onLoginSuccess, onStartNewGame }) {
  const [saveCode, setSaveCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (saveCode.length < 6) return;
    setIsLoading(true);
    setError('');
    
    try {
      const res = await fetch('/api/login', {
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
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', gap: '30px' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '48px', color: 'var(--accent-green)', textShadow: '4px 4px 0 #000' }}>SHAQTIVITY</div>
        <div style={{ fontSize: '10px', color: 'var(--accent-orange)' }}>RPG FITNESS TRACKER</div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', width: '100%', maxWidth: '300px' }}>
        <div className="panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
          <div style={{ fontSize: '10px', color: 'var(--text-main)' }}>ENTER SAVE CODE</div>
          <input 
            value={saveCode}
            onChange={e => setSaveCode(e.target.value.toUpperCase())}
            maxLength={6}
            placeholder="XXXXXX"
            style={{ background: '#000', border: '2px solid #444', color: 'var(--accent-green)', padding: '10px', width: '100px', textAlign: 'center', fontSize: '16px', outline: 'none' }}
          />
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

        <div style={{ textAlign: 'center', fontSize: '10px', color: '#666' }}>- OR -</div>

        <button onClick={onStartNewGame} className="retro-btn btn-warning" style={{ width: '100%' }}>
          NEW GAME
        </button>
      </div>
    </div>
  );
}
