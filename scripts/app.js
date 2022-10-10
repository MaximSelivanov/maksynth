import KEYBOARD from './helpers/keyboardNotes.js';
import MIDI__NOTES from './helpers/midiNotes.js';
import Voice from './models/voice.js';


export const synthSliders = {
    attack: 0.005,
    decay: 0.1,
    sustain: 80,
    release: 0.1,
    detuneOscOne: 0,
    detuneOscTwo: 0,
    filterQ: 0,
    filterFriquency: 1,
    lfoDepth: 0,
    lfoRate: 0
}

// Create AudioContext
export let audioCtx = new(window.AudioContext || window.webkitAudioContext)();
export let volume = audioCtx.createGain();
export let analyser = audioCtx.createAnalyser();
volume.connect(analyser);
volume.gain.value = 0.3;

//Volume slider
const volumeSlider = document.querySelector('#volume-slider');

volumeSlider.addEventListener('input', () => {
    volume.gain.value = volumeSlider.value;
}) 

//Filter frequency
export const maxFilterFreq = audioCtx.sampleRate / 2;

//Visualisationj
analyser.connect(audioCtx.destination);

analyser.fftSize = 256;
const bufferLength = analyser.frequencyBinCount;
const dataArray = new Uint8Array(bufferLength);

analyser.getByteTimeDomainData(dataArray);
const canvas = document.querySelector('canvas');
const canvasCtx = canvas.getContext('2d');
let width;
let height;
width = canvas.width;
height = canvas.height;
canvasCtx.clearRect(0, 0, width, height);

function draw() {

    requestAnimationFrame(draw);
    analyser.getByteTimeDomainData(dataArray);

    canvasCtx.fillStyle = '#313940';
    canvasCtx.fillRect(0, 0, width, height);

    canvasCtx.linewidth = 2;
    canvasCtx.strokeStyle = '#00aff9';
    canvasCtx.beginPath();

    const slicewidth = width * 1.0 / (bufferLength);
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = v * (height / 2);

        if (i === 0) {
            canvasCtx.moveTo(x, y);
        } else {
            canvasCtx.lineTo(x, y);
        }
        x += slicewidth;
    }

    canvasCtx.lineTo(width, height / 2);
    canvasCtx.stroke();
}

draw();


//Delay 
export const delay = audioCtx.createDelay();
export const feedback = audioCtx.createGain();
delay.delayTime.value = 0.01;
feedback.gain.value = 0.01;

const delayTimeSlider = document.querySelector('#delaytime-slider');
const delayFeedbackSlider = document.querySelector('#delayfeedback-slider');

delayTimeSlider.addEventListener('input', () => {
    delay.delayTime.value = delayTimeSlider.value;
})
delayFeedbackSlider.addEventListener('input', () => {
    feedback.gain.value = delayFeedbackSlider.value;
})

delay.connect(feedback);
feedback.connect(delay);
delay.connect(volume);


const activeVoices = {};

// Wavetype choice
const waveformsOscOne = document.getElementsByName('oscillator-one__waveform');
export let waveformOscOne = 'sawtooth';
const waveformsOscTwo = document.getElementsByName('oscillator-two__waveform');
export let waveformOscTwo = 'sawtooth';
const waveformsLfo = document.getElementsByName('lfo__waveform');
export let waveformLfo = 'sine';

function setWaveform() {
    for(let i = 0; i < waveformsOscOne.length; i++){
        if(waveformsOscOne[i].checked){
            waveformOscOne = waveformsOscOne[i].value;
        }
    }
    for(let j = 0; j < waveformsOscTwo.length; j++){
        if(waveformsOscTwo[j].checked){
            waveformOscTwo = waveformsOscTwo[j].value;
        }
    }
    for(let l = 0; l < waveformsLfo.length; l++){
        if(waveformsLfo[l].checked){
            waveformLfo = waveformsLfo[l].value;
        }
    }
}

waveformsOscOne.forEach((waveformInput) => {
    waveformInput.addEventListener('change', () => {
        setWaveform();
    });
});

waveformsOscTwo.forEach((waveformInput) => {
    waveformInput.addEventListener('change', () => {
        setWaveform();
    });
});

waveformsLfo.forEach((waveformInput) => {
    waveformInput.addEventListener('change', () => {
        setWaveform();
    });
});

// Stop voice
function stopAllKeys() {
    const keys = Object.keys(activeVoices);
    for (const key of keys) {
        activeVoices[key].stop();
        delete activeVoices[key];
        document.querySelector('.piano-key').classList.remove('piano-key-active');
    }
}

//Play mouse
const mousePlayKeys = document.querySelectorAll('div[data-note]');
mousePlayKeys.forEach((button) => {
    button.addEventListener('mousedown', () => { 
        let pianoKeyboardNote = button.dataset.note; 
        document.querySelector('[data-note="'+pianoKeyboardNote+'"]').classList.add('piano-key-active')
        let voice = new Voice(pianoKeyboardNote);
        activeVoices[pianoKeyboardNote] = voice;
        voice.start();
        
    });
      
    button.addEventListener('mouseup', () => {
        stopAllKeys();
        let pianoKeyboardNote = button.dataset.note; 
        document.querySelector('[data-note="'+pianoKeyboardNote+'"]').classList.remove('piano-key-active')
    });
   
});

//Play computer keyboard
document.addEventListener('keydown', (event) => {
    let keycode = (event.which);
    if (KEYBOARD.hasOwnProperty(keycode)) {
        let note = KEYBOARD[keycode];
        if (activeVoices.hasOwnProperty(note)) return false; 
        document.querySelector('[data-note="'+note+'"]').classList.add('piano-key-active');
        let voice = new Voice(note);
        activeVoices[note] = voice;
        voice.start();
    }
});

document.addEventListener('keyup', (event) => {
    let keycode = (event.which);
    if (KEYBOARD.hasOwnProperty(keycode)) {
        let note = KEYBOARD[keycode];     
        if(activeVoices.hasOwnProperty(note)) {
            document.querySelector('[data-note="'+note+'"]').classList.remove('piano-key-active');
            let voice = activeVoices[note];
            voice.stop();
            delete activeVoices[note];
        } else {
            stopAllKeys();
        }
    }
});

//Play midi keyboard
if(navigator.requestMIDIAccess) {
    navigator.requestMIDIAccess().then(success, failure);
}

function success(midiAccess) {
    midiAccess.addEventListener('statechange', updateDevices);

    const inputs = midiAccess.inputs;

    inputs.forEach((input) => {
        input.addEventListener('midimessage', handleInput);
    });
}

function handleInput(input) {
    const command = input.data[0];
    const note = input.data[1];
    
    if (command >= 144 && command <= 159) {
        noteOn(note);
    }
    if (command >= 128 && command <= 143) {
        noteOff(note);
    }
 
} 

function noteOn(note) {
    let keycode = note;
    if (MIDI__NOTES.hasOwnProperty(keycode)) {
        let playNote = MIDI__NOTES[keycode];
        if (activeVoices.hasOwnProperty(playNote)) return false; 
        let voice = new Voice(playNote);
        activeVoices[playNote] = voice;
        voice.start();
    }
};

function noteOff(note) {
    let keycode = note;
    if (MIDI__NOTES.hasOwnProperty(keycode)) {
        let playNote = MIDI__NOTES[keycode];    
        if(activeVoices.hasOwnProperty(playNote)) {
            let voice = activeVoices[playNote];
            voice.stop();
            delete activeVoices[playNote];
        } else {
            stopAllKeys();
        }
    } 
}

function updateDevices(event) {
    console.log(`Name: ${event.port.name}, Brand:${event.port.manufacturer}, State: ${event.port.state}, Type: ${event.port.type}`);
}

function failure() {
    console.log('Could not connect MIDI');
}

//ADSR sliders
const attackSlider = document.querySelector('#attack-slider');
const decaySlider = document.querySelector('#decay-slider');
const sustainSlider = document.querySelector('#sustain-slider');
const releaseSlider = document.querySelector('#release-slider');

attackSlider.addEventListener('input', () => {
    synthSliders.attack = Number(attackSlider.value);
});

decaySlider.addEventListener('input', () => {
    synthSliders.decay = Number(decaySlider.value);
});

sustainSlider.addEventListener('input', () => {
    synthSliders.sustain = Number(sustainSlider.value);
});

releaseSlider.addEventListener('input', () => {
    synthSliders.release = Number(releaseSlider.value);
});

//Detune sliders
const detuneSliderOne = document.getElementsByClassName('detune-one__slider')[0];
const detuneSliderTwo = document.getElementsByClassName('detune-one__slider')[1];

detuneSliderOne.addEventListener('input', () => {
    synthSliders.detuneOscOne = Number(detuneSliderOne.value);
})

detuneSliderTwo.addEventListener('input', () => {
    synthSliders.detuneOscTwo = Number(detuneSliderTwo.value);
})

//Filter sliders
const filterFriquencySlider = document.querySelector('#frequency-slider');

filterFriquencySlider.addEventListener('input', () => {
    synthSliders.filterFriquency = Number(filterFriquencySlider.value);
});

const filterQualitySlider = document.querySelector('#quality-slider');

filterQualitySlider.addEventListener('input', () => {
    synthSliders.filterQ = Number(filterQualitySlider.value);
});

// LFO sliders
const lfoRateSlider= document.querySelector('#rate-slider'); //speed
const lfoDepthSlider = document.querySelector('#depth-slider'); //amount

lfoRateSlider.addEventListener('input', () => {
    synthSliders.lfoRate = lfoRateSlider.value;
});

lfoDepthSlider.addEventListener('input', () => {
    synthSliders.lfoDepth = lfoDepthSlider.value;
});

//Modal window
let aboutBtn = document.getElementsByClassName('about-button')[0]
let modalWindow = document.getElementsByClassName('modal')[0];

aboutBtn.addEventListener('click', () => {
    modalWindow.style.display = 'block';
});

let startBtn = document.getElementById('start');
startBtn.addEventListener('click', () => {
    modalWindow.style.display = 'none';
});

//Reset 
let resetBtn = document.getElementsByClassName('reset-button')[0];
resetBtn.addEventListener('click', () => {
    location.reload();
});

//Keyboard for modal window
let letter = document.getElementById('computer-keyboard');
createDiv(letter);

function createDiv(letter) {
	letter.innerHTML = letter.innerHTML.replace(/(.)/g, '<div class="letter">$1</div>');
}


