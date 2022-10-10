import NOTES from '../helpers/notesFrequency.js';
import {audioCtx} from '../app.js';
import {waveformOscOne} from '../app.js';
import {waveformOscTwo} from '../app.js';
import {waveformLfo} from '../app.js';
import {synthSliders} from '../app.js';
import {maxFilterFreq} from '../app.js';
import {volume} from '../app.js';
import {delay} from '../app.js';

class Voice {

    constructor(note) {
        this.frequency = NOTES[note]; 

        this.note = note;

        this.oscillatorOne = audioCtx.createOscillator();
        this.oscillatorOne.type = waveformOscOne; 
        this.oscillatorOne.frequency.setValueAtTime(this.frequency, audioCtx.currentTime);

        this.oscillatorTwo = audioCtx.createOscillator();
        this.oscillatorTwo.type = waveformOscTwo; 
        this.oscillatorTwo.frequency.setValueAtTime(this.frequency, audioCtx.currentTime);

        this.oscillatorOne.detune.setValueAtTime(synthSliders.detuneOscOne, audioCtx.currentTime);
        this.oscillatorTwo.detune.setValueAtTime(synthSliders.detuneOscTwo, audioCtx.currentTime);

        this.lfo = audioCtx.createOscillator();
        this.lfo.type = waveformLfo;
        this.lfo.frequency.setValueAtTime(synthSliders.lfoRate, audioCtx.currentTime);

        this.filter = audioCtx.createBiquadFilter();
        this.filter.type = 'lowpass';
        this.filter.frequency.value = synthSliders.filterFriquency * maxFilterFreq;
        this.filter.Q.value = synthSliders.filterQ * 30;   
    }

    start() {
        let now = audioCtx.currentTime;
        this.voiceGain = audioCtx.createGain();
        this.lfoGain = audioCtx.createGain();

        this.oscillatorOne.frequency.setValueAtTime(this.frequency, now);
        this.oscillatorTwo.frequency.setValueAtTime(this.frequency, now);

        this.lfo.frequency.setValueAtTime(synthSliders.lfoRate, now);

        this.filter.frequency.value = synthSliders.filterFriquency * maxFilterFreq;
        this.filter.Q.value = synthSliders.filterQ * 30;
        
        this.oscillatorOne.connect(this.filter);
        this.oscillatorTwo.connect(this.filter);

        this.lfo.connect(this.lfoGain);
        
        this.lfoGain.connect(this.oscillatorOne.frequency)
        this.lfoGain.connect(this.oscillatorTwo.frequency)

        this.filter.connect(this.voiceGain);

        this.voiceGain.gain.setValueAtTime(0, now);
        this.lfoGain.gain.setValueAtTime(synthSliders.lfoDepth, now);


        // Attack
        this.voiceGain.gain.linearRampToValueAtTime(0.5, now + synthSliders.attack);
        this.voiceGain.gain.setValueAtTime(0.5, now + synthSliders.attack);

        // Decay and sustain
        this.voiceGain.gain.linearRampToValueAtTime(0, now + synthSliders.attack + synthSliders.decay + synthSliders.sustain);

        this.voiceGain.connect(volume);
        this.voiceGain.connect(delay);

        if (document.getElementsByName('oscillator-one__on-button')[0].checked){
            this.oscillatorOne.start(0);
        }
        if (document.getElementsByName('oscillator-two__on-button')[0].checked){
            this.oscillatorTwo.start(0);
        }

        this.lfo.start(0);
       
    }

    stop() {
        this.voiceGain.gain.linearRampToValueAtTime(0.001, audioCtx.currentTime + synthSliders.release);
        
        if (document.getElementsByName('oscillator-one__on-button')[0].checked){
            this.oscillatorOne.stop(audioCtx.currentTime + synthSliders.release);
        }
        if (document.getElementsByName('oscillator-two__on-button')[0].checked){
            this.oscillatorTwo.stop(audioCtx.currentTime + synthSliders.release);
        }
        
        this.lfoGain.gain.linearRampToValueAtTime(0.001, audioCtx.currentTime + synthSliders.release);
        this.lfo.stop(audioCtx.currentTime + synthSliders.release);
    }
}

export default Voice;
