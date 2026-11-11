# Narração (opcional)

Coloque aqui um arquivo de áudio por cena, com estes nomes:

```
bloco_01.mp3   bloco_02.mp3   ...   bloco_16.mp3
```

- O texto de cada bloco está em `js/scenes.js` (campo `fala`) e em `narracao_voicestudio/bloco_XX.txt` do roteiro.
- Gere os áudios com a mesma voz em todos (por exemplo ElevenLabs ou VoiceStudio) para não misturar vozes.
- A apresentação avança sozinha quando o áudio termina.
- Se um arquivo não existir, aquela cena usa a **voz do navegador (pt-BR)**; se o navegador não tiver voz, ela corre só com as legendas.
