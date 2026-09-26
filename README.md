# Super Arcade — Aventura em Equipe

Arcade cooperativo 2D para navegador com 3 minijogos independentes:

- **Caça ao Tesouro** (exploração top-down com chaves, armadilhas e baú).
- **Corrida Maluca** (plataforma cooperativa com obstáculos e itens).
- **Memória em Equipe** (cartas com pares e tentativas compartilhadas).

## Requisitos

- Navegador moderno com suporte a ES Modules e Canvas 2D (Chrome, Edge, Firefox).
- PC ou notebook com teclado.

## Como executar localmente

1. Abra um terminal na pasta do projeto:
   - `/home/runner/work/super-arcade/super-arcade`
2. Inicie um servidor HTTP simples:

```bash
python3 -m http.server 8080
```

3. Abra no navegador:
   - `http://localhost:8080`

> Não há backend, banco de dados, autenticação ou dependências externas.

## Como jogar

1. Escolha de **2 a 4 jogadores** na tela inicial.
2. Consulte os controles e abra o menu de minijogos.
3. Antes de cada minijogo, leia as instruções e inicie o desafio.
4. Conclua em equipe para ganhar estrelas compartilhadas.
5. Após cada conclusão, use **Repetir minijogo** ou **Voltar ao menu**.

### Controles por jogador

- **Jogador 1**: mover `WASD`, ação `E`
- **Jogador 2**: mover `Setas`, ação `Enter`
- **Jogador 3**: mover `IJKL`, ação `O`
- **Jogador 4**: mover `TFGH`, ação `Y`

## Estrutura do projeto

- `index.html`: estrutura principal da aplicação.
- `styles.css`: layout responsivo, estilo cartoon e componentes de UI.
- `src/main.js`: fluxo de telas, menu central, progresso da sessão e integração dos minijogos.
- `src/core/`: módulos reutilizáveis de estado, áudio, entrada e utilitários.
- `src/games/`: minijogos independentes.

## Progressão e pontuação

- Pontuação de estrelas é **coletiva** e persiste durante a sessão ativa.
- Cada minijogo possui dificuldade progressiva conforme conclusões.
- Sem ranking individual: foco total em colaboração.

## Limitações atuais

- Os efeitos sonoros são sintéticos (WebAudio) e simples.
- O progresso é mantido apenas em memória durante a sessão do navegador (sem salvamento).
- O balanceamento de duração pode variar conforme experiência dos jogadores.
