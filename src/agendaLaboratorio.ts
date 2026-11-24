import { Agendamento } from './agendamento';
import { ServicoLocal } from './servicosLaboratorio';
import { Equipamento } from './equipamento';
import { Tecnico } from './tecnico';
import { Modalidade } from './modalidade';
import { Intervalo } from './intervalo';

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
        if (a.estado() !== 'SOLICITADO') throw new Error('Estado');
        for (const atual of this.registros) {
            if (atual !== a && atual.estado() === 'CONFIRMADO' &&
                atual.usaEquipamento(a.equipamento()) && atual.janela().sobrepoe(a.janela())) {
                throw new Error('Conflito');
            }
        }
        const calibrado = await this.servico.verificarCalibracao(a.equipamento().codigo());
        const autorizado = await this.servico.verificarAcesso(a.tecnico().matricula());
        if (!calibrado || !autorizado) throw new Error('Indisponivel');

        if (a.modalidade() === 'ELETRICO' && (a.janela().duracao() < 30 || a.janela().duracao() > 120)) {
            throw new Error('Duracao');
        }
        if (a.modalidade() === 'MECANICO' && (a.janela().duracao() < 45 || a.janela().duracao() > 180)) {
            throw new Error('Duracao');
        }

        a.confirmar();
    }

    gerarResumoCSV(): string {
        const linhas = ['codigo;estado;inicio;fim'];
        for (const a of this.registros) {
            linhas.push(`${a.codigo()};${a.estado()};${a.janela().inicio()};${a.janela().fim()}`);
        }
        return linhas.join('\n');
    }

    remarcar(a: Agendamento, inicio: number, fim: number): void {
        a.remarcar(new Intervalo(inicio, fim));
    }

    cancelar(a: Agendamento): void {
        a.cancelar();
    }

    iniciar(a: Agendamento, minutoAtual: number): void {
        a.iniciar(minutoAtual);
    }

    concluir(a: Agendamento): void {
        a.concluir();
    }
}