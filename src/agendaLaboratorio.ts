import { Agendamento } from './agendamento';
import type { Equipamento } from './equipamento';
import { Estado } from './estado';
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

        if (agendamento.estado() !== Estado.SOLICITADO) {
            throw new Error(`So da pra confirmar quem ta SOLICITADO (esse ta ${agendamento.estado()})`);
        }
        if (this.existeConflito(agendamento, agendamento.janela())) {
            throw new Error('Conflito: o equipamento ou o tecnico ja estao ocupados nessa janela');
        }

        const equipamentoOk = await this._calibracao.verificarCalibracao(agendamento.equipamento().codigo());
        if (!equipamentoOk) {
            throw new Error('Equipamento reprovado na verificacao de calibracao');
        }

        const acessoOk = await this._acesso.verificarAcesso(agendamento.tecnico().matricula());
        if (!acessoOk) {
            throw new Error('Tecnico sem acesso liberado');
        }

        if (this.existeConflito(agendamento, agendamento.janela())) {
            throw new Error('Conflito: o equipamento ou o tecnico foram ocupados enquanto a confirmacao esperava');
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

        if (this.existeConflito(agendamento, novaJanela)) {
            throw new Error('Conflito: o equipamento ou o tecnico ja estao ocupados na janela pedida');
        }

        agendamento.remarcar(novaJanela);
    }

    cancelar(codigo: string): void {
        this.buscar(codigo).cancelar();
    }

    iniciar(codigo: string, minutoAtual: number): void {
        this.buscar(codigo).iniciar(minutoAtual);
    }

    concluir(codigo: string): void {
        this.buscar(codigo).concluir();
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

    private existeConflito(candidato: Agendamento, janela: Intervalo): boolean {
        return this._agendamentos.some((outro) => {
            if (outro === candidato || !outro.ocupaRecursos()) return false;

            const mesmoRecurso = outro.usaEquipamento(candidato.equipamento())
                || outro.usaTecnico(candidato.tecnico());
            return mesmoRecurso && outro.janela().sobrepoe(janela);
        });
    }

    private buscar(codigo: string): Agendamento {
        const achado = this._agendamentos.find((a) => a.codigo() === codigo);
        if (!achado) throw new RangeError(`Nao existe agendamento com o codigo ${codigo}`);
        return achado;
    }
}