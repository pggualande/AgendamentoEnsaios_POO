import type { Intervalo } from './intervalo';
import type { Modalidade } from './modalidade';

export interface PoliticaDuracao {
    modalidade(): Modalidade;
    validar(janela: Intervalo): void;
}