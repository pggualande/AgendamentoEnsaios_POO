export type Modalidade = 'ELETRICO' | 'MECANICO';
export type Estado = 'SOLICITADO' | 'CONFIRMADO' | 'EM_EXECUCAO' | 'CONCLUIDO' | 'CANCELADO';

export class Equipamento {
  constructor(public codigo: string, public nome: string, public modalidades: Modalidade[]) {}
}

export class Tecnico {
  constructor(public matricula: string, public nome: string, public qualificacoes: Modalidade[]) {}
}

export class Intervalo {
  constructor(public inicio: number, public fim: number) {}
  sobrepoe(outro: Intervalo): boolean {
    return this.inicio < outro.fim && outro.inicio < this.fim;
  }
}

export class RegistroTransicao {
  constructor(public descricao: string, public estado: Estado) {}
}

export class Agendamento {
  public estado: Estado = 'SOLICITADO';
  public eventos: RegistroTransicao[] = [];
  constructor(
    public codigo: string,
    public equipamento: Equipamento,
    public tecnico: Tecnico,
    public modalidade: Modalidade,
    public intervalo: Intervalo,
  ) {}
  remarcar(novo: Intervalo): void { this.intervalo = novo; }
}

export class AgendamentoCampo extends Agendamento {
  override remarcar(novo: Intervalo): void {
    this.intervalo = new Intervalo(novo.inicio, novo.inicio + 30);
  }
}

export interface ServicosLaboratorio {
  verificarCalibracao(codigo: string): Promise<boolean>;
  verificarAcesso(matricula: string): Promise<boolean>;
  exportarRelatorio(codigo: string): Promise<void>;
}

export class ServicoLocal implements ServicosLaboratorio {
  async verificarCalibracao(_codigo: string): Promise<boolean> { return true; }
  async verificarAcesso(_matricula: string): Promise<boolean> { return true; }
  async exportarRelatorio(_codigo: string): Promise<void> { return; }
}


export class ServicoCalibracaoPortatil implements ServicosLaboratorio {
  async verificarCalibracao(_codigo: string): Promise<boolean> { return true; }
  async verificarAcesso(_matricula: string): Promise<boolean> { throw new Error('Operação indisponível'); }
  async exportarRelatorio(_codigo: string): Promise<void> { throw new Error('Operação indisponível'); }
}

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
    const calibrado = await this.servico.verificarCalibracao(a.equipamento.codigo);
    const autorizado = await this.servico.verificarAcesso(a.tecnico.matricula);
    if (!calibrado || !autorizado) throw new Error('Indisponível');
    if (a.modalidade === 'ELETRICO' && (a.intervalo.fim - a.intervalo.inicio < 30 || a.intervalo.fim - a.intervalo.inicio > 120)) {
      throw new Error('Duração');
    }
    if (a.modalidade === 'MECANICO' && (a.intervalo.fim - a.intervalo.inicio < 45 || a.intervalo.fim - a.intervalo.inicio > 180)) {
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
