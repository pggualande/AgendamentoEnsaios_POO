import { AgendaLaboratorio } from './agendaLaboratorio';
import { Equipamento } from './equipamento';
import { Tecnico } from './tecnico';
import { Intervalo } from './intervalo';
import { PoliticaEletrica } from './politicaEletrica';
import { PoliticaMecanica } from './politicaMecanica';

async function main() {
    const agenda = new AgendaLaboratorio(
        { verificarCalibracao: async () => true },
        { verificarAcesso: async () => true },
        [new PoliticaEletrica(), new PoliticaMecanica()],
    );
    const osciloscopio = new Equipamento('EQ-10', 'Osciloscópio', ['ELETRICO']);
    const tecnica = new Tecnico('TC-04', 'Técnica Responsável', ['ELETRICO']);

    agenda.solicitar('AG-01', osciloscopio, tecnica, 'ELETRICO', new Intervalo(60, 120));


    try {
        await agenda.confirmar('AG-01');
        console.log('Agendamento confirmado com sucesso!');
    } catch (erro) {
        console.error('Falha ao confirmar:', erro);
    }

    console.log('Estado:', agenda.consultarEstado('AG-01'));
}

main().catch(console.error);