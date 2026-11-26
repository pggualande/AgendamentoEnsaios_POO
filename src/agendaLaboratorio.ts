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