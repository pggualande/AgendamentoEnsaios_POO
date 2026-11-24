import type { Equipamento } from './equipamento';
import { Estado } from './estado';
import type { Intervalo } from './intervalo';
import { isModalidade, Modalidade } from './modalidade';
import { RegistroTransicao } from './registroTransicao';
import type { Tecnico } from './tecnico';

export class Agendamento {
    private _codigo: string;
    private _equipamento: Equipamento;
    private _tecnico: Tecnico;
    private _modalidade: Modalidade;
    private _janela: Intervalo;
    private _estado: Estado;
    private _historico: RegistroTransicao[];

    constructor(codigo: string, equipamento: Equipamento, tecnico: Tecnico,
        modalidade: Modalidade, janela: Intervalo) {
        if (typeof codigo !== 'string' || codigo.trim() === '') {
            throw new RangeError('O codigo do agendamento nao pode ficar vazio');
        }
        if (!equipamento) throw new RangeError('Faltou o equipamento');
        if (!tecnico) throw new RangeError('Faltou o tecnico');
        if (!janela) throw new RangeError('Faltou a janela');
        if (!isModalidade(modalidade)) {
            throw new RangeError(`Modalidade invalida: ${String(modalidade)}`);
        }
        if (!equipamento.suporta(modalidade)) {
            throw new RangeError('Esse equipamento nao suporta essa modalidade');
        }
        if (!tecnico.habilitadoPara(modalidade)) {
            throw new RangeError('Esse tecnico nao e habilitado pra essa modalidade');
        }

        this._codigo = codigo;
        this._equipamento = equipamento;
        this._tecnico = tecnico;
        this._modalidade = modalidade;
        this._janela = janela;
        this._estado = Estado.SOLICITADO;
        this._historico = [new RegistroTransicao(1, Estado.SOLICITADO, 'solicitar')];
    }

    codigo(): string { return this._codigo; }
    estado(): Estado { return this._estado; }
    janela(): Intervalo { return this._janela; }
    equipamento(): Equipamento { return this._equipamento; }
    tecnico(): Tecnico { return this._tecnico; }
    modalidade(): Modalidade { return this._modalidade; }

    historico(): ReadonlyArray<RegistroTransicao> {
        return [...this._historico];
    }

    usaEquipamento(e: Equipamento): boolean { return this._equipamento === e; }
    usaTecnico(t: Tecnico): boolean { return this._tecnico === t; }

    ocupaRecursos(): boolean {
        return this._estado === Estado.CONFIRMADO
            || this._estado === Estado.EM_EXECUCAO
            || this._estado === Estado.CONCLUIDO;
    }

    confirmar(): void {
        this.exigirEstado('confirmar', Estado.SOLICITADO);
        this.registrar(Estado.CONFIRMADO, 'confirmar');
    }

    cancelar(): void {
        this.exigirEstado('cancelar', Estado.SOLICITADO, Estado.CONFIRMADO);
        this.registrar(Estado.CANCELADO, 'cancelar');
    }

    remarcar(novaJanela: Intervalo): void {
        this.exigirEstado('remarcar', Estado.CONFIRMADO);
        if (!novaJanela) throw new RangeError('Faltou a nova janela');
        this._janela = novaJanela;
        this.registrar(Estado.CONFIRMADO, 'remarcar');
    }

    iniciar(minutoAtual: number): void {
        this.exigirEstado('iniciar', Estado.CONFIRMADO);

        if (!Number.isInteger(minutoAtual)
            || minutoAtual < this._janela.inicio()
            || minutoAtual >= this._janela.fim()) {
            throw new RangeError('O minuto atual tem que ser inteiro e estar dentro da janela [inicio, fim)');
        }
        this.registrar(Estado.EM_EXECUCAO, 'iniciar');
    }

    concluir(): void {
        this.exigirEstado('concluir', Estado.EM_EXECUCAO);
        this.registrar(Estado.CONCLUIDO, 'concluir');
    }

    private exigirEstado(operacao: string, ...permitidos: Estado[]): void {
        if (!permitidos.includes(this._estado)) {
            throw new Error(`Nao da pra ${operacao} um agendamento que ta ${this._estado}`);
        }
    }

    private registrar(novoEstado: Estado, operacao: string): void {
        this._estado = novoEstado;
        this._historico.push(new RegistroTransicao(this._historico.length + 1, novoEstado, operacao));
    }
}