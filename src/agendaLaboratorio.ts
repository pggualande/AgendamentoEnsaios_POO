import { Agendamento } from './agendamento';
import type { Equipamento } from './equipamento';
import type { Estado } from './estado';
import type { Intervalo } from './intervalo';
import type { Modalidade } from './modalidade';
import type { PoliticaDuracao } from './politicaDuracao';
import type { RegistroTransicao } from './registroTransicao';
import type { Tecnico } from './tecnico';
import type { VerificadorAcesso } from './verificadorAcesso';
import type { VerificadorCalibracao } from './verificadorCalibracao';

export class AgendaLaboratorio {
    private _calibracao: VerificadorCalibracao;
    private _acesso: VerificadorAcesso;
    private _politicas: PoliticaDuracao[];
    private _agendamentos: Agendamento[] = [];

    constructor(calibracao: VerificadorCalibracao, acesso: VerificadorAcesso,
        politicas: PoliticaDuracao[]) {
        if (!calibracao) throw new RangeError('Faltou o verificador de calibracao');
        if (!acesso) throw new RangeError('Faltou o verificador de acesso');
        if (!Array.isArray(politicas) || politicas.length === 0) {
            throw new RangeError('Precisa de pelo menos uma politica de duracao');
        }

        this._calibracao = calibracao;
        this._acesso = acesso;
        this._politicas = [...politicas];
    }

    solicitar(codigo: string, equipamento: Equipamento, tecnico: Tecnico,
        modalidade: Modalidade, janela: Intervalo): void {
        if (!janela) throw new RangeError('Faltou a janela');

        const politica = this._politicas.find((p) => p.modalidade() === modalidade);
        if (!politica) {
            throw new RangeError(`Nao tem politica de duracao pra modalidade ${String(modalidade)}`);
        }
        politica.validar(janela);

        if (this._agendamentos.some((a) => a.codigo() === codigo)) {
            throw new RangeError(`Ja existe agendamento com o codigo ${codigo}`);
        }

        const novo = new Agendamento(codigo, equipamento, tecnico, modalidade, janela);
        this._agendamentos.push(novo);
    }

    async confirmar(codigo: string): Promise<void> {
        const agendamento = this.buscar(codigo);

        const equipamentoOk = await this._calibracao.verificarCalibracao(agendamento.equipamento().codigo());
        if (!equipamentoOk) {
            throw new Error('Equipamento reprovado na verificação de calibração');
        }

        const acessoOk = await this._acesso.verificarAcesso(agendamento.tecnico().matricula()); // Ou .matricula(), confira no seu Tecnico
        if (!acessoOk) {
            throw new Error('Técnico não possui acesso liberado para este laboratório');
        }

        agendamento.confirmar();
    }

    remarcar(codigo: string, novaJanela: Intervalo): void {
        if (!novaJanela) throw new RangeError('Faltou a nova janela');

        const agendamento = this.buscar(codigo);

        const politica = this._politicas.find((p) => p.modalidade() === agendamento.modalidade());
        if (!politica) {
            throw new RangeError(`Nao tem politica de duracao pra modalidade ${String(agendamento.modalidade())}`);
        }
        politica.validar(novaJanela);

        const temConflito = this._agendamentos.some((outro) => {
            if (outro.codigo() === codigo || !outro.ocupaRecursos()) return false;

            const usaMesmoRecurso = outro.usaEquipamento(agendamento.equipamento()) || outro.usaTecnico(agendamento.tecnico());
            return usaMesmoRecurso && outro.janela().sobrepoe(novaJanela);
        });

        if (temConflito) {
            throw new Error(`Conflito detectado: o equipamento ou tecnico ja estao ocupados na janela solicitada`);
        }

        agendamento.remarcar(novaJanela);
    }

    cancelar(codigo: string): void {
        const agendamento = this.buscar(codigo);
        agendamento.cancelar();
    }

    iniciar(codigo: string, minutoAtual: number): void {
        const agendamento = this.buscar(codigo);
        agendamento.iniciar(minutoAtual);
    }

    concluir(codigo: string): void {
        const agendamento = this.buscar(codigo);
        agendamento.concluir();
    }

    consultarEstado(codigo: string): Estado {
        return this.buscar(codigo).estado();
    }

    consultarJanela(codigo: string): Intervalo {
        return this.buscar(codigo).janela();
    }

    consultarHistorico(codigo: string): ReadonlyArray<RegistroTransicao> {
        return this.buscar(codigo).historico();
    }

    private buscar(codigo: string): Agendamento {
        const achado = this._agendamentos.find((a) => a.codigo() === codigo);
        if (!achado) throw new RangeError(`Nao existe agendamento com o codigo ${codigo}`);
        return achado;
    }
}