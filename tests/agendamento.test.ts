import { describe, it, expect } from 'vitest';
import { Agendamento } from '../src/agendamento';
import { Equipamento } from '../src/equipamento';
import { Estado } from '../src/estado';
import { Intervalo } from '../src/intervalo';
import { Modalidade } from '../src/modalidade';
import { RegistroTransicao } from '../src/registroTransicao';
import { Tecnico } from '../src/tecnico';

const equipamento = () => new Equipamento('EQ-10', 'Osciloscopio', [Modalidade.ELETRICO]);
const tecnico = () => new Tecnico('TC-04', 'Lia', [Modalidade.ELETRICO]);

function solicitado(codigo = 'A-1'): Agendamento {
    return new Agendamento(codigo, equipamento(), tecnico(), Modalidade.ELETRICO, new Intervalo(60, 120));
}
function confirmado(): Agendamento {
    const a = solicitado();
    a.confirmar();
    return a;
}
function emExecucao(): Agendamento {
    const a = confirmado();
    a.iniciar(60);
    return a;
}
function concluido(): Agendamento {
    const a = emExecucao();
    a.concluir();
    return a;
}

describe('Agendamento', () => {
    describe('criacao (R05, R06)', () => {
        it('comeca sem ocupar recursos e com o histórico inicial', () => {
            const a = solicitado();
            expect(a.codigo()).toBe('A-1');
            expect(a.estado()).toBe(Estado.SOLICITADO);
            expect(a.ocupaRecursos()).toBe(false);
            expect(a.janela().inicio()).toBe(60);
            expect(a.janela().fim()).toBe(120);

            const historico = a.historico();
            expect(historico).toHaveLength(1);
            expect(historico[0]?.sequencia()).toBe(1);
            expect(historico[0]?.estado()).toBe(Estado.SOLICITADO);
            expect(historico[0]?.operacao()).toBe('solicitar');
        });

        it.each([
            ['vazio', ''],
            ['so espaços', '   '],
        ])('rejeita codigo %s', (_descricao, codigo) => {
            expect(() => new Agendamento(codigo, equipamento(), tecnico(), Modalidade.ELETRICO, new Intervalo(60, 120))).toThrow(RangeError);
        });

        it('rejeita equipamento incompativel com a modalidade', () => {
            const soMecanico = new Equipamento('EQ-2', 'Prensa', [Modalidade.MECANICO]);
            expect(() => new Agendamento('A-1', soMecanico, tecnico(), Modalidade.ELETRICO, new Intervalo(60, 120))).toThrow(RangeError);
        });

        it('rejeita tecnico nao habilitado para a modalidade', () => {
            const soMecanico = new Tecnico('TC-9', 'Davi', [Modalidade.MECANICO]);
            expect(() => new Agendamento('A-1', equipamento(), soMecanico, Modalidade.ELETRICO, new Intervalo(60, 120))).toThrow(RangeError);
        });

        it('rejeita modalidade desconhecida', () => {
            const invalida = 'QUIMICO' as unknown as Modalidade;
            expect(() => new Agendamento('A-1', equipamento(), tecnico(), invalida, new Intervalo(60, 120))).toThrow(RangeError);
        });

        it.each([
            ['equipamento', () => new Agendamento('A-1', null as unknown as Equipamento, tecnico(), Modalidade.ELETRICO, new Intervalo(60, 120))],
            ['tecnico', () => new Agendamento('A-1', equipamento(), null as unknown as Tecnico, Modalidade.ELETRICO, new Intervalo(60, 120))],
            ['janela', () => new Agendamento('A-1', equipamento(), tecnico(), Modalidade.ELETRICO, null as unknown as Intervalo)],
        ])('rejeita %s ausente', (_descricao, criar) => {
            expect(criar).toThrow(RangeError);
        });
    });

    describe('identidade dos recursos (R07)', () => {
        it('reconhece a mesma instancia de equipamento e de tecnico', () => {
            const eq = equipamento();
            const tc = tecnico();
            const a = new Agendamento('A-1', eq, tc, Modalidade.ELETRICO, new Intervalo(60, 120));
            expect(a.usaEquipamento(eq)).toBe(true);
            expect(a.usaTecnico(tc)).toBe(true);
        });

        it('nao confunde objetos diferentes com os mesmos dados', () => {
            const a = solicitado();
            expect(a.usaEquipamento(equipamento())).toBe(false);
            expect(a.usaTecnico(tecnico())).toBe(false);
        });
    });

    describe('confirmar (R09)', () => {
        it('SOLICITADO vira CONFIRMADO, ocupa recursos e registra a transicao', () => {
            const a = confirmado();
            expect(a.estado()).toBe(Estado.CONFIRMADO);
            expect(a.ocupaRecursos()).toBe(true);

            const historico = a.historico();
            expect(historico).toHaveLength(2);
            expect(historico[1]?.sequencia()).toBe(2);
            expect(historico[1]?.estado()).toBe(Estado.CONFIRMADO);
            expect(historico[1]?.operacao()).toBe('confirmar');
        });

        it.each([
            ['CONFIRMADO', confirmado],
            ['EM_EXECUCAO', emExecucao],
            ['CONCLUIDO', concluido],
        ])('rejeita confirmar quando está %s, sem alterar nada', (_estado, criar) => {
            const a = criar();
            const estadoAntes = a.estado();
            const tamanhoAntes = a.historico().length;

            expect(() => a.confirmar()).toThrow();
            expect(a.estado()).toBe(estadoAntes);
            expect(a.historico()).toHaveLength(tamanhoAntes);
        });
    });

    describe('cancelar (R13)', () => {
        it.each([
            ['SOLICITADO', solicitado],
            ['CONFIRMADO', confirmado],
        ])('cancela a partir de %s, libera a ocupacao e registra', (_estado, criar) => {
            const a = criar();
            const tamanhoAntes = a.historico().length;

            a.cancelar();

            expect(a.estado()).toBe(Estado.CANCELADO);
            expect(a.ocupaRecursos()).toBe(false);
            const historico = a.historico();
            expect(historico).toHaveLength(tamanhoAntes + 1);
            expect(historico[historico.length - 1]?.estado()).toBe(Estado.CANCELADO);
            expect(historico[historico.length - 1]?.operacao()).toBe('cancelar');
        });

        it('rejeita cancelar duas vezes', () => {
            const a = solicitado();
            a.cancelar();
            const tamanhoAntes = a.historico().length;

            expect(() => a.cancelar()).toThrow();
            expect(a.estado()).toBe(Estado.CANCELADO);
            expect(a.historico()).toHaveLength(tamanhoAntes);
        });

        it.each([
            ['EM_EXECUCAO', emExecucao],
            ['CONCLUIDO', concluido],
        ])('rejeita cancelar quando está %s, sem alterar nada', (_estado, criar) => {
            const a = criar();
            const estadoAntes = a.estado();
            const tamanhoAntes = a.historico().length;

            expect(() => a.cancelar()).toThrow();
            expect(a.estado()).toBe(estadoAntes);
            expect(a.historico()).toHaveLength(tamanhoAntes);
        });
    });

    describe('remarcar (R12)', () => {
        it('troca a janela por exatamente a pedida, mantendo identidade e estado', () => {
            const eq = equipamento();
            const tc = tecnico();
            const a = new Agendamento('A-1', eq, tc, Modalidade.ELETRICO, new Intervalo(60, 120));
            a.confirmar();

            a.remarcar(new Intervalo(120, 180));

            expect(a.janela().inicio()).toBe(120);
            expect(a.janela().fim()).toBe(180);
            expect(a.estado()).toBe(Estado.CONFIRMADO);
            expect(a.usaEquipamento(eq)).toBe(true);
            expect(a.usaTecnico(tc)).toBe(true);
        });

        it('registra a remarcacao no historico', () => {
            const a = confirmado();
            a.remarcar(new Intervalo(120, 180));

            const historico = a.historico();
            expect(historico).toHaveLength(3);
            expect(historico[2]?.estado()).toBe(Estado.CONFIRMADO);
            expect(historico[2]?.operacao()).toBe('remarcar');
        });

        it.each([
            ['SOLICITADO', solicitado],
            ['EM_EXECUCAO', emExecucao],
            ['CONCLUIDO', concluido],
        ])('rejeita remarcar quando está %s, preservando a janela antiga', (_estado, criar) => {
            const a = criar();
            const tamanhoAntes = a.historico().length;

            expect(() => a.remarcar(new Intervalo(200, 260))).toThrow();
            expect(a.janela().inicio()).toBe(60);
            expect(a.janela().fim()).toBe(120);
            expect(a.historico()).toHaveLength(tamanhoAntes);
        });
    });

    describe('iniciar (R14)', () => {
        it.each([
            ['no instante de inicio', 60],
            ['no meio da janela', 90],
            ['no ultimo minuto da janela', 119],
        ])('inicia %s', (_descricao, minuto) => {
            const a = confirmado();
            a.iniciar(minuto);

            expect(a.estado()).toBe(Estado.EM_EXECUCAO);
            expect(a.ocupaRecursos()).toBe(true);
            const historico = a.historico();
            expect(historico[historico.length - 1]?.estado()).toBe(Estado.EM_EXECUCAO);
            expect(historico[historico.length - 1]?.operacao()).toBe('iniciar');
        });

        it.each([
            ['antes da janela', 59],
            ['no instante de fim', 120],
            ['depois da janela', 500],
            ['decimal', 60.5],
            ['NaN', Number.NaN],
        ])('rejeita iniciar %s, sem alterar nada', (_descricao, minuto) => {
            const a = confirmado();
            const tamanhoAntes = a.historico().length;

            expect(() => a.iniciar(minuto)).toThrow(RangeError);
            expect(a.estado()).toBe(Estado.CONFIRMADO);
            expect(a.historico()).toHaveLength(tamanhoAntes);
        });

        it.each([
            ['SOLICITADO', solicitado],
            ['EM_EXECUCAO', emExecucao],
            ['CONCLUIDO', concluido],
        ])('rejeita iniciar quando está %s', (_estado, criar) => {
            const a = criar();
            const estadoAntes = a.estado();

            expect(() => a.iniciar(90)).toThrow();
            expect(a.estado()).toBe(estadoAntes);
        });
    });

    describe('concluir e finalizar (R15)', () => {
        it('EM_EXECUCAO vira CONCLUIDO, mantem a ocupacao historica e registra', () => {
            const a = concluido();

            expect(a.estado()).toBe(Estado.CONCLUIDO);
            expect(a.ocupaRecursos()).toBe(true);
            const historico = a.historico();
            expect(historico[historico.length - 1]?.estado()).toBe(Estado.CONCLUIDO);
            expect(historico[historico.length - 1]?.operacao()).toBe('concluir');
        });

        it.each([
            ['SOLICITADO', solicitado],
            ['CONFIRMADO', confirmado],
        ])('rejeita concluir quando está %s', (_estado, criar) => {
            const a = criar();
            const estadoAntes = a.estado();

            expect(() => a.concluir()).toThrow();
            expect(a.estado()).toBe(estadoAntes);
        });

        it('depois de concluido, nenhuma operação é possivel e nada muda', () => {
            const a = concluido();
            const tamanhoAntes = a.historico().length;

            expect(() => a.remarcar(new Intervalo(200, 260))).toThrow();
            expect(() => a.cancelar()).toThrow();
            expect(() => a.iniciar(90)).toThrow();
            expect(() => a.concluir()).toThrow();
            expect(() => a.confirmar()).toThrow();

            expect(a.estado()).toBe(Estado.CONCLUIDO);
            expect(a.janela().inicio()).toBe(60);
            expect(a.historico()).toHaveLength(tamanhoAntes);
        });
    });

    describe('ocupacao por estado (R07)', () => {
        it.each([
            ['SOLICITADO', solicitado, false],
            ['CONFIRMADO', confirmado, true],
            ['EM_EXECUCAO', emExecucao, true],
            ['CONCLUIDO', concluido, true],
        ])('%s ocupa recursos? %s', (_estado, criar, esperado) => {
            expect(criar().ocupaRecursos()).toBe(esperado);
        });
    });

    describe('consultas seguras (R16, T19)', () => {
        it('alterar o histórico devolvido não muda o agendamento', () => {
            const a = confirmado();
            const consulta = a.historico() as RegistroTransicao[];

            consulta.push(new RegistroTransicao(99, Estado.CANCELADO, 'forjado'));
            consulta.length = 0;

            expect(a.historico()).toHaveLength(2);
            expect(a.estado()).toBe(Estado.CONFIRMADO);
        });

        it('devolve o historico em ordem sequencial', () => {
            const a = emExecucao();
            const sequencias = a.historico().map((r) => r.sequencia());
            expect(sequencias).toEqual([1, 2, 3]);
        });
    });
});