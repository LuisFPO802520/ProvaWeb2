# Cyberbullet Arena V.1

**Cyberbullet Arena V.1** é um jogo multiplayer cooperativo em tempo real feito com **Node.js**, **WebSocket**, **HTML5 Canvas** e JavaScript puro.

O jogo possui sistema de lobby, partidas cooperativas para até 2 jogadores, movimentação em tempo real, inimigos por ondas, boss final, projéteis, sprites animados, mapa em pixel art e sistema de vidas.

---

## 🎮 Sobre o jogo

O objetivo do jogo é sobreviver às ondas de inimigos em uma arena futurista. Os jogadores devem se movimentar pelo mapa, atacar os monstros e derrotar o boss final.

Cada jogador possui **3 vidas**. Ao morrer, perde uma vida e renasce. Se perder todas as vidas, é eliminado da partida. Se todos os jogadores forem eliminados, a partida termina em derrota.

---

## ✨ Funcionalidades

- Multiplayer em tempo real com WebSocket
- Sistema de lobby com código de sala
- Suporte para até 2 jogadores
- Sistema de host
- Botão de pronto para iniciar partida
- Movimento com teclado
- Mira baseada na direção do movimento
- Sistema de ondas
- Boss final
- Sistema de vidas com 3 vidas por jogador
- Eliminação ao perder todas as vidas
- Tela de vitória e derrota
- Sprites para jogadores e projéteis
- Mapa futurista/cyberpunk em pixel art
- Client prediction
- Server reconciliation
- Interpolação de snapshots
- Spatial partition para otimização
- Estado compacto enviado pelo servidor

---

## 🕹️ Controles

| Tecla | Ação                |
| ----- | ------------------- |
| `W`   | Mover para cima     |
| `A`   | Mover para esquerda |
| `S`   | Mover para baixo    |
| `D`   | Mover para direita  |

Os tiros seguem a direção do movimento.

Exemplos:

- `W` atira para cima
- `D` atira para direita
- `W + D` atira na diagonal para cima/direita
- `S + A` atira na diagonal para baixo/esquerda

---

## 🧠 Tecnologias usadas

- Node.js
- Express
- WebSocket (`ws`)
- JavaScript
- HTML5 Canvas
- CSS
- Pixel Art

---

## 🚀 Como executar o projeto

### 1. Clone o repositório

```bash
git clone https://github.com/seu-usuario/seu-repositorio.git
```

Entre na pasta do projeto:

```bash
cd seu-repositorio
```

---

### 2. Instale as dependências

```bash
npm install
```

---

### 3. Execute o servidor

Com Node:

```bash
npm start
```

Ou com Nodemon:

```bash
npm run dev
```

---

### 4. Abra no navegador

Acesse:

```txt
http://localhost:3000
```

---

## 🧩 Como jogar em multiplayer

1. Abra o jogo no navegador.
2. Clique em **Criar Sala**.
3. Copie o código da sala.
4. Outro jogador deve abrir o jogo e inserir o código.
5. Ambos devem clicar em **Pronto**.
6. O host inicia a partida.

---

## ⚔️ Sistema de combate

O jogo não possui mira automática. O personagem atira na direção em que está andando.

Se o jogador parar de andar, ele continua atirando na última direção usada.

Os projéteis possuem alcance aumentado e são desenhados com sprite.

---

## ❤️ Sistema de vidas

Cada jogador começa com **3 vidas**.

Ao morrer:

- perde 1 vida;
- renasce no centro da arena se ainda tiver vidas;
- é eliminado se perder todas as vidas.

Se todos os jogadores forem eliminados, a partida termina em derrota.

As vidas aparecem acima do personagem como bolinhas.

---

## 🌊 Sistema de ondas

O jogo possui ondas progressivas de inimigos.

Ao derrotar todos os inimigos de uma onda, a próxima começa automaticamente.

Ao derrotar o boss final, os jogadores vencem.

---

## 🌆 Mapa

O jogo utiliza um mapa cyberpunk em pixel art como background.

A área jogável é limitada para impedir que os jogadores andem sobre os prédios. O fundo é maior que a área jogável, permitindo que os prédios fiquem fora da arena e apareçam visualmente nas bordas.

---

## 🌐 Netcode

O projeto utiliza técnicas básicas de jogos multiplayer em tempo real:

- servidor autoritativo;
- client prediction;
- server reconciliation;
- interpolação de snapshots;
- envio de estado compacto;
- spatial partition para otimizar colisões.

O cliente prevê o movimento local para melhorar a fluidez, enquanto o servidor continua sendo responsável pelo estado real da partida.

---

## 📌 Possíveis melhorias futuras

- Tela de seleção de personagem
- Mais tipos de inimigos
- Ataques diferentes para o boss
- Sistema de itens
- Power-ups
- Sons e música
- Ranking de pontuação
- Partidas com mais de 2 jogadores
- Sistema de salas públicas
- Tela de pause
- Animações melhores para inimigos
- Barra de vida individual para jogadores

---

## 👨‍💻 Autor

Projeto desenvolvido por **Luís Felipe Patrício de Oliveira**.

Projeto desenvolvido como Prova da matéria de Desenvolvimento WEB 2 do Curso de Engenharia de Software

---

## 📄 Licença

Este projeto é livre para fins de estudo e aprendizado.
