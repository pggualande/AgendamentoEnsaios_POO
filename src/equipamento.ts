import { Modalidade } from './modalidade';

export class Equipamento {
    constructor(public codigo: string, public nome: string, public modalidades: Modalidade[]) { }
}