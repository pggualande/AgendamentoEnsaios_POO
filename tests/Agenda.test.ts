import { describe, expect, it, vi } from 'vitest';
import { AgendaLaboratorio } from '../src/agendaLaboratorio';
import { Equipamento } from '../src/equipamento';
import { Intervalo } from '../src/intervalo';
import { PoliticaEletrica } from '../src/politicaEletrica';
import { PoliticaMecanica } from '../src/politicaMecanica';
import { Tecnico } from '../src/tecnico';

const equipamento = () => new Equipamento('EQ-1', 'Osciloscopio', ['ELETRICO']);
const tecnico = () => new Tecnico('T-1', 'Lia', ['ELETRICO']);

const novaAgenda = () => new AgendaLaboratorio(
  { verificarCalibracao: vi.fn().mockResolvedValue(true) },
  { verificarAcesso: vi.fn().mockResolvedValue(true) },
  [new PoliticaEletrica(), new PoliticaMecanica()],
);

describe('Comportamentos iniciais', () => {
  it('cria solicitacao em estado inicial', () => {
    const agenda = novaAgenda();
    agenda.solicitar('A-1', equipamento(), tecnico(), 'ELETRICO', new Intervalo(60, 120));
    expect(agenda.consultarEstado('A-1')).toBe('SOLICITADO');
  });

  it('detecta interseção de intervalos, preservando adjacência', () => {
    const x = new Intervalo(60, 120);
    expect(x.sobrepoe(new Intervalo(90, 150))).toBe(true);
    expect(x.sobrepoe(new Intervalo(120, 180))).toBe(false);
  });


  it('confirma solicitacao com servico disponivel (A-2 vira CONFIRMADO)', async () => {
    const agenda = novaAgenda();
    agenda.solicitar('A-2', equipamento(), tecnico(), 'ELETRICO', new Intervalo(60, 120));

    await agenda.confirmar('A-2');

    expect(agenda.consultarEstado('A-2')).toBe('CONFIRMADO');
  });

  it('permite remarcar um agendamento confirmado pra janela 120-180', async () => {
    const agenda = novaAgenda();
    agenda.solicitar('A-3', equipamento(), tecnico(), 'ELETRICO', new Intervalo(60, 120));
    await agenda.confirmar('A-3');

    agenda.remarcar('A-3', new Intervalo(120, 180));

    expect(agenda.consultarJanela('A-3').inicio()).toBe(120);
    expect(agenda.consultarJanela('A-3').fim()).toBe(180);
  });
});