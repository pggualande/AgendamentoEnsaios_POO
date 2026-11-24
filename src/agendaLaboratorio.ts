import { Agendamento } from './agendamento';
import { ServicoLocal } from './servicosLaboratorio';
import { Equipamento } from './equipamento';
import { Tecnico } from './tecnico';
import { Modalidade } from './modalidade';
import { Intervalo } from './intervalo';
import { RegistroTransicao } from './registroTransicao';

export class AgendaLaboratorio {
    public registros: Agendamento[] = [];
    private servico = new ServicoLocal();

    solicitar(codigo: string, equipamento: Equipamento, tecnico: Tecnico, modalidade: Modalidade,
        inicio: number, fim: number): Agendamento {
        const a = new Agendamento(codigo, equipamento, tecnico, modalidade, new Intervalo(inicio, fim));
        this.registros.push(a);
        return a;
    }

    async confirmar(a: Agendamento): Promise<void> {
        if (a.estado !== 'SOLICITADO') throw new Error('Estado');
        for (const atual of this.registros) {
            if (atual !== a && atual.estado === 'CONFIRMADO' &&
                atual.equipamento === a.equipamento && atual.intervalo.sobrepoe(a.intervalo)) {
                throw new Error('Conflito');
            }
        }
        const calibrado = await this.servico.verificarCalibracao(a.equipamento.codigo());
        const autorizado = await this.servico.verificarAcesso(a.tecnico.matricula());
        if (!calibrado || !autorizado) throw new Error('Indisponível');

        if (a.modalidade === 'ELETRICO' && (a.intervalo.duracao() < 30 || a.intervalo.duracao() > 120)) {
            throw new Error('Duração');
        }
        if (a.modalidade === 'MECANICO' && (a.intervalo.duracao() < 45 || a.intervalo.duracao() > 180)) {
            throw new Error('Duração');
        }

        a.estado = 'CONFIRMADO';
        a.eventos.push(new RegistroTransicao('Confirmado', a.estado));
    }

    gerarResumoCSV(): string {
        const linhas = ['codigo;estado;inicio;fim'];
        for (const a of this.registros) {
            linhas.push(`${a.codigo};${a.estado};${a.intervalo.inicio};${a.intervalo.fim}`);
        }
        return linhas.join('\n');
    }

    remarcar(a: Agendamento, inicio: number, fim: number): void {
        if (a.estado !== 'CONFIRMADO') throw new Error('Estado');
        a.remarcar(new Intervalo(inicio, fim));
    }

    cancelar(a: Agendamento): void {
        if (a.estado !== 'SOLICITADO' && a.estado !== 'CONFIRMADO') throw new Error('Estado');
        a.estado = 'CANCELADO';
        a.eventos.push(new RegistroTransicao('Cancelado', a.estado));
    }

    iniciar(a: Agendamento, _minutoAtual: number): void {
        if (a.estado !== 'CONFIRMADO') throw new Error('Estado');
        a.estado = 'EM_EXECUCAO';
    }

    concluir(a: Agendamento): void {
        if (a.estado !== 'EM_EXECUCAO') throw new Error('Estado');
        a.estado = 'CONCLUIDO';
    }
}