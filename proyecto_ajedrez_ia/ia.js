/**
 * ia.js - Motor e Inteligencia Artificial para el proyecto "Aula de Jaque" (3º ESO)
 * Este archivo contiene la lógica de interacción visual y las decisiones de la IA.
 */

// 1. INICIALIZACIÓN DE VARIABLES Y OBJETOS
var board = null;                  // Objeto visual del tablero (Chessboard.js)
var game = new Chess();            // Objeto de reglas del ajedrez (Chess.js)
var jugadorHumano = 'w';           // El humano juega con Blancas ('w') por defecto
var nivelIA = 2;                   // Nivel por defecto: 2 (Captura de material)
var numJugadas = 0;

// =========================================================================
// ✏️ TAREA A (ALUMNADO): PERSONALIZAR EL VALOR DE LAS PIEZAS EN JAVASCRIPT
// =========================================================================
// Instrucciones para el alumnado:
// Modifica los números de la tabla VALORES_PIEZAS para cambiar el comportamiento de la IA.
// Ejemplo: Aumenta el valor de la Torre (r) a 60 o de los Peones (p) a 15.
// =========================================================================
var VALORES_PIEZAS = {
    p: 10,   // Peón (Puntos por defecto: 10)
    n: 30,   // Caballo (Puntos por defecto: 30)
    b: 30,   // Alfil (Puntos por defecto: 30)
    r: 50,   // Torre (Puntos por defecto: 50)
    q: 90,   // Dama (Puntos por defecto: 90)
    k: 900   // Rey (Puntos por defecto: 900)
};

// Tablas de posición simplificadas (Preferencia por el centro del tablero)
var TABLA_POSICION_PEON = [
    [ 0,  0,  0,  0,  0,  0,  0,  0],
    [ 5,  5,  5,  5,  5,  5,  5,  5],
    [ 1,  1,  2,  3,  3,  2,  1,  1],
    [ 0,  0,  2,  5,  5,  2,  0,  0],
    [ 0,  0,  0,  4,  4,  0,  0,  0],
    [ 0, -1, -1,  0,  0, -1, -1,  0],
    [ 0,  1,  1, -2, -2,  1,  1,  0],
    [ 0,  0,  0,  0,  0,  0,  0,  0]
];

// -------------------------------------------------------------------------
// 2. FUNCIONES DE EVALUACIÓN DE LA IA (LO QUE APRENDEN LOS ALUMNOS)
// -------------------------------------------------------------------------

/**
 * Calcula la puntuación total del tablero.
 * Puntuación positiva -> Ventaja para las Blancas
 * Puntuación negativa -> Ventaja para las Negras
 */
function evaluarTablero(juego) {
    var evaluacionTotal = 0;
    var boardMatrix = juego.board();

    for (var i = 0; i < 8; i++) {
        for (var j = 0; j < 8; j++) {
            var pieza = boardMatrix[i][j];
            if (pieza !== null) {
                var valor = VALORES_PIEZAS[pieza.type] || 0;
                
                // Bonificación por posición en peones
                if (pieza.type === 'p') {
                    valor += (pieza.color === 'w') ? TABLA_POSICION_PEON[i][j] : TABLA_POSICION_PEON[7 - i][j];
                }

                // =========================================================================
                // ✏️ TAREA B (ALUMNADO): AJUSTAR REGLAS CONDICIONALES (IF / ELSE) DE LA IA
                // =========================================================================
                // Instrucciones para el alumnado:
                // Escribe una estructura condicional 'if' aquí para darle más puntos a la IA cuando ocurra una condición.
                // Ejemplo (Descomenta y prueba esta línea):
                // if (pieza.type === 'q') { valor = valor + 10; } // Bonificación a la Dama
                // =========================================================================

                if (pieza.color === 'w') {
                    evaluacionTotal += valor;
                } else {
                    evaluacionTotal -= valor;
                }
            }
        }
    }
    return evaluacionTotal;
}

/**
 * Algoritmo Minimax (Nivel 3 - AlphaZero Mini)
 * Busca la mejor jugada explorando árboles de decisión a cierta profundidad.
 */
function minimax(juego, profundidad, esMaximizador, alfa, beta) {
    if (profundidad === 0 || juego.game_over()) {
        return evaluarTablero(juego);
    }

    var movimientos = juego.moves();

    if (esMaximizador) {
        var mejorEval = -9999;
        for (var i = 0; i < movimientos.length; i++) {
            juego.move(movimientos[i]);
            var evalActual = minimax(juego, profundidad - 1, false, alfa, beta);
            juego.undo();
            mejorEval = Math.max(mejorEval, evalActual);
            alfa = Math.max(alfa, evalActual);
            if (beta <= alfa) break; // Poda Alfa-Beta
        }
        return mejorEval;
    } else {
        var mejorEval = 9999;
        for (var i = 0; i < movimientos.length; i++) {
            juego.move(movimientos[i]);
            var evalActual = minimax(juego, profundidad - 1, true, alfa, beta);
            juego.undo();
            mejorEval = Math.min(mejorEval, evalActual);
            beta = Math.min(beta, evalActual);
            if (beta <= alfa) break; // Poda Alfa-Beta
        }
        return mejorEval;
    }
}

/**
 * Función principal que calcula la mejor jugada según el nivel seleccionado
 */
function calcularMejorMovimiento(juego) {
    var movimientosLegales = juego.moves();
    if (movimientosLegales.length === 0) return null;

    // NIVEL 1: Movimiento completamente aleatorio
    if (parseInt(nivelIA) === 1) {
        var indice = Math.floor(Math.random() * movimientosLegales.length);
        return movimientosLegales[indice];
    }

    // NIVEL 2: Evaluador de capturas inmediatas (Greedy/Codicioso)
    if (parseInt(nivelIA) === 2) {
        var esIAEstadoBlancas = (juego.turn() === 'w');
        var mejorMov = movimientosLegales[0];
        var mejorPuntuacion = esIAEstadoBlancas ? -9999 : 9999;

        for (var i = 0; i < movimientosLegales.length; i++) {
            juego.move(movimientosLegales[i]);
            var puntuacion = evaluarTablero(juego);
            juego.undo();

            if (esIAEstadoBlancas && puntuacion > mejorPuntuacion) {
                mejorPuntuacion = puntuacion;
                mejorMov = movimientosLegales[i];
            } else if (!esIAEstadoBlancas && puntuacion < mejorPuntuacion) {
                mejorPuntuacion = puntuacion;
                mejorMov = movimientosLegales[i];
            }
        }
        return mejorMov;
    }

    // NIVEL 3: AlphaZero Mini (Minimax a profundidad 3)
    if (parseInt(nivelIA) === 3) {
        var esIAEstadoBlancas = (juego.turn() === 'w');
        var mejorMov = movimientosLegales[0];
        var mejorPuntuacion = esIAEstadoBlancas ? -9999 : 9999;

        for (var i = 0; i < movimientosLegales.length; i++) {
            juego.move(movimientosLegales[i]);
            var puntuacion = minimax(juego, 2, !esIAEstadoBlancas, -10000, 10000);
            juego.undo();

            if (esIAEstadoBlancas && puntuacion > mejorPuntuacion) {
                mejorPuntuacion = puntuacion;
                mejorMov = movimientosLegales[i];
            } else if (!esIAEstadoBlancas && puntuacion < mejorPuntuacion) {
                mejorPuntuacion = puntuacion;
                mejorMov = movimientosLegales[i];
            }
        }
        return mejorMov;
    }
}

// -------------------------------------------------------------------------
// 3. EVENTOS DEL TABLERO DE AJEDREZ (INTERFAZ VISUAL)
// -------------------------------------------------------------------------

function alHacerDrag(source, piece) {
    // Si la partida terminó o no es el turno del jugador humano, deshabilitar arrastre
    if (game.game_over() || piece.search(jugadorHumano === 'w' ? /^b/ : /^w/) !== -1) {
        return false;
    }
}

function alSoltarPieza(source, target) {
    // Intentar realizar el movimiento legal en chess.js
    var move = game.move({
        from: source,
        to: target,
        promotion: 'q' // Promoción automática a Dama
    });

    // Movimiento ilegal -> Regresar pieza a origen
    if (move === null) return 'snapback';

    numJugadas++;
    registrarJugada(move);
    actualizarEstadoGrafico();

    // Turno de la IA (con un pequeño retraso de 300ms para realismo)
    window.setTimeout(hacerMovimientoIA, 300);
}

function alTerminarAnimacion() {
    board.position(game.fen());
}

function hacerMovimientoIA() {
    if (game.game_over()) return;

    var mejorMov = calcularMejorMovimiento(game);
    if (mejorMov) {
        var res = game.move(mejorMov);
        numJugadas++;
        registrarJugada(res);
        board.position(game.fen());
        actualizarEstadoGrafico();
    }
}

// -------------------------------------------------------------------------
// 4. FUNCIONES AUXILIARES DE LA INTERFAZ
// -------------------------------------------------------------------------

function actualizarEstadoGrafico() {
    var statusText = '';
    var evalScore = evaluarTablero(game) / 10.0; // Puntuación escalada

    if (game.in_checkmate()) {
        statusText = (game.turn() === 'w') ? '🏆 ¡Ganan las Negras por Jaque Mate!' : '🏆 ¡Ganan las Blancas por Jaque Mate!';
    } else if (game.in_draw()) {
        statusText = '🤝 Tablas (Empate)';
    } else {
        var turnoHumano = (game.turn() === jugadorHumano);
        statusText = turnoHumano ? 
            '<span class="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span> Tu turno (' + (jugadorHumano === 'w' ? 'Blancas' : 'Negras') + ')' : 
            '<span class="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse"></span> Turno IA (' + (jugadorHumano === 'w' ? 'Negras' : 'Blancas') + ')';
    }

    document.getElementById('turno-texto').innerHTML = statusText;
    document.getElementById('evaluacion-score').textContent = 'Ventaja: ' + (evalScore > 0 ? '+' : '') + evalScore.toFixed(1);
    document.getElementById('contador-movimientos').textContent = numJugadas + ' jugadas';
}

function registrarJugada(move) {
    var contenedor = document.getElementById('historial-jugadas');
    if (numJugadas === 1) {
        contenedor.innerHTML = '';
    }

    var p = document.createElement('p');
    p.className = 'py-0.5 border-b border-slate-900 flex justify-between';
    
    var nJugada = Math.ceil(numJugadas / 2);
    var bando = (move.color === 'w') ? '⚪ Blancas' : '⚫ Negras';
    p.innerHTML = '<span class="text-slate-500">' + nJugada + '. ' + bando + ':</span> <span class="font-bold text-amber-400">' + move.san + '</span>';
    
    contenedor.appendChild(p);
    contenedor.scrollTop = contenedor.scrollHeight;
}

function reiniciarPartida() {
    game.reset();
    numJugadas = 0;
    board.position('start');
    board.orientation(jugadorHumano === 'w' ? 'white' : 'black');
    document.getElementById('historial-jugadas').innerHTML = '<p class="text-slate-600 text-center py-8 italic text-xs">La partida aún no ha comenzado.</p>';
    actualizarEstadoGrafico();

    if (jugadorHumano === 'b') {
        window.setTimeout(hacerMovimientoIA, 500);
    }
}

// -------------------------------------------------------------------------
// 5. INICIALIZACIÓN AL CARGAR LA PÁGINA
// -------------------------------------------------------------------------

$(document.documentElement).ready(function() {
    // Configuración inicial del tablero de ajedrez
    var config = {
        draggable: true,
        position: 'start',
        onDragStart: alHacerDrag,
        onDrop: alSoltarPieza,
        onSnapEnd: alTerminarAnimacion,
        pieceTheme: 'https://chessboardjs.com/img/chesspieces/wikipedia/{piece}.png'
    };

    board = Chessboard('board', config);

    // Eventos de botones
    $('#btn-reiniciar').on('click', reiniciarPartida);
    $('#btn-cambiar-bando').on('click', function() {
        jugadorHumano = (jugadorHumano === 'w') ? 'b' : 'w';
        reiniciarPartida();
    });

    $('#dificultad').on('change', function() {
        nivelIA = this.value;
    });

    actualizarEstadoGrafico();
});
