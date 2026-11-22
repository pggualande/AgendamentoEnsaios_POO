export class Intervalo {
    constructor(public inicio: number, public fim: number) { }
    sobrepoe(outro: Intervalo): boolean {
        return this.inicio < outro.fim && outro.inicio < this.fim;
    }
}