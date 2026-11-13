import { AC, audioPageHidden, clearAudioRecoveryHint, ctx, muted } from './sound.js';
import { zoneIdx } from '../data/zones.js';
import { HEROES_THEME, MENU_THEME, SCALES, ZONE_THEMES, chordMidi, entryAt } from './themes.js';

/* ============================ Música procedural ============================
   Secuenciador por pasos de 1/16 que toca los temas de themes.js: melodía, acordes con séptima, bajo caminante,
   «comping» de guitarra/piano/acordeón, escobillas suaves y, según `epic`, cuerdas, timbal y metales.
   El swing retrasa las corcheas de contratiempo. El tempo sube con los movimientos gastados y entra en
   «modo pánico» en el último movimiento. */
export const Music=(()=>{
  const SC=SCALES;
  const THEMES=ZONE_THEMES;

  let bus=null,flt=null,noiseBuf=null,timer=0,playing=false,step=0,next=0,duckLv=1,audioOwner=null,muffled=false;
  let theme=THEMES[0],baseBpm=96,tempoNow=96;
  const hz=m=>440*Math.pow(2,(m-69)/12);
  function init(){
    ctx();if(bus&&audioOwner===AC)return;
    if(bus){try{bus.disconnect()}catch(_){}}audioOwner=AC;
    bus=AC.createGain();flt=AC.createBiquadFilter();flt.type='lowpass';flt.frequency.value=muffled?900:9000;
    bus.gain.value=0;bus.connect(flt);flt.connect(AC.destination);
    noiseBuf=AC.createBuffer(1,AC.sampleRate*.5,AC.sampleRate);const d=noiseBuf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
  }
  const vol=()=>muted?0:.28*duckLv;
  function osc(type,f,t,dur,v,a=.006,filt=0,det=0){
    const o=AC.createOscillator(),g=AC.createGain();o.type=type;o.frequency.value=f;o.detune.value=det;
    g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(v,t+a);g.gain.exponentialRampToValueAtTime(.0001,t+a+dur);
    let n=o;if(filt){const q=AC.createBiquadFilter();q.type='lowpass';q.frequency.value=filt;o.connect(q);n=q}
    n.connect(g);g.connect(bus);o.start(t);o.stop(t+a+dur+.05);
  }

  /** Un timbre por instrumento; todos salen de osciladores y filtros (sin muestras). */
  function voice(kind,midi,t,duration,volume){
    const f=hz(midi);
    switch(kind){
      case 'bell':case 'celesta':case 'glass':
        osc('sine',f,t,duration*1.3,volume,.008,3800);osc('sine',f*(kind==='glass'?2.01:2),t,duration*.55,volume*.13,.006,4200);break;
      case 'vibes':                                               // vibráfono: cuerpo sinusoidal con brillo que se apaga
        osc('sine',f,t,duration*1.5,volume,.006,3500);osc('sine',f*4,t,duration*.4,volume*.12,.004,5000);break;
      case 'flute':case 'whistle':
        osc('sine',f,t,duration,volume,.05,2600);osc('sine',f*2,t,duration*.8,volume*.08,.06,2600);break;
      case 'clarinet':                                            // armónicos impares: cálido y «madera»
        osc('square',f,t,duration,volume*.32,.03,1500);osc('sine',f,t,duration,volume*.5,.03,2400);break;
      case 'accordion':                                           // dos voces ligeramente desafinadas
        osc('sawtooth',f,t,duration,volume*.22,.04,1500,-8);osc('sawtooth',f,t,duration,volume*.22,.04,1500,8);osc('sine',f,t,duration,volume*.25,.04,2200);break;
      case 'horn':
        osc('triangle',f,t,duration,volume,.055,1100);osc('sine',f*2,t,duration*.8,volume*.08,.06,2600);break;
      case 'brass':
        osc('sawtooth',f,t,duration,volume*.55,.035,1700);osc('triangle',f/2,t,duration,volume*.45,.04,900);break;
      case 'fiddle':                                              // violín folk: sierra suave con ataque de arco
        osc('sawtooth',f,t,duration,volume*.5,.05,2300,-5);osc('sawtooth',f,t,duration,volume*.3,.05,2300,7);break;
      case 'synth':
        osc('triangle',f,t,duration,volume*.7,.02,2400);osc('square',f,t,duration*.7,volume*.18,.02,1800,3);break;
      case 'strings':
        osc('sawtooth',f,t,duration*.9,volume*.55,.045,1500,-6);osc('sawtooth',f,t,duration*.9,volume*.55,.045,1500,6);break;
      case 'guitar':                                              // cuerda de nailon: ataque rápido, caída corta
        osc('sawtooth',f,t,Math.max(.15,duration*.45),volume*.45,.004,1900);osc('triangle',f*2,t,duration*.18,volume*.14,.003,2600);break;
      case 'pizz':                                                // pizzicato / marimba seca
        osc('triangle',f,t,.16,volume,.003,2400);osc('sine',f*2,t,.08,volume*.2,.002,3000);break;
      case 'upright':                                             // contrabajo: redondo y corto
        osc('triangle',f,t,.3,volume,.01,520);osc('sine',f,t,.3,volume*.8,.01,420);break;
      default:{                                                   // piano, koto…
        const decay=kind==='piano'?.8:kind==='koto'?.7:.42;
        osc('sine',f,t,Math.max(.12,duration*decay),volume,.006,2800);osc('triangle',f*2,t,duration*.25,volume*.13,.004,2400);
      }
    }
  }

  function noise(t,dur,v,f,type='highpass'){
    const s=AC.createBufferSource(),g=AC.createGain(),q=AC.createBiquadFilter();s.buffer=noiseBuf;q.type=type;q.frequency.value=f;
    g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.001,t+dur);s.connect(q);q.connect(g);g.connect(bus);s.start(t);s.stop(t+dur+.02);
  }
  /** Timbal suave: golpe grave con caída de tono, sin chasquido. */
  function timpani(t,midi,v){
    const o=AC.createOscillator(),g=AC.createGain(),q=AC.createBiquadFilter(),f=hz(midi);
    q.type='lowpass';q.frequency.value=380;o.frequency.setValueAtTime(f*1.5,t);o.frequency.exponentialRampToValueAtTime(f,t+.09);
    g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(v,t+.012);g.gain.exponentialRampToValueAtTime(.0001,t+.42);
    o.connect(q);q.connect(g);g.connect(bus);o.start(t);o.stop(t+.45);
  }

  const targetBpm=()=>baseBpm;                                   // la música NUNCA cambia de tempo ni de capas: el aviso de pocos turnos es visual
  const bpm=()=>tempoNow;
  const noteOf=(th,deg)=>{const s=SC[th.sc],n=s.length;return th.root+s[((deg%n)+n)%n]+12*Math.floor(deg/n)};

  /* ---------- Batería: cada «groove» es una lista de pasos (0-15) por instrumento ---------- */
  const kick=(t,v)=>{const o=AC.createOscillator(),g=AC.createGain(),q=AC.createBiquadFilter();q.type='lowpass';q.frequency.value=240;
    o.frequency.setValueAtTime(135,t);o.frequency.exponentialRampToValueAtTime(48,t+.09);
    g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(v,t+.006);g.gain.exponentialRampToValueAtTime(.0001,t+.2);
    o.connect(q);q.connect(g);g.connect(bus);o.start(t);o.stop(t+.22)};
  const snare=(t,v)=>{noise(t,.13,v,1900,'bandpass');osc('triangle',190,t,.07,v*.7,.002)};
  const rim=(t,v)=>{noise(t,.03,v,2600,'bandpass');osc('triangle',950,t,.02,v*.5,.001)};
  const conga=(t,v,f=330)=>osc('sine',f,t,.1,v,.002,1200);
  const GROOVES={
    pop:    {k:[0,8],         s:[4,12],       h:[0,2,4,6,8,10,12,14]},
    polka:  {k:[0,8],         s:[4,12],       tm:[2,6,10,14],h:[0,4,8,12]},
    latin:  {k:[0,6,8,14],    rim:[0,3,6,10,12], cg:[2,4,10,14],sh:[0,2,4,6,8,10,12,14]},
    shuffle:{k:[0,8],         s:[4,12],       tm:[0,2,4,6,8,10,12,14]},
    disco:  {k:[0,4,8,12],    s:[4,12],       oh:[2,6,10,14],h:[0,1,3,4,5,7,8,9,11,12,13,15]},
    soft:   {k:[0,10],        rim:[4,12],     sh:[0,2,4,6,8,10,12,14]},
    bossa:  {k:[0,6,8,14],    rim:[0,3,6,10,12], sh:[0,2,4,6,8,10,12,14]},
    march:  {k:[0,3,8,11],    s:[4,12,14],    h:[0,2,4,6,8,10,12,14]},
    chill:  {k:[0,10],        s:[4,12],       h:[0,2,4,6,8,10,12,14],rd:[0,6]},
    bigband:{k:[0,4,8,12],    s:[10],         rd:[0,4,6,8,12,14]},
    drive:  {k:[0,4,8,12],    s:[4,12],       h:[0,2,3,4,6,7,8,10,11,12,14,15]},
  };
  const KV={k:.085,s:.055,rim:.03,h:.013,oh:.022,sh:.01,tm:.02,rd:.013,cg:.05};
  function drums(th,st,t,bar,E){
    const g=GROOVES[th.groove]||GROOVES.pop,has=a=>a&&a.includes(st);
    const fill=bar%4===3&&st>=13;                                  // redoble al final de cada frase
    if(has(g.k)&&!(fill&&st>=14))kick(t,KV.k);
    if(has(g.s)&&!(fill&&st>=13))snare(t,KV.s);
    if(fill)snare(t,.03+.012*(st-13));
    if(has(g.rim))rim(t,KV.rim);
    if(has(g.h))noise(t,.035,st%4===2?KV.h*1.3:KV.h,7000);
    if(has(g.oh))noise(t,.16,KV.oh,6000);
    if(has(g.sh))noise(t,.05,st%4===2?KV.sh*1.5:KV.sh,5200);
    if(has(g.tm)){noise(t,.09,KV.tm,8000);noise(t,.07,KV.tm*.6,5500,'bandpass')}
    if(has(g.rd)||(g.rd&&st%2===0&&false))noise(t,.25,KV.rd,5200);
    if(has(g.cg))conga(t,KV.cg,st%4===2?260:330);
    if(st===0&&bar%8===0&&bar>0)noise(t,1.2,.02+.004*E,3800);     // platillo al empezar cada sección
  }

  /* Riffs de bajo: [paso, intervalo]. r=fundamental, 3, 5, 7, 8=octava. El bajo siempre suena en 40-52 (se oye hasta en el móvil). */
  const RIFFS={
    pop:   [[0,'r'],[3,'r'],[6,'5'],[8,'r'],[11,'r'],[14,'3']],
    funk:  [[0,'r'],[3,'8'],[6,'r'],[8,'5'],[10,'7'],[11,'8'],[14,'5']],
    tumbao:[[0,'5'],[3,'r'],[6,'r'],[8,'5'],[11,'r'],[14,'3']],
    bossa: [[0,'r'],[6,'5'],[8,'r'],[14,'5']],
    gallop:[[0,'r'],[2,'r'],[3,'r'],[4,'5'],[6,'r'],[8,'r'],[10,'r'],[11,'r'],[12,'5'],[14,'r']],
    oompah:[[0,'r'],[8,'5']],
  };
  const bassReg=m=>{while(m>52)m-=12;while(m<40)m+=12;return m};
  const IV={r:0,'3':1,'5':2,'7':3};

  /* Pasos del acompañamiento (acordes cortos) según el estilo */
  const COMP={charleston:[0,6],offbeat:[4,12],oompah:[4,12],strum:[0,6,10],chop16:[0,3,6,8,11,14],skank:[2,6,10,14],montuno:[3,6,10,12,14],pump:[0,2,4,6,8,10,12,14],arp:[],none:[]};

  function play(s,t){
    const th=theme,bar=Math.floor(s/16),st=s%16,sd=60/bpm()/4,E=th.epic||0;
    const chord=chordMidi(th,entryAt(th,bar,st));                            // [fundamental, 3ª, 5ª, 7ª, …]
    const firstOfBar=chordMidi(th,entryAt(th,bar,0));
    const nextRoot=chordMidi(th,entryAt(th,bar+1,0))[0];

    // colchón suave de acordes (cuerdas largas)
    if(st===0)firstOfBar.slice(0,3).forEach(m=>voice('strings',m+12,t,sd*15,.0085));

    // bajo: caminante (jazz) o riff sincopado según el estilo
    let bn=null;
    if(th.bassPat==='walk'){
      if(st===0)bn=firstOfBar[0];
      else if(st===4)bn=firstOfBar[2];
      else if(st===8)bn=chord[0];
      else if(st===12)bn=nextRoot+(nextRoot%2?-1:1);                          // medio tono hacia la siguiente fundamental
    }else{
      const hit=(RIFFS[th.bassPat]||RIFFS.pop).find(r=>r[0]===st);
      if(hit)bn=hit[1]==='8'?chord[0]+12:chord[IV[hit[1]]];
    }
    if(bn!==null)voice('upright',bassReg(bn),t,.26,th.bassV);

    // acompañamiento
    if((COMP[th.comp]||[]).includes(st)){
      const notes=th.comp==='strum'?chord.slice(0,4):chord.slice(1,4);
      notes.forEach((m,i)=>voice(th.compVoice,m+12,t+i*.01,.13,th.compV));
    }
    // arpegio suave
    if(th.arpVoice){
      const every=th.arpEvery||2,pat=th.arpPat||[0,1,2,1];
      if(st%every===0)voice(th.arpVoice,chord[pat[(st/every)%pat.length]%chord.length]+12,t,Math.max(.2,sd*2),th.arpV);
    }

    // batería
    drums(th,st,t,bar,E);

    // capa épica: timbal en las frases y metales que refuerzan la melodía
    if(E>=2){
      if(st===0&&bar%4===0)timpani(t,chord[0]-24,.055);
      if(bar%4===3&&st>=12&&st%2===0)timpani(t,chord[2]-24,.03+.004*(st-12));
    }

    // melodía del tema (con refuerzo de metales y eco rítmico si el tema lo pide)
    for(const [at,deg,dur] of th.tune[bar%th.tune.length])if(at===st){
      voice(th.leadVoice,noteOf(th,deg)+12,t,dur*sd,th.leadV);
      if(E>=2)voice('brass',noteOf(th,deg),t,dur*sd,th.leadV*.5);
      if(E>=3)voice('brass',noteOf(th,deg)+24,t,dur*sd*.9,th.leadV*.22);
      if(th.echo&&dur>=2)voice('pizz',noteOf(th,deg)+12,t+sd*3,.1,th.leadV*.3);   // eco a una corchea con puntillo
    }
  }
  function loop(){
    if(!playing||!AC||document.hidden||audioPageHidden||AC.state!=='running')return;
    tempoNow+=(targetBpm()-tempoNow)*.07;
    const lookahead=.14;
    if(next<AC.currentTime)next=AC.currentTime+.05;
    while(next<AC.currentTime+lookahead){
      const sd=60/bpm()/4,sw=(step%4>=2)?(theme.swing||0)*sd*2:0;            // swing: las corcheas de contratiempo llegan tarde
      play(step,next+sw);next+=sd;step++;
    }
  }
  function armSequencer(){
    if(muted||document.hidden||audioPageHidden||!playing||AC.state!=='running')return false;
    clearInterval(timer);next=AC.currentTime+.08;
    bus.gain.cancelScheduledValues(AC.currentTime);bus.gain.setValueAtTime(0,AC.currentTime);bus.gain.setTargetAtTime(vol(),AC.currentTime,.12);
    timer=setInterval(loop,25);return true;
  }
  /** Cambia de tema entrando al inicio de un compás. */
  function useTheme(nt){
    if(nt!==theme&&playing)step=Math.ceil(step/16)*16;
    theme=nt;baseBpm=nt.bpm;if(!playing)tempoNow=baseBpm;
  }
  return {
    start(){if(muted)return;init();if(playing){if(!timer)armSequencer();bus.gain.setTargetAtTime(vol(),AC.currentTime,.3);return}tempoNow=targetBpm();playing=true;step=0;armSequencer()},
    stop(fade=.5){clearAudioRecoveryHint();playing=false;clearInterval(timer);timer=0;if(bus&&audioOwner.state!=='closed')bus.gain.setTargetAtTime(0,audioOwner.currentTime,fade/3)},
    background(){clearInterval(timer);timer=0},
    recover(){if(!playing||muted||document.hidden||audioPageHidden)return false;init();return armSequencer()},
    setLevel(n){useTheme(THEMES[zoneIdx(n)])},
    /** Toca un tema concreto desde el principio (lo usa melodies.html). */
    playTheme(th){duckLv=1;muffled=false;theme=th;baseBpm=th.bpm;tempoNow=th.bpm;step=0;if(playing){playing=false;clearInterval(timer);timer=0}this.start()},
    /** Música fuera de partida: 'menu' (menú principal) o 'heroes' (elección de héroe). Arranca si hace falta. */
    scene(name){
      useTheme(name==='heroes'?HEROES_THEME:MENU_THEME);
      tempoNow=baseBpm;duckLv=1;muffled=false;
      if(flt)flt.frequency.setTargetAtTime(9000,AC.currentTime,.15);
      this.start();
    },
    duck(v){duckLv=v;if(bus&&playing)bus.gain.setTargetAtTime(vol(),AC.currentTime,.25)},
    muffle(on){muffled=!!on;if(flt)flt.frequency.setTargetAtTime(on?900:9000,AC.currentTime,.15)},
    refresh(){if(muted)this.stop(.2);else if(bus&&playing)bus.gain.setTargetAtTime(vol(),AC.currentTime,.1)},
    bpm,targetBpm,get themeName(){return theme.name},get playing(){return playing}
  };
})();
/**
 * Aviso de pocos turnos: solo VISUAL (la música no cambia).
 *  low  (≈ 20 % de los turnos o menos) → clase body.low-turns: el fondo de la ciudad se atenúa.
 *  last (último movimiento)            → clase body.last-turn: el fondo se atenúa más.
 */
export function setTensionFx(low,last){
  document.body.classList.toggle('low-turns',!!low);
  document.body.classList.toggle('last-turn',!!last);
}
