const canvas = document.querySelector('.canvas');
const context = canvas.getContext('2d');

const setupButton = document.querySelector('.setup-button');
const startButton = document.querySelector('.start-button');
const clearButton = document.querySelector('.clear-button');
const randomButton = document.querySelector('.random-button');

const xSizeInput = document.querySelector('#x-size');
const ySizeInput = document.querySelector('#y-size');

const generationCounterText = document.querySelector('.generation');
let generationCount = 0;

let X_SIZE_TABLE;
let Y_SIZE_TABLE;

let MAX;
let MIN;

let CELL_COLOR = '#45a29e';

const CELL_SIZE_KOEF = 10;
const INTERVAL_DELAY = 100;

// const CANVAS_WIDTH = "400";
// const CANVAS_HEIGHT = "400";

let generationInterval; // Интервал для создания нового поколения
let cellsArray = []; // Массив состояний всех клеток
let changedCellsIndexes = []; // Массив индексов измененных клеток
let isMouseDown = false; // Флаг для отслеживания нажатия мыши
let lastX = null; // Координаты последней измененной клетки по X
let lastY = null; // Координаты последней измененной клетки по Y

const createTable = () => {
  canvas.width = `${X_SIZE_TABLE * CELL_SIZE_KOEF}`;
  canvas.height = `${Y_SIZE_TABLE * CELL_SIZE_KOEF}`;

  resetCellsArray();
  render();
  // drawCells();
  createGrid();
};

const resetCellsArray = (initialValue = false) => {
  cellsArray = new Array(X_SIZE_TABLE * Y_SIZE_TABLE).fill(initialValue);
};

const initializeGame = () => {
  X_SIZE_TABLE = parseInt(xSizeInput.value);
  Y_SIZE_TABLE = parseInt(ySizeInput.value);

  MIN = Math.min(X_SIZE_TABLE, Y_SIZE_TABLE);
  MAX = Math.max(X_SIZE_TABLE, Y_SIZE_TABLE);

  generationCount = 0;
  generationCounterText.textContent = 'Поколение: 0';

  clearInterval(generationInterval);

  createTable(); // Создаем игровое поле
};

const randomGenerate = () => {
  cellsArray = Array.from({ length: X_SIZE_TABLE * Y_SIZE_TABLE }, () => Math.random() < 0.15);
  render();
  createGrid();
};

const clearCanvas = () => context.clearRect(0, 0, canvas.width, canvas.height);

const render = () => {
  clearCanvas();
  drawCells();
  // createGrid();
};

const createGrid = () => {
  for (let i = 0; i <= MAX; i++) {
    const x = (i * canvas.width) / X_SIZE_TABLE;
    const y = (i * canvas.height) / Y_SIZE_TABLE;

    context.strokeStyle = '#000';

    if (i <= Y_SIZE_TABLE) {
      context.beginPath();
      context.moveTo(0, y);
      context.lineTo(canvas.width, y);
      context.stroke();
    }

    if (i <= X_SIZE_TABLE) {
      context.beginPath();
      context.moveTo(x, 0);
      context.lineTo(x, canvas.height);
      context.stroke();
    }
  }
};

const clearCells = () => {
  resetCellsArray();
  generationCount = 0;
  generationCounterText.textContent = 'Поколение: 0';
  clearCanvas();
  createGrid();
};

const drawCells = () => {
  // Проходим по строкам сверху вниз
  for (let i = 0; i < Y_SIZE_TABLE; i++) {
    // Проходим по ячейкам слево направо
    for (let j = 0; j < X_SIZE_TABLE; j++) {
      const index = getCellIndex(j, i);
      if (cellsArray[index]) {
        context.fillStyle = CELL_COLOR; // Заливаем цветом клетки
        context.fillRect(j * CELL_SIZE_KOEF + 1, i * CELL_SIZE_KOEF + 1, CELL_SIZE_KOEF - 2, CELL_SIZE_KOEF - 2);
        // context.strokeRect(j * CELL_SIZE_KOEF, i * CELL_SIZE_KOEF, CELL_SIZE_KOEF, CELL_SIZE_KOEF);
      }
    }
  }
};

const drawCell = (x, y, isActive) => {
  context.fillStyle = isActive ? CELL_COLOR : '#1f2833';
  context.fillRect(x * CELL_SIZE_KOEF + 1, y * CELL_SIZE_KOEF + 1, CELL_SIZE_KOEF - 2, CELL_SIZE_KOEF - 2);
};

const getCellIndex = (x, y) => y * X_SIZE_TABLE + x;

const getCoordsByIndex = (index) => {
  const x = index % X_SIZE_TABLE;
  const y = Math.floor(index / X_SIZE_TABLE);
  return [x, y];
};

// Функция для изменения состояния клетки
const changeCellState = (event) => {
  const rect = canvas.getBoundingClientRect();
  const x = Math.floor((event.clientX - rect.left) / (canvas.width / X_SIZE_TABLE));
  const y = Math.floor((event.clientY - rect.top) / (canvas.height / Y_SIZE_TABLE));

  // Проверяем, совпадают ли текущие координаты с последними измененными
  if (x === lastX && y === lastY) return;

  const index = getCellIndex(x, y);
  cellsArray[index] = !cellsArray[index];
  drawCell(x, y, cellsArray[index]);

  lastX = x;
  lastY = y;
};

// Функция для замыкания координат по границе
const wrapCoordinate = (coord, maxSize) => {
  return (coord + maxSize) % maxSize;
};

const countNeighbors = (index) => {
  const [x, y] = getCoordsByIndex(index);

  let count = 0;

  for (let i = -1; i <= 1; i++) {
    for (let j = -1; j <= 1; j++) {
      if (i === 0 && j === 0) continue;

      const neighborX = wrapCoordinate(x + i, X_SIZE_TABLE);
      const neighborY = wrapCoordinate(y + j, Y_SIZE_TABLE);

      const neighborIndex = getCellIndex(neighborX, neighborY);

      count += cellsArray[neighborIndex] ? 1 : 0; // Добавляем 1, если клетка живая
    }
  }
  return count;
};

const stopGame = () => {
  clearInterval(generationInterval); // Если эволюция запущена, останавливаем
  generationInterval = null;
  createGrid();
};

const startGame = () => {
  generationInterval = setInterval(generateNextGeneration, INTERVAL_DELAY);
};

const toggleGame = () => {
  if (generationInterval) {
    stopGame();
  } else {
    startGame();
  }
};

const renderChangedCells = () => {
  changedCellsIndexes.forEach((index) => {
    const [x, y] = getCoordsByIndex(index);
    drawCell(x, y, cellsArray[index]);
  });
};

const generateNextGeneration = () => {
  const nextGeneration = [];
  let hasChanged = false; // Флаг, указывающий, изменилось ли состояние хотя бы одной клетки
  changedCellsIndexes = [];

  for (let i = 0; i < cellsArray.length; i++) {
    const counterNeighbors = countNeighbors(i);
    let nextCellState = cellsArray[i];

    if (cellsArray[i] && (counterNeighbors < 2 || counterNeighbors > 3)) {
      nextCellState = false;
    } else if (counterNeighbors === 3) {
      nextCellState = true;
    }

    if (nextCellState !== cellsArray[i]) {
      hasChanged = true; // Обнаружено изменение, поколения не идентичны
      changedCellsIndexes.push(i);
    }

    nextGeneration.push(nextCellState);
  }

  if (!hasChanged) {
    stopGame();
    generationCounterText.textContent = `Автоматическая остановка. Поколение: ${generationCount}`;
    return;
  }

  cellsArray = nextGeneration;
  generationCount++;
  generationCounterText.textContent = `Поколение: ${generationCount}`;

  // render();
  renderChangedCells();
};

const handleMouseUp = () => {
  isMouseDown = false;
  lastX = null;
  lastY = null;
};

initializeGame();

// =============== listeners ================

setupButton.addEventListener('click', initializeGame);
startButton.addEventListener('click', toggleGame);
clearButton.addEventListener('click', clearCells);
randomButton.addEventListener('click', randomGenerate);

canvas.addEventListener('mousedown', (event) => {
  isMouseDown = true;
  changeCellState(event);
});

canvas.addEventListener('mousemove', (event) => {
  if (isMouseDown) {
    changeCellState(event);
  }
});

canvas.addEventListener('mouseup', handleMouseUp);
canvas.addEventListener('mouseleave', handleMouseUp);
