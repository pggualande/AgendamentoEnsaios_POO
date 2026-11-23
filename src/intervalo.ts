export class Intervalo {
    private _inicio: number;
    private _fim: number;

    constructor(inicio: number, fim: number) {
        if (!Number.isInteger(inicio) || !Number.isInteger(fim)) {
            throw new RangeError('O número do inicio e/ou do fim devem ser inteiros');
        }
        if (inicio < 0 || fim > 10080 || inicio >= fim) {
            throw new RangeError('Intervalo inválido'); // melhorar essa msg dps, pouco descritiva
        }
        this._inicio = inicio;
        this._fim = fim;
    }

    inicio(): number { return this._inicio; }
    fim(): number { return this._fim; }
    duracao(): number { return this._fim - this._inicio; }
    sobrepoe(outro: Intervalo): boolean {
        return this._inicio < outro._fim && outro._inicio < this._fim;
    }

}