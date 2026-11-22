import { Estado } from './estado';

export class RegistroTransicao {
    constructor(public descricao: string, public estado: Estado) { }
}