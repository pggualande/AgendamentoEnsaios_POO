import { Modalidade, isModalidade } from './modalidade';

export class Tecnico {
    private _matricula: string;
    private _nome: string;
    private _habilitacoes: Set<Modalidade>;

    constructor(matricula: string, nome: string, habilitacoes: Modalidade[]) {
        if (typeof matricula !== 'string' || matricula.trim() === '') {
            throw new RangeError('A matricula do tecnico nao pode ser vazia');
        }
        if (typeof nome !== 'string' || nome.trim() === '') {
            throw new RangeError('O nome do tecnico nao pode ser vazio');
        }
        if (!Array.isArray(habilitacoes) || habilitacoes.length === 0) {
            throw new RangeError('O tecnico precisa ter ao menos uma habilitacao');
        }
        for (const mod of habilitacoes) {
            if (!isModalidade(mod)) {
                throw new RangeError(`Modalidade invalida: ${String(mod)}`);
            }
        }

        this._matricula = matricula;
        this._nome = nome;
        this._habilitacoes = new Set(habilitacoes);

    }
    matricula(): string { return this._matricula; }
    nome(): string { return this._nome; }
    habilitacoes(): ReadonlySet<Modalidade> {
        return new Set(this._habilitacoes);
    }
    habilitadoPara(mod: Modalidade): boolean {
        return this._habilitacoes.has(mod);
    }
}
