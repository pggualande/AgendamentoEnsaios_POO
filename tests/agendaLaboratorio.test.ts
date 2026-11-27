import { describe, it, expect, vi } from 'vitest';
import { AgendaLaboratorio } from '../src/agendaLaboratorio';
import { Equipamento } from '../src/equipamento';
import { Estado } from '../src/estado';
import { Intervalo } from '../src/intervalo';
import { Modalidade } from '../src/modalidade';
import type { PoliticaDuracao } from '../src/politicaDuracao';
import { PoliticaEletrica } from '../src/politicaEletrica';
import { PoliticaMecanica } from '../src/politicaMecanica';
import { Tecnico } from '../src/tecnico';
import type { VerificadorAcesso } from '../src/verificadorAcesso';
import type { VerificadorCalibracao } from '../src/verificadorCalibracao';
import { RegistroTransicao } from '../src/registroTransicao';


const equipamento = () => new Equipamento('EQ-10', 'Osciloscopio', [Modalidade.ELETRICO]);
const tecnico = () => new Tecnico('TC-04', 'Lia', [Modalidade.ELETRICO]);
const equipamentoTotal = () => new Equipamento('EQ-11', 'Bancada', [Modalidade.ELETRICO, Modalidade.MECANICO]);
const tecnicoTotal = () => new Tecnico('TC-05', 'Davi', [Modalidade.ELETRICO, Modalidade.MECANICO]);

function criarAgenda(politicas: PoliticaDuracao[] = [new PoliticaEletrica(), new PoliticaMecanica()]) {
    const calibracao = { verificarCalibracao: vi.fn().mockResolvedValue(true) };
    const acesso = { verificarAcesso: vi.fn().mockResolvedValue(true) };
    const agenda = new AgendaLaboratorio(calibracao, acesso, politicas);
    return { agenda, calibracao, acesso };
}

// prova que a agenda nao ficou quebrada depois de uma rejeicao
function agendaContinuaFuncionando(agenda: AgendaLaboratorio): void {
    agenda.solicitar('A-9', equipamento(), tecnico(), Modalidade.ELETRICO, new Intervalo(60, 120));
    expect(agenda.consultarEstado('A-9')).toBe(Estado.SOLICITADO);
}

describe('AgendaLaboratorio', () => {
    describe('construcao (R18)', () => {
        const calibracao: VerificadorCalibracao = { verificarCalibracao: vi.fn().mockResolvedValue(true) };
        const acesso: VerificadorAcesso = { verificarAcesso: vi.fn().mockResolvedValue(true) };
        const politicas = [new PoliticaEletrica()];

        it('rejeita verificador de calibracao ausente', () => {
            expect(() => new AgendaLaboratorio(null as unknown as VerificadorCalibracao, acesso, politicas)).toThrow(RangeError);
        });

        it('rejeita verificador de acesso ausente', () => {
            expect(() => new AgendaLaboratorio(calibracao, null as unknown as VerificadorAcesso, politicas)).toThrow(RangeError);
        });

        it('rejeita lista de politicas vazia', () => {
            expect(() => new AgendaLaboratorio(calibracao, acesso, [])).toThrow(RangeError);
        });
        describe('consultas seguras (R16, T19)', () => {
            it('impede que alteracoes no array retornado afetem o historico interno da agenda', () => {
                const { agenda } = criarAgenda();
                agenda.solicitar('A-20', equipamento(), tecnico(), Modalidade.ELETRICO, new Intervalo(60, 120));

                // Pega o histórico e "engana" o TypeScript com 'as any' para tentar hackear o array
                const historicoRecebido = agenda.consultarHistorico('A-20') as any;

                // Tenta sujar o array recebido com dados falsos
                historicoRecebido.push(new RegistroTransicao(2, Estado.CONFIRMADO, 'hackear-confirmacao'));
                historicoRecebido[0] = null;

                // Consulta de novo para garantir que a agenda permaneceu blindada e intacta
                const historicoReal = agenda.consultarHistorico('A-20');
                expect(historicoReal).toHaveLength(1);
                expect(historicoReal[0]?.estado()).toBe(Estado.SOLICITADO);
            });
        });
    });

    describe('solicitar: registro inicial (R06, T06)', () => {
        it('registra como SOLICITADO, com a janela pedida e o historico inicial', () => {
            const { agenda } = criarAgenda();
            agenda.solicitar('A-1', equipamento(), tecnico(), Modalidade.ELETRICO, new Intervalo(60, 120));

            expect(agenda.consultarEstado('A-1')).toBe(Estado.SOLICITADO);
            expect(agenda.consultarJanela('A-1').inicio()).toBe(60);
            expect(agenda.consultarJanela('A-1').fim()).toBe(120);

            const historico = agenda.consultarHistorico('A-1');
            expect(historico).toHaveLength(1);
            expect(historico[0]?.sequencia()).toBe(1);
            expect(historico[0]?.estado()).toBe(Estado.SOLICITADO);
        });

        it('nao consulta os servicos externos so por solicitar', () => {
            const { agenda, calibracao, acesso } = criarAgenda();
            agenda.solicitar('A-1', equipamento(), tecnico(), Modalidade.ELETRICO, new Intervalo(60, 120));

            expect(calibracao.verificarCalibracao).not.toHaveBeenCalled();
            expect(acesso.verificarAcesso).not.toHaveBeenCalled();
        });

        it('solicitacao nao bloqueia: duas iguais no mesmo recurso e janela convivem', () => {
            const { agenda } = criarAgenda();
            const eq = equipamento();
            const tc = tecnico();
            agenda.solicitar('A-1', eq, tc, Modalidade.ELETRICO, new Intervalo(60, 120));
            agenda.solicitar('A-2', eq, tc, Modalidade.ELETRICO, new Intervalo(60, 120));

            expect(agenda.consultarEstado('A-1')).toBe(Estado.SOLICITADO);
            expect(agenda.consultarEstado('A-2')).toBe(Estado.SOLICITADO);
        });
    });

    describe('solicitar: codigo unico (R06)', () => {
        it('rejeita codigo duplicado e mantem o primeiro intacto', () => {
            const { agenda } = criarAgenda();
            agenda.solicitar('A-1', equipamento(), tecnico(), Modalidade.ELETRICO, new Intervalo(60, 120));

            expect(() => agenda.solicitar('A-1', equipamento(), tecnico(), Modalidade.ELETRICO, new Intervalo(200, 260))).toThrow();

            expect(agenda.consultarJanela('A-1').inicio()).toBe(60);
            expect(agenda.consultarHistorico('A-1')).toHaveLength(1);
        });

        it.each([
            ['vazio', ''],
            ['so espacos', '   '],
        ])('rejeita codigo %s', (_descricao, codigo) => {
            const { agenda } = criarAgenda();
            expect(() => agenda.solicitar(codigo, equipamento(), tecnico(), Modalidade.ELETRICO, new Intervalo(60, 120))).toThrow(RangeError);
            agendaContinuaFuncionando(agenda);
        });
    });

    describe('solicitar: compatibilidade e dados ausentes (R05, T05)', () => {
        it('rejeita equipamento incompativel sem deixar registro', () => {
            const { agenda } = criarAgenda();
            const soMecanico = new Equipamento('EQ-2', 'Prensa', [Modalidade.MECANICO]);

            expect(() => agenda.solicitar('A-1', soMecanico, tecnico(), Modalidade.ELETRICO, new Intervalo(60, 120))).toThrow(RangeError);
            expect(() => agenda.consultarEstado('A-1')).toThrow(RangeError);
        });

        it('rejeita tecnico nao habilitado sem deixar registro', () => {
            const { agenda } = criarAgenda();
            const soMecanico = new Tecnico('TC-9', 'Davi', [Modalidade.MECANICO]);

            expect(() => agenda.solicitar('A-1', equipamento(), soMecanico, Modalidade.ELETRICO, new Intervalo(60, 120))).toThrow(RangeError);
            expect(() => agenda.consultarEstado('A-1')).toThrow(RangeError);
        });

        it.each([
            ['equipamento', (a: AgendaLaboratorio) => a.solicitar('A-1', null as unknown as Equipamento, tecnico(), Modalidade.ELETRICO, new Intervalo(60, 120))],
            ['tecnico', (a: AgendaLaboratorio) => a.solicitar('A-1', equipamento(), null as unknown as Tecnico, Modalidade.ELETRICO, new Intervalo(60, 120))],
            ['janela', (a: AgendaLaboratorio) => a.solicitar('A-1', equipamento(), tecnico(), Modalidade.ELETRICO, null as unknown as Intervalo)],
        ])('rejeita %s ausente sem deixar registro', (_descricao, tentar) => {
            const { agenda } = criarAgenda();
            expect(() => tentar(agenda)).toThrow(RangeError);
            expect(() => agenda.consultarEstado('A-1')).toThrow(RangeError);
            agendaContinuaFuncionando(agenda);
        });

        it('rejeita modalidade sem politica cadastrada', () => {
            const { agenda } = criarAgenda([new PoliticaEletrica()]);

            expect(() => agenda.solicitar('A-1', equipamentoTotal(), tecnicoTotal(), Modalidade.MECANICO, new Intervalo(60, 120))).toThrow(RangeError);
            expect(() => agenda.consultarEstado('A-1')).toThrow(RangeError);
        });
    });

    describe('solicitar: duracao pela politica (R04, R17)', () => {
        it.each([
            [Modalidade.ELETRICO, 29],
            [Modalidade.ELETRICO, 121],
            [Modalidade.MECANICO, 44],
            [Modalidade.MECANICO, 181],
        ])('rejeita %s com duracao %i, sem deixar registro', (modalidade, duracao) => {
            const { agenda } = criarAgenda();

            expect(() => agenda.solicitar('A-1', equipamentoTotal(), tecnicoTotal(), modalidade, new Intervalo(0, duracao))).toThrow(RangeError);
            expect(() => agenda.consultarEstado('A-1')).toThrow(RangeError);
        });

        it.each([
            [Modalidade.ELETRICO, 30],
            [Modalidade.ELETRICO, 120],
            [Modalidade.MECANICO, 45],
            [Modalidade.MECANICO, 180],
        ])('aceita %s com duracao %i (limites inclusivos)', (modalidade, duracao) => {
            const { agenda } = criarAgenda();

            agenda.solicitar('A-1', equipamentoTotal(), tecnicoTotal(), modalidade, new Intervalo(0, duracao));
            expect(agenda.consultarEstado('A-1')).toBe(Estado.SOLICITADO);
        });
    });

    describe('confirmar: conflito de recursos (R07, R08, T08, T09, T10)', () => {
        async function confirmarNovo(agenda: AgendaLaboratorio, codigo: string,
            eq: Equipamento, tc: Tecnico, inicio: number, fim: number): Promise<void> {
            agenda.solicitar(codigo, eq, tc, Modalidade.ELETRICO, new Intervalo(inicio, fim));
            await agenda.confirmar(codigo);
        }

        it('T08: rejeita o mesmo equipamento em janela sobreposta, mesmo com tecnicos distintos', async () => {
            const { agenda } = criarAgenda();
            const eq = equipamento();
            await confirmarNovo(agenda, 'A-1', eq, tecnico(), 90, 150);

            agenda.solicitar('A-2', eq, tecnico(), Modalidade.ELETRICO, new Intervalo(100, 160));
            await expect(agenda.confirmar('A-2')).rejects.toThrow();

            expect(agenda.consultarEstado('A-2')).toBe(Estado.SOLICITADO);
            expect(agenda.consultarHistorico('A-2')).toHaveLength(1);
            expect(agenda.consultarEstado('A-1')).toBe(Estado.CONFIRMADO);
        });

        it('T09: rejeita o mesmo tecnico em janela sobreposta, mesmo com equipamentos distintos', async () => {
            const { agenda } = criarAgenda();
            const tc = tecnico();
            await confirmarNovo(agenda, 'A-1', equipamento(), tc, 90, 150);

            agenda.solicitar('A-2', equipamento(), tc, Modalidade.ELETRICO, new Intervalo(100, 160));
            await expect(agenda.confirmar('A-2')).rejects.toThrow();

            expect(agenda.consultarEstado('A-2')).toBe(Estado.SOLICITADO);
            expect(agenda.consultarHistorico('A-2')).toHaveLength(1);
        });

        it('T08/T09: equipamentos e tecnicos distintos podem se sobrepor', async () => {
            const { agenda } = criarAgenda();
            await confirmarNovo(agenda, 'A-1', equipamento(), tecnico(), 90, 150);
            await confirmarNovo(agenda, 'A-2', equipamento(), tecnico(), 100, 160);

            expect(agenda.consultarEstado('A-1')).toBe(Estado.CONFIRMADO);
            expect(agenda.consultarEstado('A-2')).toBe(Estado.CONFIRMADO);
        });

        it('T10: janelas adjacentes no mesmo equipamento e no mesmo tecnico convivem', async () => {
            const { agenda } = criarAgenda();
            const eq = equipamento();
            const tc = tecnico();
            await confirmarNovo(agenda, 'A-1', eq, tc, 60, 120);
            await confirmarNovo(agenda, 'A-2', eq, tc, 120, 180);

            expect(agenda.consultarEstado('A-1')).toBe(Estado.CONFIRMADO);
            expect(agenda.consultarEstado('A-2')).toBe(Estado.CONFIRMADO);
        });

        it('identidade: dois objetos com os mesmos dados NAO sao o mesmo recurso', async () => {
            const { agenda } = criarAgenda();
            await confirmarNovo(agenda, 'A-1', equipamento(), tecnico(), 60, 120);
            await confirmarNovo(agenda, 'A-2', equipamento(), tecnico(), 60, 120);

            expect(agenda.consultarEstado('A-2')).toBe(Estado.CONFIRMADO);
        });

        it('solicitado nao bloqueia: so conta quem ja foi confirmado', async () => {
            const { agenda } = criarAgenda();
            const eq = equipamento();
            const tc = tecnico();
            agenda.solicitar('A-1', eq, tc, Modalidade.ELETRICO, new Intervalo(60, 120));
            await confirmarNovo(agenda, 'A-2', eq, tc, 60, 120);

            expect(agenda.consultarEstado('A-2')).toBe(Estado.CONFIRMADO);
        });

        it('cancelado libera: depois de cancelar, outro pode ocupar a mesma janela', async () => {
            const { agenda } = criarAgenda();
            const eq = equipamento();
            const tc = tecnico();
            await confirmarNovo(agenda, 'A-1', eq, tc, 60, 120);
            agenda.cancelar('A-1');

            await confirmarNovo(agenda, 'A-2', eq, tc, 60, 120);
            expect(agenda.consultarEstado('A-2')).toBe(Estado.CONFIRMADO);
        });

        it.each([
            ['EM_EXECUCAO', false],
            ['CONCLUIDO', true],
        ])('%s continua bloqueando a janela', async (_estado, concluir) => {
            const { agenda } = criarAgenda();
            const eq = equipamento();
            const tc = tecnico();
            await confirmarNovo(agenda, 'A-1', eq, tc, 60, 120);
            agenda.iniciar('A-1', 60);
            if (concluir) agenda.concluir('A-1');

            agenda.solicitar('A-2', eq, tc, Modalidade.ELETRICO, new Intervalo(90, 150));
            await expect(agenda.confirmar('A-2')).rejects.toThrow();
            expect(agenda.consultarEstado('A-2')).toBe(Estado.SOLICITADO);
        });
    });

    describe('confirmar: integracao com servicos externos (R09, R10)', () => {
        it('confirma solicitacao com servicos disponiveis (vira CONFIRMADO)', async () => {
            const { agenda, calibracao, acesso } = criarAgenda();
            agenda.solicitar('A-2', equipamento(), tecnico(), Modalidade.ELETRICO, new Intervalo(60, 120));

            await agenda.confirmar('A-2');

            expect(agenda.consultarEstado('A-2')).toBe(Estado.CONFIRMADO);
            // Garante que o verificador foi chamado usando o código do equipamento
            expect(calibracao.verificarCalibracao).toHaveBeenCalledWith('EQ-10');
            // Garante que o verificador foi chamado usando a matrícula do técnico
            expect(acesso.verificarAcesso).toHaveBeenCalledWith('TC-04');
        });

        it('rejeita confirmacao se o equipamento reprovar na calibracao', async () => {
            const { agenda, calibracao } = criarAgenda();
            calibracao.verificarCalibracao.mockResolvedValue(false);

            agenda.solicitar('A-3', equipamento(), tecnico(), Modalidade.ELETRICO, new Intervalo(60, 120));

            await expect(agenda.confirmar('A-3')).rejects.toThrow(Error);

            expect(agenda.consultarEstado('A-3')).toBe(Estado.SOLICITADO);
        });

        it('rejeita confirmacao se o tecnico nao tiver acesso liberado', async () => {
            const { agenda, acesso } = criarAgenda();
            acesso.verificarAcesso.mockResolvedValue(false);

            agenda.solicitar('A-4', equipamento(), tecnico(), Modalidade.ELETRICO, new Intervalo(60, 120));

            await expect(agenda.confirmar('A-4')).rejects.toThrow(Error);

            expect(agenda.consultarEstado('A-4')).toBe(Estado.SOLICITADO);
        });
    });

    describe('transicoes de estado: cancelar, iniciar e concluir (R13, R14, R15)', () => {
        it('cancela um agendamento (SOLICITADO ou CONFIRMADO)', async () => {
            const { agenda } = criarAgenda();

            agenda.solicitar('A-10', equipamento(), tecnico(), Modalidade.ELETRICO, new Intervalo(60, 120));
            agenda.cancelar('A-10');
            expect(agenda.consultarEstado('A-10')).toBe(Estado.CANCELADO);

            agenda.solicitar('A-11', equipamento(), tecnico(), Modalidade.ELETRICO, new Intervalo(120, 180));
            await agenda.confirmar('A-11');
            agenda.cancelar('A-11');
            expect(agenda.consultarEstado('A-11')).toBe(Estado.CANCELADO);
        });

        it('inicia um agendamento CONFIRMADO dentro da janela', async () => {
            const { agenda } = criarAgenda();
            agenda.solicitar('A-12', equipamento(), tecnico(), Modalidade.ELETRICO, new Intervalo(60, 120));
            await agenda.confirmar('A-12');

            agenda.iniciar('A-12', 60);

            expect(agenda.consultarEstado('A-12')).toBe(Estado.EM_EXECUCAO);
        });

        it('conclui um agendamento EM_EXECUCAO', async () => {
            const { agenda } = criarAgenda();
            agenda.solicitar('A-13', equipamento(), tecnico(), Modalidade.ELETRICO, new Intervalo(60, 120));
            await agenda.confirmar('A-13');
            agenda.iniciar('A-13', 75);

            agenda.concluir('A-13');

            expect(agenda.consultarEstado('A-13')).toBe(Estado.CONCLUIDO);
        });
    });

    describe('remarcar (R12, T14, T15)', () => {
        async function confirmadoEm(agenda: AgendaLaboratorio, codigo: string, eq: Equipamento,
            tc: Tecnico, inicio: number, fim: number, modalidade: Modalidade = Modalidade.ELETRICO): Promise<void> {
            agenda.solicitar(codigo, eq, tc, modalidade, new Intervalo(inicio, fim));
            await agenda.confirmar(codigo);
        }

        describe('remarcacao valida (T14)', () => {
            it('troca pela janela exata pedida, mantem CONFIRMADO e registra no historico', async () => {
                const { agenda } = criarAgenda();
                await confirmadoEm(agenda, 'A-1', equipamento(), tecnico(), 60, 120);

                agenda.remarcar('A-1', new Intervalo(200, 260));

                expect(agenda.consultarJanela('A-1').inicio()).toBe(200);
                expect(agenda.consultarJanela('A-1').fim()).toBe(260);
                expect(agenda.consultarEstado('A-1')).toBe(Estado.CONFIRMADO);
                const historico = agenda.consultarHistorico('A-1');
                expect(historico).toHaveLength(3);
                expect(historico[2]?.estado()).toBe(Estado.CONFIRMADO);
                expect(historico[2]?.operacao()).toBe('remarcar');
            });

            it('libera a janela antiga e ocupa a nova, com os mesmos recursos', async () => {
                const { agenda } = criarAgenda();
                const eq = equipamento();
                const tc = tecnico();
                await confirmadoEm(agenda, 'A-1', eq, tc, 60, 120);
                agenda.remarcar('A-1', new Intervalo(200, 260));

                // a janela antiga ficou livre
                await confirmadoEm(agenda, 'A-2', eq, tc, 60, 120);
                expect(agenda.consultarEstado('A-2')).toBe(Estado.CONFIRMADO);

                // a nova esta ocupada pelos mesmos recursos (identidade preservada)
                agenda.solicitar('A-3', eq, tc, Modalidade.ELETRICO, new Intervalo(200, 260));
                await expect(agenda.confirmar('A-3')).rejects.toThrow();
            });

            it('ignora a propria reserva: pode remarcar pra uma janela que sobrepoe a antiga', async () => {
                const { agenda } = criarAgenda();
                await confirmadoEm(agenda, 'A-1', equipamento(), tecnico(), 60, 120);

                agenda.remarcar('A-1', new Intervalo(90, 150));

                expect(agenda.consultarJanela('A-1').inicio()).toBe(90);
                expect(agenda.consultarJanela('A-1').fim()).toBe(150);
            });

            it('aceita remarcar pra uma janela adjacente a de outro agendamento', async () => {
                const { agenda } = criarAgenda();
                const eq = equipamento();
                const tc = tecnico();
                await confirmadoEm(agenda, 'A-1', eq, tc, 60, 120);
                await confirmadoEm(agenda, 'A-2', eq, tc, 200, 260);

                agenda.remarcar('A-2', new Intervalo(120, 180));

                expect(agenda.consultarJanela('A-2').inicio()).toBe(120);
            });
        });

        describe('remarcacao rejeitada preserva tudo (T15)', () => {
            it('conflito no mesmo equipamento: mantem a janela antiga, ainda ocupada', async () => {
                const { agenda } = criarAgenda();
                const eq = equipamento();
                await confirmadoEm(agenda, 'A-1', eq, tecnico(), 60, 120);
                await confirmadoEm(agenda, 'A-2', eq, tecnico(), 200, 260);

                expect(() => agenda.remarcar('A-2', new Intervalo(100, 160))).toThrow();

                expect(agenda.consultarJanela('A-2').inicio()).toBe(200);
                expect(agenda.consultarJanela('A-2').fim()).toBe(260);
                expect(agenda.consultarEstado('A-2')).toBe(Estado.CONFIRMADO);
                expect(agenda.consultarHistorico('A-2')).toHaveLength(2);

                // a janela antiga continua ocupada
                agenda.solicitar('A-3', eq, tecnico(), Modalidade.ELETRICO, new Intervalo(200, 260));
                await expect(agenda.confirmar('A-3')).rejects.toThrow();
            });

            it('conflito no mesmo tecnico, mesmo com equipamentos distintos', async () => {
                const { agenda } = criarAgenda();
                const tc = tecnico();
                await confirmadoEm(agenda, 'A-1', equipamento(), tc, 60, 120);
                await confirmadoEm(agenda, 'A-2', equipamento(), tc, 200, 260);

                expect(() => agenda.remarcar('A-2', new Intervalo(100, 160))).toThrow();

                expect(agenda.consultarJanela('A-2').inicio()).toBe(200);
                expect(agenda.consultarHistorico('A-2')).toHaveLength(2);
            });

            it.each([
                [Modalidade.ELETRICO, 29],
                [Modalidade.ELETRICO, 121],
                [Modalidade.MECANICO, 44],
                [Modalidade.MECANICO, 181],
            ])('duracao invalida (%s com %i min): RangeError e janela antiga intacta', async (modalidade, duracao) => {
                const { agenda } = criarAgenda();
                await confirmadoEm(agenda, 'A-1', equipamentoTotal(), tecnicoTotal(), 0, 60, modalidade);

                expect(() => agenda.remarcar('A-1', new Intervalo(200, 200 + duracao))).toThrow(RangeError);

                expect(agenda.consultarJanela('A-1').inicio()).toBe(0);
                expect(agenda.consultarJanela('A-1').fim()).toBe(60);
                expect(agenda.consultarEstado('A-1')).toBe(Estado.CONFIRMADO);
                expect(agenda.consultarHistorico('A-1')).toHaveLength(2);
            });

            it.each([
                ['SOLICITADO', async () => { /* fica SOLICITADO */ }],
                ['EM_EXECUCAO', async (a: AgendaLaboratorio) => { await a.confirmar('A-1'); a.iniciar('A-1', 60); }],
                ['CONCLUIDO', async (a: AgendaLaboratorio) => { await a.confirmar('A-1'); a.iniciar('A-1', 60); a.concluir('A-1'); }],
                ['CANCELADO', async (a: AgendaLaboratorio) => { a.cancelar('A-1'); }],
            ])('so CONFIRMADO remarca: rejeita quando esta %s, sem alterar nada', async (_estado, preparar) => {
                const { agenda } = criarAgenda();
                agenda.solicitar('A-1', equipamento(), tecnico(), Modalidade.ELETRICO, new Intervalo(60, 120));
                await preparar(agenda);
                const estadoAntes = agenda.consultarEstado('A-1');
                const tamanhoAntes = agenda.consultarHistorico('A-1').length;

                expect(() => agenda.remarcar('A-1', new Intervalo(200, 260))).toThrow();

                expect(agenda.consultarEstado('A-1')).toBe(estadoAntes);
                expect(agenda.consultarJanela('A-1').inicio()).toBe(60);
                expect(agenda.consultarHistorico('A-1')).toHaveLength(tamanhoAntes);
            });

            it('rejeita codigo inexistente e janela ausente com RangeError', async () => {
                const { agenda } = criarAgenda();
                expect(() => agenda.remarcar('X-1', new Intervalo(60, 120))).toThrow(RangeError);

                await confirmadoEm(agenda, 'A-1', equipamento(), tecnico(), 60, 120);
                expect(() => agenda.remarcar('A-1', null as unknown as Intervalo)).toThrow(RangeError);
                expect(agenda.consultarJanela('A-1').inicio()).toBe(60);
            });
        });
    });

    describe('consultas de codigo inexistente', () => {
        it.each([
            ['consultarEstado', (a: AgendaLaboratorio) => a.consultarEstado('X-1')],
            ['consultarJanela', (a: AgendaLaboratorio) => a.consultarJanela('X-1')],
            ['consultarHistorico', (a: AgendaLaboratorio) => a.consultarHistorico('X-1')],
        ])('%s lanca RangeError', (_nome, consultar) => {
            const { agenda } = criarAgenda();
            expect(() => consultar(agenda)).toThrow(RangeError);
        });
    });
});