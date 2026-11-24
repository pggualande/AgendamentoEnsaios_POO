import type { Intervalo } from './intervalo';
import { Modalidade } from './modalidade';
import type { PoliticaDuracao } from './politicaDuracao';

export class PoliticaEletrica implements PoliticaDuracao {
    private minimo: number = 30;
    private maximo: number = 120;

    modalidade(): Modalidade {
        return Modalidade.ELETRICO;
    }

    validar(janela: Intervalo): void {
        const duracao = janela.duracao();
        if (duracao < this.minimo || duracao > this.maximo) {
            throw new RangeError(
                `A duracao de ${duracao} min fora da faixa ${this.minimo}-${this.maximo} para a modalidade ${Modalidade.ELETRICO}`,

            );
        }
    }

}