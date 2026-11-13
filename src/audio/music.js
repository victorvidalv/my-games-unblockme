import { AC, audioPageHidden, clearAudioRecoveryHint, ctx, muted } from './sound.js';
import { zoneIdx } from '../data/zones.js';
import { $ } from '../dom.js';
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
  let T=0,P=false,theme=THEMES[0],baseBpm=96,tempoNow=96;
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

  const targetBpm=()=>baseBpm*(1+.28*T+(P?.08:0));
  const bpm=()=>tempoNow;
  const noteOf=(th,deg)=>{const s=SC[th.sc],n=s.length;return th.root+s[((deg%n)+n)%n]+12*Math.floor(deg/n)};

  /* Pasos donde suena el «comping» (acordes de acompañamiento) según el estilo */
  const COMP={charleston:[0,6],offbeat:[4,12],oompah:[4,12],strum:[0,6,10],arp:[],none:[]};

  function play(s,t){
    const th=theme,bar=Math.floor(s/16),st=s%16,sd=60/bpm()/4,E=th.epic||0;
    const chord=chordMidi(th,entryAt(th,bar,st));                            // [fundamental, 3ª, 5ª, 7ª, …]
    const firstOfBar=chordMidi(th,entryAt(th,bar,0));
    const nextRoot=chordMidi(th,entryAt(th,bar+1,0))[0];
    const beat=st%4===0;

    // colchón suave de acordes (cuerdas largas con epic ≥ 1; si no, un pad muy leve al inicio del compás)
    if(st===0){
      if(E>=1)firstOfBar.slice(0,3).forEach(m=>voice('strings',m+12,t,sd*15,.0085));
      else firstOfBar.slice(0,3).forEach((m,i)=>osc(th.padW,hz(m+12),t,sd*16,th.padV,.5,1800,i*4));
    }

    // bajo: caminante (negras con nota de aproximación), oom-pah o pedal
    let bn=null;
    if(th.bassPat==='walk'){
      if(st===0)bn=firstOfBar[0]-12;
      else if(st===4)bn=firstOfBar[2]-12;
      else if(st===8)bn=chord[0]-12;
      else if(st===12)bn=nextRoot-12+(nextRoot%2?-1:1);                       // medio tono hacia la siguiente fundamental
    }else if(th.bassPat==='oompah'){
      if(st===0)bn=chord[0]-12;else if(st===8)bn=chord[2]-12;
    }else if(st===0||st===8)bn=chord[0]-12;
    if(P&&bn===null&&st%4===2)bn=chord[0]-12;
    if(bn!==null)voice('upright',bn,t,.3,P?.085:th.bassV);

    // acompañamiento
    if((COMP[th.comp]||[]).includes(st)){
      const notes=th.comp==='strum'?chord.slice(0,4):chord.slice(1,4);
      notes.forEach((m,i)=>voice(th.compVoice,m+12,t+i*.012,.22,th.compV));
    }
    // arpegio suave (temas «de cristal»)
    if(th.arpVoice){
      const every=th.arpEvery||2,pat=th.arpPat||[0,1,2,1];
      if(st%every===0)voice(th.arpVoice,chord[pat[(st/every)%pat.length]%chord.length]+12,t,Math.max(.23,sd*2),P?.03:th.arpV);
    }

    // percusión de escobillas: shaker en corcheas y toque de aro en 2 y 4
    const pc=th.perc||'none';
    if(pc!=='none'||P||T>.5){
      if(st%2===0)noise(t,.05,st%4===2?.0085:.005,6200);
      if(pc==='brush'&&(st===4||st===12))noise(t,.04,.011,2300,'bandpass');
      if((P||T>.6)&&st%2===1)noise(t,.04,.006,6800);
    }
    if(P&&beat){osc('sine',58,t,.22,.025,.04);voice('bell',noteOf(th,st%8===0?7:9),t,.12,.009)}   // latido y alarma de pánico

    // capa épica: timbal, caja y platillo
    if(E>=2){
      if(st===0||st===8)timpani(t,chord[0]-24,P?.075:.055);
      if(bar%4===3&&st>=12&&st%2===0)timpani(t,chord[2]-24,.03+.004*(st-12));  // redoble antes de cambiar de frase
    }
    if(E>=3){
      if(st===4||st===12)noise(t,.09,.016,1800,'bandpass');
      if(bar%16===0&&st===0)noise(t,1.4,.02,4200);
    }

    // melodía del tema (con refuerzo grave/agudo de metales si es épico)
    for(const [at,deg,dur] of th.tune[bar%th.tune.length])if(at===st){
      voice(th.leadVoice,noteOf(th,deg)+12,t,dur*sd,th.leadV);
      if(E>=2)voice('brass',noteOf(th,deg),t,dur*sd,th.leadV*.5);
      if(E>=3)voice('brass',noteOf(th,deg)+24,t,dur*sd*.9,th.leadV*.22);
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
    /** Música fuera de partida: 'menu' (menú principal) o 'heroes' (elección de héroe). Arranca si hace falta. */
    scene(name){
      T=0;P=false;
      useTheme(name==='heroes'?HEROES_THEME:MENU_THEME);
      tempoNow=baseBpm;duckLv=1;muffled=false;
      if(flt)flt.frequency.setTargetAtTime(9000,AC.currentTime,.15);
      this.start();
    },
    setTension(t,p){T=Math.max(0,Math.min(1,t));P=!!p;if(!playing)tempoNow=targetBpm()},
    duck(v){duckLv=v;if(bus&&playing)bus.gain.setTargetAtTime(vol(),AC.currentTime,.25)},
    muffle(on){muffled=!!on;if(flt)flt.frequency.setTargetAtTime(on?900:9000,AC.currentTime,.15)},
    refresh(){if(muted)this.stop(.2);else if(bus&&playing)bus.gain.setTargetAtTime(vol(),AC.currentTime,.1)},
    bpm,targetBpm,get themeName(){return theme.name},get playing(){return playing}
  };
})();
export function setTensionFx(t,panic){
  Music.setTension(t,panic);
  const b=$('bgfx');b.style.setProperty('--tn',t.toFixed(2));
  if(panic)b.style.setProperty('--beat',(60/Music.bpm()).toFixed(3)+'s');
  document.body.classList.toggle('panic',panic);
}
