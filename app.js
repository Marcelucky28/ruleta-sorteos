const canvas = document.getElementById('ruleta');
const ctx = canvas.getContext('2d');
const textarea = document.getElementById('listaNombres');
const btnGirar = document.getElementById('btnGirar');
const resultadoDiv = document.getElementById('resultado');
const chkEliminar = document.getElementById('chkEliminar');
const chkSonido = document.getElementById('chkSonido');
const paletaSelect = document.getElementById('paletaColores');
const colorFondoInput = document.getElementById('colorFondo');
const puntero = document.getElementById('puntero');
const listaHistorial = document.getElementById('listaHistorial');
const btnLimpiarHistorial = document.getElementById('btnLimpiarHistorial');

const paletas = {
  vibrante: ['#ff2e63', '#08d9d6', '#f9a826', '#6c5ce7', '#00b894', '#e84393', '#0984e3', '#fdcb6e'],
  pastel: ['#ffadad', '#ffd6a5', '#fdffb6', '#caffbf', '#9bf6ff', '#a0c4ff', '#bdb2ff', '#ffc6ff'],
  elegante: ['#d4af37', '#2c3e50', '#b8860b', '#1a252f', '#e5c158', '#34495e'],
  oceano: ['#0077b6', '#00b4d8', '#90e0ef', '#03045e', '#0096c7', '#48cae4']
};

let opciones = [];
let anguloActual = 0;
let girando = false;
let indiceSectorAnterior = -1;
let audioCtx = null;
let contadorGanadores = 0;

function inicializarAudio() {
  try {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) audioCtx = new AudioContextClass();
    }
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
  } catch (e) {}
}

function tocarTic() {
  if (!chkSonido.checked) return;
  try {
    inicializarAudio();
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(600, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(120, audioCtx.currentTime + 0.04);
    gain.gain.setValueAtTime(0.25, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.04);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.04);
  } catch (e) {}

  puntero.classList.add('golpe');
  setTimeout(() => puntero.classList.remove('golpe'), 50);
}

function tocarFanfarria() {
  if (!chkSonido.checked) return;
  try {
    inicializarAudio();
    if (!audioCtx) return;
    const notas = [523.25, 659.25, 783.99, 1046.50];
    notas.forEach((freq, i) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime + i * 0.12);
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime + i * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + i * 0.12 + 0.45);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(audioCtx.currentTime + i * 0.12);
      osc.stop(audioCtx.currentTime + i * 0.12 + 0.45);
    });
  } catch (e) {}
}

function obtenerOpciones() {
  return textarea.value.split('\n').map(item => item.trim()).filter(item => item !== '');
}

function dibujarRuleta() {
  opciones = obtenerOpciones();
  const total = opciones.length;
  const radio = canvas.width / 2;
  const colores = paletas[paletaSelect.value];
  const esPastel = paletaSelect.value === 'pastel';

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (total === 0) {
    ctx.fillStyle = '#2a2a40';
    ctx.beginPath();
    ctx.arc(radio, radio, radio, 0, Math.PI * 2);
    ctx.fill();
    return;
  }

  const arco = (Math.PI * 2) / total;

  for (let i = 0; i < total; i++) {
    const anguloInicio = anguloActual + i * arco;
    const anguloFin = anguloInicio + arco;

    ctx.beginPath();
    ctx.moveTo(radio, radio);
    ctx.arc(radio, radio, radio, anguloInicio, anguloFin);
    ctx.fillStyle = colores[i % colores.length];
    ctx.fill();
    ctx.strokeStyle = '#1e1e2f';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.save();
    ctx.translate(radio, radio);
    ctx.rotate(anguloInicio + arco / 2);
    ctx.textAlign = 'right';
    ctx.fillStyle = esPastel ? '#1e1e2f' : '#ffffff';
    ctx.font = 'bold 16px sans-serif';
    const texto = opciones[i].length > 15 ? opciones[i].substring(0, 14) + '...' : opciones[i];
    ctx.fillText(texto, radio - 22, 6);
    ctx.restore();
  }

  const radioCentro = 34;
  ctx.save();
  ctx.beginPath();
  ctx.arc(radio, radio, radioCentro, 0, Math.PI * 2);
  ctx.fillStyle = '#1e1e2f';
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#2a2a40';
  ctx.stroke();
  ctx.restore();
}

function obtenerIndiceBajoPuntero(total) {
  const arco = (Math.PI * 2) / total;
  const anguloPuntero = (1.5 * Math.PI - (anguloActual % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
  return Math.floor(anguloPuntero / arco);
}

function girar() {
  if (girando) return;
  opciones = obtenerOpciones();
  if (opciones.length < 2) {
    resultadoDiv.textContent = 'Agrega al menos 2 opciones';
    return;
  }

  inicializarAudio();
  girando = true;
  btnGirar.disabled = true;
  textarea.disabled = true;
  resultadoDiv.textContent = 'Girando...';

  const duracion = 5000;
  const vueltasExtra = (Math.floor(Math.random() * 5) + 7) * Math.PI * 2;
  const anguloAleatorio = Math.random() * Math.PI * 2;
  const anguloObjetivo = anguloActual + vueltasExtra + anguloAleatorio;
  const anguloInicial = anguloActual;
  const inicioTiempo = performance.now();

  function animar(tiempoActual) {
    const transcurrido = tiempoActual - inicioTiempo;
    const progreso = Math.min(transcurrido / duracion, 1);
    const easeOut = 1 - Math.pow(1 - progreso, 3);
    
    anguloActual = anguloInicial + (anguloObjetivo - anguloInicial) * easeOut;

    const sectorActual = obtenerIndiceBajoPuntero(opciones.length);
    if (sectorActual !== indiceSectorAnterior) {
      tocarTic();
      indiceSectorAnterior = sectorActual;
    }

    dibujarRuleta();

    if (progreso < 1) {
      requestAnimationFrame(animar);
    } else {
      finalizarGiro();
    }
  }

  requestAnimationFrame(animar);
}

function finalizarGiro() {
  girando = false;
  btnGirar.disabled = false;
  textarea.disabled = false;

  const indiceGanador = obtenerIndiceBajoPuntero(opciones.length);
  const ganador = opciones[indiceGanador];

  resultadoDiv.textContent = 'Ganador: ' + ganador;
  tocarFanfarria();
  lanzarConfeti();

  contadorGanadores++;
  const item = document.createElement('li');
  item.textContent = '#' + contadorGanadores + ' - ' + ganador;
  listaHistorial.prepend(item);

  if (chkEliminar.checked) {
    opciones.splice(indiceGanador, 1);
    textarea.value = opciones.join('\n');
    setTimeout(dibujarRuleta, 1200);
  }
}

function lanzarConfeti() {
  const cCanvas = document.getElementById('confeti');
  const cCtx = cCanvas.getContext('2d');
  cCanvas.width = window.innerWidth;
  cCanvas.height = window.innerHeight;

  const particulas = Array.from({ length: 100 }, () => ({
    x: Math.random() * cCanvas.width,
    y: Math.random() * cCanvas.height - cCanvas.height,
    r: Math.random() * 6 + 4,
    d: Math.random() * 5 + 2,
    color: paletas.vibrante[Math.floor(Math.random() * paletas.vibrante.length)]
  }));

  let frames = 0;
  function animarConfeti() {
    cCtx.clearRect(0, 0, cCanvas.width, cCanvas.height);
    particulas.forEach(p => {
      p.y += p.d;
      p.x += Math.sin(frames * 0.05) * 1.5;
      cCtx.fillStyle = p.color;
      cCtx.fillRect(p.x, p.y, p.r, p.r * 1.5);
    });
    frames++;
    if (frames < 150) {
      requestAnimationFrame(animarConfeti);
    } else {
      cCtx.clearRect(0, 0, cCanvas.width, cCanvas.height);
    }
  }
  animarConfeti();
}

textarea.addEventListener('input', dibujarRuleta);
paletaSelect.addEventListener('change', dibujarRuleta);
colorFondoInput.addEventListener('input', (e) => document.body.style.background = e.target.value);

btnLimpiarHistorial.addEventListener('click', () => {
  listaHistorial.innerHTML = '';
  contadorGanadores = 0;
});

btnGirar.addEventListener('click', girar);

dibujarRuleta();
