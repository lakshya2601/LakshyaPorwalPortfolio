'use client';

import { useEffect } from 'react';
import './case.css';
import './rain.css';

/**
 * The detective's office. React owns the page shell and the static overlays;
 * the Three.js scene, the tour and the game are booted once on the client.
 */
export default function CaseFile() {
  useEffect(() => {
    let cancelled = false;
    import('./engine/main').then(({ boot }) => { if (!cancelled) boot(); });
    return () => { cancelled = true; };
  }, []);

  return (
    <>
      <h1 className="sr">Lakshya Porwal, AI/ML engineer in Indore. A detective-themed portfolio.</h1>
      <canvas id="cv" />
      <div id="grain" />
      <div id="vig" />

      <div id="loader" className="ui">
        <small>DEVELOPING THE FILM</small>
        <div className="bar"><i id="lbar" /></div>
      </div>

      <div id="street" className="ui" style={{ opacity: 0 }}>
        <div className="meta">INDORE · <span id="clock">11:47 PM</span> · RAINING</div>
        <div className="btns">
          <button className="btn primary" id="play">PLAY DETECTIVE MODE</button>
          <button className="btn" id="enter">TAKE THE TOUR</button>
        </div>
        <div className="snd">best with sound on</div>
      </div>

      <div id="note" className="ui">
        <div className="card">
          <div className="hd"><span>CASE FILE 000</span><span>THE DETECTIVE</span></div>
          <h1>Lakshya Porwal</h1>
          <div id="type" />
          <div id="stamp">ON DUTY</div>
        </div>
      </div>

      <div id="hint" className="ui">move your cursor · he&apos;s watching</div>
      <div id="panel" className="ui" />
      <nav id="chapters" className="ui" aria-label="Chapters" />
      <div id="next" className="ui">SCROLL · NEXT CLUE ↓</div>
      <div id="zzz" className="ui">z z z</div>
      <div id="credit" className="ui">Character model generated with Meshy AI · CC BY 4.0</div>
      <div id="tools" className="ui">
        <button id="mute">SOUND ON</button>
        <button id="replay">REPLAY</button>
      </div>
    </>
  );
}
