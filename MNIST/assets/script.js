// Variável global para armazenar o modelo
let model;

// URL de um modelo MNIST pré-treinado (um modelo simples de camadas densas)
// Onde esses modelos são armazenados? Em um servidor web (como o Google Storage) ou no seu próprio projeto.
const MODEL_URL =
  "https://storage.googleapis.com/tfjs-models/tfjs/mnist_transfer_cnn_v1/model.json";

// Função assíncrona para carregar o modelo
async function loadModel() {
  console.log("Carregando o modelo...");
  try {
    // tf.loadLayersModel() carrega o modelo baseado em sua arquitetura e pesos
    model = await tf.loadLayersModel(MODEL_URL);
    console.log("Modelo carregado com sucesso!");
    // Ocultar uma mensagem de "carregando" e mostrar a interface
    // Seu código aqui
  } catch (error) {
    console.error("Erro ao carregar o modelo:", error);
  }
}

// Exemplo de como ficaria a função de display:
function displayPrediction(probabilities) {
  const chartArea = document.getElementById("chart-area");
  chartArea.innerHTML = ""; // Limpa a área anterior

  probabilities.forEach((prob, index) => {
    const percent = Math.round(prob * 100);

    // Cria um elemento para a barra do gráfico
    const bar = document.createElement("div");
    bar.className = "chart-bar"; // Use CSS para estilizar esta classe
    bar.style.width = `${percent}%`;
    bar.textContent = `${index}: ${percent}%`;

    // Adiciona a barra na área do gráfico
    chartArea.appendChild(bar);

    // Atualiza a previsão principal
    if (
      percent === Math.max(...probabilities.map((p) => Math.round(p * 100)))
    ) {
      document.getElementById("prediction").textContent = index;
    }
  });
}

// Variáveis do Canvas
let canvas;
let ctx;
let isDrawing = false; // Flag para saber se o mouse está pressionado
const LINE_WIDTH = 20; // Espessura da linha do desenho (importante para MNIST)
const LINE_COLOR = "rgb(146, 223, 21)"; // Cor do desenho (MNIST usa branco sobre fundo escuro)

// Função de inicialização
function init() {
  // 1. Obtém o elemento canvas e seu contexto 2D
  canvas = document.getElementById("canvas-desenho");

  // *** DIAGNÓSTICO 1 ***
  if (!canvas) {
    console.error("ERRO CRÍTICO: Elemento Canvas não encontrado!");
    return;
  }
  console.log("Diagnóstico 1: Canvas encontrado. ID:", canvas.id);

  ctx = canvas.getContext("2d");

  // *** DIAGNÓSTICO 2 ***
  if (!ctx) {
    console.error("ERRO CRÍTICO: Contexto 2D não pode ser criado!");
    return;
  }
  console.log("Diagnóstico 2: Contexto 2D obtido com sucesso.");

  // 2. Configura o contexto do desenho
  ctx.lineWidth = LINE_WIDTH;
  ctx.lineCap = "round";
  ctx.strokeStyle = LINE_COLOR;

  // 3. Define o fundo inicial do canvas (Isto deve pintar a área de preto)
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  console.log(
    "Diagnóstico 3: Canvas pintado de preto. Desenho deve ser Verde Neon."
  );

  // 4. Configura os Event Listeners
  setupCanvasListeners();
  setupButtonListeners();
}

function setupCanvasListeners() {
  // Eventos de Mouse
  canvas.addEventListener("mousedown", startDrawing);
  canvas.addEventListener("mousemove", draw);
  canvas.addEventListener("mouseup", stopDrawing);
  canvas.addEventListener("mouseout", stopDrawing);

  // Eventos de Toque
  canvas.addEventListener("touchstart", (e) => {
    e.preventDefault();
    startDrawing(e);
  });
  canvas.addEventListener("touchmove", (e) => {
    e.preventDefault();
    draw(e);
  });
  canvas.addEventListener("touchend", stopDrawing);
}

function setupButtonListeners() {
  // Configura o botão Limpar
  document.getElementById("clear-btn").addEventListener("click", clearCanvas);

  // Configura o botão Classificar (Ainda a ser implementado)
  document
    .getElementById("classify-btn")
    .addEventListener("click", classifyDigit);
}

function startDrawing(e) {
  if (e.preventDefault) e.preventDefault();

  isDrawing = true;

  // Começa um novo caminho de desenho
  ctx.beginPath();

  const { x, y } = getCanvasCoordinates(e);

  // *** DIAGNÓSTICO 4 ***
  console.log(
    `Diagnóstico 4: Desenho iniciado. Coordenadas (x, y): (${x}, ${y})`
  );

  ctx.moveTo(x, y);
}

function draw(e) {
  if (!isDrawing) return;

  // ATENÇÃO: Se o mouse se move muito rápido, a linha pode ficar quebrada.
  // Usamos o beginPath e lineTo para corrigir isso.

  // Continua a linha até a nova posição do cursor
  const { x, y } = getCanvasCoordinates(e);
  ctx.lineTo(x, y);
  ctx.stroke(); // Desenha a linha
}

function stopDrawing() {
  isDrawing = false;
  ctx.closePath(); // Fecha o caminho de desenho atual

  // Opcional: Chama a classificação automaticamente após parar de desenhar
  // classifyDigit();
}

function clearCanvas() {
  // Preenche o canvas novamente com a cor de fundo preta
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Limpa o resultado da previsão
  document.getElementById("prediction").textContent = "?";
  document.getElementById("chart-area").innerHTML = "";
}

function getCanvasCoordinates(e) {
  // Para eventos de toque (touchstart, touchmove, touchend)
  if (e.touches && e.touches.length > 0) {
    // Usa a lógica baseada na posição do elemento para toque
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.touches[0].clientX - rect.left,
      y: e.touches[0].clientY - rect.top,
    };
  }

  // Para eventos de Mouse (mousedown, mousemove, mouseup)
  // Usa offsetX/offsetY, que já são coordenadas relativas ao Canvas.
  return {
    x: e.offsetX,
    y: e.offsetY,
  };
}

window.onload = function () {
  loadModel();
  init();
};

/**
 * Executa a classificação do desenho atual no canvas.
 * Esta é a função que aplica o modelo de Machine Learning.
 */
async function classifyDigit() {
  if (!model) {
    console.warn("Modelo ainda não carregado.");
    return;
  }

  // 1. Pré-processamento: Cria o Tensor (vetor de entrada x) a partir do desenho.
  // Esta é a etapa de Álgebra Linear aplicada!
  const tensor_x = preprocessCanvas(canvas);

  // 2. Previsão: Executa o modelo.
  // É aqui que ocorrem as multiplicações de matrizes/vetores (W*x + b) dentro da RN.
  const prediction = model.predict(tensor_x);

  // 3. Obtenção dos resultados: Converte o Tensor de saída para um array JavaScript.
  // O tensor de saída é um vetor de 10 elementos (probabilidades).
  const probabilities = prediction.dataSync();

  // 4. Limpeza da memória do Tensor (Prática recomendada do TensorFlow.js)
  tensor_x.dispose();
  prediction.dispose();

  // 5. Exibe o resultado da classificação (chama a função que você já criou)
  displayPrediction(probabilities);

  // Opcional: Mostra a previsão mais provável no console
  const topPrediction = probabilities.indexOf(Math.max(...probabilities));
  console.log(
    `Dígito previsto: ${topPrediction} com ${Math.round(
      Math.max(...probabilities) * 100
    )}% de confiança.`
  );
}

/**
 * Transforma o desenho do canvas em um Tensor 4D, redimensionado e normalizado,
 * pronto para a entrada da Rede Neural (W*x + b).
 * @param {HTMLCanvasElement} canvas - O canvas contendo o desenho.
 * @returns {tf.Tensor} O Tensor de entrada (1, 28, 28, 1).
 */
function preprocessCanvas(canvas) {
  // tf.tidy garante que todos os Tensors intermediários sejam limpos da memória.
  return tf.tidy(() => {
    // 1. Converte o canvas (280x280) para um Tensor em escala de cinza (1 canal)
    let tensor = tf.browser
      .fromPixels(canvas, 1) // Obtém apenas 1 canal (escala de cinza)
      .toFloat(); // Converte para ponto flutuante (Float32)

    // 2. Redimensionamento: Reduz o tensor para o tamanho esperado pelo modelo (28x28)
    // O modelo MNIST foi treinado com imagens 28x28.
    const resized = tf.image.resizeBilinear(tensor, [28, 28]);

    // 3. Normalização: O valor máximo (255) é dividido por 255, resultando em valores entre 0 e 1.
    const normalized = resized.div(255.0);

    // 4. Batched e Expansão: Adiciona as dimensões de Batch (1) e Canal (1)
    // O formato final é [BatchSize, Altura, Largura, Canais] => [1, 28, 28, 1]
    const batched = normalized.expandDims(0);

    return batched;
  });
}

function preprocessCanvas(canvas) {
  return tf.tidy(() => {
    // 1. Pega os 3 canais (RGB) para não perder a cor verde
    let tensor = tf.browser.fromPixels(canvas, 3);

    // 2. Converte para escala de cinza tirando a média dos canais (R+G+B)/3
    // Isso garante que o verde apareça para o modelo como "branco"
    let grayscale = tensor.mean(2).expandDims(-1);

    // 3. Redimensiona para 28x28 (tamanho padrão do MNIST)
    let resized = tf.image.resizeBilinear(grayscale, [28, 28]);

    // 4. Normaliza os pixels para o intervalo [0, 1]
    let normalized = resized.div(255.0);

    // 5. Adiciona a dimensão de lote (batch): [1, 28, 28, 1]
    return normalized.expandDims(0).toFloat();
  });
}
