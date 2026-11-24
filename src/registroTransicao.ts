import { Estado, isEstado } from './estado';

export class RegistroTransicao {
    private _sequencia: number;
    private _estado: Estado;
    private _operacao: string;

    constructor(sequencia: number, estado: Estado, operacao: string) {
        if (!Number.isInteger(sequencia) || sequencia < 1) {
            throw new RangeError('A sequencia deve ser maior que 1');
        }
        if (!isEstado(estado)) {
            throw new RangeError(`Estado invalido: ${String(estado)}`);
        }
        if (typeof operacao !== 'string' || operacao.trim() === '') {
            throw new RangeError('A operacao nao pode ser vazia');
        }

        this._sequencia = sequencia;
        this._estado = estado;
        this._operacao = operacao;
    }
    sequencia(): number { return this._sequencia; }
    estado(): Estado { return this._estado; }
    operacao(): string { return this._operacao; }
}