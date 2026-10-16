# Glossário

**🌐 Idioma:** [English](glossary.md) · **Português 🇧🇷**

As palavras que este repositório usa sem parar para explicar. Uma frase cada, e onde ver a coisa
no código. Os termos ficam em inglês porque é assim que aparecem no código e na documentação da
Microsoft.

| Termo | Em uma frase | Onde no código |
|---|---|---|
| **BFF** (Backend For Frontend) | O único servidor com que o navegador fala; ele transmite o trabalho do agente para a página, executa as function tools e mantém toda credencial longe do navegador. | [`backend/`](../backend/README.md) |
| **Harness** | O adaptador que liga um tipo de agente ao app e transforma tudo o que ele faz no mesmo fluxo de eventos. | [`ai/harness/`](../ai/README.md) |
| **Prompt agent** | Um agente definido só por configuração — modelo, instruções, ferramentas — cujo loop o próprio Foundry executa. | [`ai/harness/prompt_agent/`](../ai/harness/prompt_agent/README.md) |
| **Hosted agent** | Um agente que você escreve em código (aqui, um grafo LangGraph), empacota num contêiner, e o Foundry executa por você. | [`ai/harness/langgraph/`](../ai/harness/langgraph/README.md) |
| **Loop do agente** | O ciclo de chamar o modelo, deixá-lo escolher uma ferramenta, rodar a ferramenta e chamar o modelo de novo; neste projeto ele nunca roda no app. | [constituição §8](../.specify/constitution.md) |
| **Responses API (Agents v2)** | A API atual do Foundry para conversar com um agente: você cria uma resposta contra um agente, e ela volta em streaming como eventos. | `ai/harness/prompt_agent/adapter.py` |
| **Conversation id / response id** | `conv_…` identifica a conversa cujo histórico o Foundry guarda; `resp_…` identifica uma resposta dentro dela, e é por ele que os traces são buscados. | `backend/app/routers/chat.py`, `backend/app/traces.py` |
| **Function tool** | Uma ferramenta que o agente pode pedir mas não consegue rodar sozinho: o Foundry para, o BFF executa e devolve o resultado. | [`ai/harness/_shared/tools/`](../ai/harness/_shared/tools/) |
| **Round trip de function call** | Essa troca de parar, executar e responder; se a resposta nunca chega, a execução trava e expira em dez minutos. | [como funciona](how-it-works/function-call-round-trip.md) (em inglês) |
| **MCP** (Model Context Protocol) | Um padrão para um agente usar um servidor de ferramentas remoto; aqui, a busca na documentação do Microsoft Learn, que o Foundry chama diretamente. | `ai/harness/_shared/agent_core.yaml` (`microsoft_learn`) |
| **SSE** (Server-Sent Events) | Uma resposta HTTP comum que fica aberta e envia um evento por vez; é assim que a resposta chega ao navegador enquanto é escrita. | `backend/app/sse.py`, `frontend/src/state/sse.ts` |
| **Contrato AgentEvent** | Os nove tipos de evento que todo harness precisa emitir e os únicos que o BFF e a interface leem — é o que torna o harness trocável. | [`ai/harness/_shared/contract.py`](../ai/harness/_shared/contract.py) |
| **Voice Live** | O serviço de fala em tempo real do Azure, que transforma a fala em texto para o agente e a resposta do agente de volta em fala. | `backend/app/voice_session.py` |
| **WebRTC / SDP** | O padrão do navegador para áudio ao vivo; SDP é a oferta e a resposta em texto que as duas pontas trocam para montar a chamada. | `frontend/src/voice/session.ts`, `backend/app/routers/voice.py` |
| **Entra ID / `DefaultAzureCredential`** | O serviço de identidade da Microsoft, e o objeto do SDK que encontra um login (o seu localmente, uma managed identity no Azure) para que nenhuma chave de API seja necessária. | `backend/app/harness_factory.py` (`AzureClients`) |
| **APIM / AI Gateway** | O Azure API Management posicionado na frente do modelo para registrar, medir e governar a inferência; opcional neste projeto. | [como funciona](how-it-works/tracing-and-gateway.md) (em inglês) |
| **Application Insights / KQL** | O repositório de telemetria do Azure, e a linguagem de consulta usada para ler de volta os spans de uma execução. | `backend/app/traces.py` |
| **Span / trace** | Um span é um passo cronometrado (uma chamada ao modelo, uma chamada de ferramenta); um trace é a árvore de spans de uma execução. | `frontend/src/panes/` (painel de trace) |
| **BYOM** (bring your own model) | Uma conexão do Foundry que manda a inferência do agente para um modelo atrás do seu próprio gateway, em vez do deployment do recurso. | `ai/harness/_shared/agent_core.yaml` (comentário de `model:`) |
| **Spec / SDD** | Spec-Driven Development: toda funcionalidade começa como uma spec escrita com critérios de aceite numerados e testáveis. | [`specs/`](../specs/README.md) |
| **TDD** | Test-Driven Development: primeiro o teste que falha, depois o código que o faz passar. | [fluxo de desenvolvimento](development-workflow.md) (em inglês) |
| **Modo replay / demo** | O app inteiro servido a partir de gravações de execuções reais do Foundry, para rodar sem conta Azure. | `backend/app/demo.py`, `just demo` |
