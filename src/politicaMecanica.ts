import type { Intervalo } from './intervalo';
import { Modalidade } from './modalidade';
import type { PoliticaDuracao } from './politicaDuracao';

export class PoliticaMecanica implements PoliticaDuracao {
    private minimo: number = 45;
    private maximo: number = 180;

    modalidade(): Modalidade {
        return Modalidade.MECANICO;
    }

    validar(janela: Intervalo): void {
        const duracao = janela.duracao();
        if (duracao < this.minimo || duracao > this.maximo) {
            throw new RangeError(
                `A duracao de ${duracao} min fora da faixa ${this.minimo}-${this.maximo} para a modalidade ${Modalidade.MECANICO}`,

            );
        }
    }

}