import { AgendaLaboratorio } from './agendaLaboratorio';
import { Equipamento } from './equipamento';
import { Tecnico } from './tecnico';

async function main() {
    const agenda = new AgendaLaboratorio();

    const osciloscopio = new Equipamento('EQ-10', 'Osciloscópio', ['ELETRICO']);
    const tecnica = new Tecnico('TC-04', 'Técnica Responsável', ['ELETRICO']);

    const solicitacao = agenda.solicitar('AG-01', osciloscopio, tecnica, 'ELETRICO', 60, 120);
    console.log('Agendamento criado:', solicitacao);

    try {
        await agenda.confirmar(solicitacao);
        console.log('Agendamento confirmado com sucesso!');
    } catch (erro) {
        console.error('Falha ao confirmar:', erro);
    }

    console.log('Resumo CSV:\n', agenda.gerarResumoCSV());
}

main().catch(console.error);