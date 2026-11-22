import { Estado } from './estado';
import { RegistroTransicao } from './registroTransicao';
import { Equipamento } from './equipamento';
import { Tecnico } from './tecnico';
import { Modalidade } from './modalidade';
import { Intervalo } from './intervalo';

export class Agendamento {
    public estado: Estado = 'SOLICITADO';
    public eventos: RegistroTransicao[] = [];
    constructor(
        public codigo: string,
        public equipamento: Equipamento,
        public tecnico: Tecnico,
        public modalidade: Modalidade,
        public intervalo: Intervalo,
    ) { }
    remarcar(novo: Intervalo): void { this.intervalo = novo; }
}

export class AgendamentoCampo extends Agendamento {
    override remarcar(novo: Intervalo): void {
        this.intervalo = new Intervalo(novo.inicio, novo.inicio + 30);
    }
}