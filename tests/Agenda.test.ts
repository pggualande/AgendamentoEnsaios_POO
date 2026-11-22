import { describe, expect, it } from 'vitest';
import { AgendaLaboratorio } from '../src/agendaLaboratorio';
import { Equipamento } from '../src/equipamento';
import { Intervalo } from '../src/intervalo';
import { Tecnico } from '../src/tecnico';

const equipamento = () => new Equipamento('EQ-1', 'Osciloscópio', ['ELETRICO']);
const tecnico = () => new Tecnico('T-1', 'Lia', ['ELETRICO']);

describe('Comportamentos iniciais', () => {
  it('cria solicitação em estado inicial', () => {
    const a = new AgendaLaboratorio().solicitar('A-1', equipamento(), tecnico(), 'ELETRICO', 60, 120);
    expect(a.estado).toBe('SOLICITADO');
  });

  it('detecta interseção de intervalos, preservando adjacência', () => {
    const x = new Intervalo(60, 120);
    expect(x.sobrepoe(new Intervalo(90, 150))).toBe(true);
    expect(x.sobrepoe(new Intervalo(120, 180))).toBe(false);
  });

  it('confirma solicitação com serviço local disponível', async () => {
    const agenda = new AgendaLaboratorio();
    const a = agenda.solicitar('A-2', equipamento(), tecnico(), 'ELETRICO', 60, 120);
    await agenda.confirmar(a);
    expect(a.estado).toBe('CONFIRMADO');
  });

  it('permite remarcar um agendamento confirmado para a janela solicitada', async () => {
    const agenda = new AgendaLaboratorio();
    const a = agenda.solicitar('A-3', equipamento(), tecnico(), 'ELETRICO', 60, 120);
    await agenda.confirmar(a);
    expect(a.estado).toBe('CONFIRMADO');
    agenda.remarcar(a, 120, 180);
    expect(a.intervalo.inicio).toBe(120);
    expect(a.intervalo.fim).toBe(180);
  });
});