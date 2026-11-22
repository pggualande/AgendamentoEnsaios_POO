import { Modalidade } from './modalidade';

export class Tecnico {
    constructor(public matricula: string, public nome: string, public qualificacoes: Modalidade[]) { }
}