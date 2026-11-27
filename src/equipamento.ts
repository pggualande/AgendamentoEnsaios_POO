import { Modalidade, isModalidade } from './modalidade';

export class Equipamento {
    private _codigo: string;
    private _nome: string;
    private _modalidades: Set<Modalidade>;


    constructor(codigo: string, nome: string, modalidades: Modalidade[]) {
        if (typeof codigo !== 'string' || codigo.trim() === '') {
            throw new RangeError('O codigo do equipamento não pode ser vazio');

        }
        if (typeof nome !== 'string' || nome.trim() === '') {
            throw new RangeError('O nome do equipamento nao pode ser vazio');

        }
        if (!Array.isArray(modalidades) || modalidades.length === 0) {
            throw new RangeError('O equipamento precisa aceitar ao menos uma modalidade');

        }
        for (const mod of modalidades) {
            if (!isModalidade(mod)) {
                throw new RangeError(`Modalidade invalida: ${String(mod)}`);
            }
        }

        this._codigo = codigo;
        this._nome = nome;
        this._modalidades = new Set(modalidades);
    }

    codigo(): string { return this._codigo; }
    nome(): string { return this._nome; }
    modalidades(): ReadonlySet<Modalidade> {
        return new Set(this._modalidades);
    }
    suporta(mod: Modalidade): boolean {
        return this._modalidades.has(mod);
    }
}