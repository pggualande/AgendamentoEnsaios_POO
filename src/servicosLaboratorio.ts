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