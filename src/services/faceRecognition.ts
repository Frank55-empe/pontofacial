import * as faceapi from 'face-api.js';
import { APP_CONFIG } from '../config';

// ============================================================
// RECONHECIMENTO FACIAL (face-api.js)
// ============================================================
// Os modelos de IA ficam em /public/models e são carregados uma
// única vez, direto no navegador da pessoa (nada sai do
// computador/celular dela, tudo roda localmente).

const MODEL_URL = `${import.meta.env.BASE_URL}models`;

let carregando: Promise<void> | null = null;

export async function carregarModelosFaciais(): Promise<void> {
  if (carregando) return carregando;

  carregando = (async () => {
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
    ]);
  })();

  return carregando;
}

export interface RostoDetectado {
  descritor: Float32Array;
  caixa: faceapi.Box;
}

/** Procura um rosto no frame atual do vídeo e devolve o descritor facial (128 números que representam o rosto) */
export async function detectarRosto(
  elemento: HTMLVideoElement
): Promise<RostoDetectado | null> {
  const deteccao = await faceapi
    .detectSingleFace(elemento, new faceapi.TinyFaceDetectorOptions({ inputSize: 320 }))
    .withFaceLandmarks()
    .withFaceDescriptor();

  if (!deteccao) return null;

  return {
    descritor: deteccao.descriptor,
    caixa: deteccao.detection.box,
  };
}

/** Converte o descritor (Float32Array) para texto, pra guardar numa célula do Google Sheets */
export function descritorParaTexto(descritor: Float32Array): string {
  return Array.from(descritor).join(',');
}

/** Converte de volta o texto guardado na planilha para o formato que o face-api.js entende */
export function textoParaDescritor(texto: string): Float32Array | null {
  const numeros = texto.split(',').map(Number);
  if (numeros.length !== 128 || numeros.some(Number.isNaN)) return null;
  return new Float32Array(numeros);
}

export interface Correspondencia {
  id: string;
  nome: string;
  distancia: number;
}

/**
 * Compara um rosto detectado contra a lista de funcionários cadastrados
 * e devolve o mais parecido, desde que esteja dentro do limiar aceito
 * (ver APP_CONFIG.limiarReconhecimentoFacial em config.ts).
 */
export function encontrarMelhorCorrespondencia(
  descritor: Float32Array,
  funcionarios: { id: string; nome: string; descritorFacial: string }[]
): Correspondencia | null {
  let melhor: Correspondencia | null = null;

  for (const f of funcionarios) {
    if (!f.descritorFacial) continue;
    const descritorCadastrado = textoParaDescritor(f.descritorFacial);
    if (!descritorCadastrado) continue;

    const distancia = faceapi.euclideanDistance(descritor, descritorCadastrado);
    if (!melhor || distancia < melhor.distancia) {
      melhor = { id: f.id, nome: f.nome, distancia };
    }
  }

  if (melhor && melhor.distancia <= APP_CONFIG.limiarReconhecimentoFacial) {
    return melhor;
  }
  return null;
}
