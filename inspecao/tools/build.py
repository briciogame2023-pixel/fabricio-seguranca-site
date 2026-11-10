#!/usr/bin/env python3
"""Aplica a camada de design 'Sentinela' sobre o app original e gera dist/inspecoes-ssma.html.
O original (inspecao/original/) nunca é modificado: é o ponto de restauração.
uso: python3 build.py"""
import re, pathlib, tarfile, json, sys
R = pathlib.Path(__file__).resolve().parent.parent
raw = (R/'original/inspecoes-ssma.original.html').read_text(encoding='utf8')
# o artefato vem embrulhado num documento-esqueleto: extrai só a página real
i = raw.index('<!doctype html>\n<html lang="pt-BR">')
orig = raw[i:]
orig = orig[:orig.index('</html>', orig.rindex('</script>')) + 7] + '\n'
D = R/'design'

# ---- ícones Lucide (ISC) embutidos: só os que usamos ----
ICONS = ['menu','shield-check','search','bell','settings','chevron-left','chevron-right','chevron-down','layout-dashboard','list-checks','plus',
 'message-square-text','circle-user-round','sun','moon','monitor','log-out','type','panel-left-close','bone','circle','lock','check','circle-check','x',
 'triangle-alert','file-text','paperclip','graduation-cap','calendar','megaphone','alarm-clock','user','ban','file-pen','hourglass','hard-hat','pin',
 'chart-column','message-square','camera','pencil','trash-2','save','link','map-pin','timer','id-card','book-open','calculator','ruler',
 'message-circle','tag','undo-2','trending-down','image','folder','star','zap','square-check']
lucide = pathlib.Path('/tmp/lucide/package/icons')
if not lucide.exists():
    sys.exit('Baixe o pacote: npm pack lucide-static@0.468.0 && tar xzf ... -C /tmp/lucide')
LUC = {}
for n in ICONS:
    f = lucide/f'{n}.svg'
    if not f.exists(): print('ícone ausente:', n); continue
    inner = re.search(r'>\s*(<(?:path|circle|rect|line|polyline|polygon|ellipse).*)</svg>', f.read_text(), re.S).group(1)
    LUC[n] = re.sub(r'\s+', ' ', inner).strip()
ATTR='fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"'
def icon(n): return f'<svg viewBox="0 0 24 24" {ATTR} aria-hidden="true" focusable="false">{LUC[n]}</svg>'

shell = (D/'shell.html').read_text(encoding='utf8')
shell = re.sub(r'\{\{icon:([\w-]+)\}\}', lambda m: icon(m.group(1)), shell)

# 0) correções pontuais de bugs de interface do original (cada uma deve casar exatamente 1 vez)
PATCHES = [
  ('["aet",IC.find,"AET"', '["aet",S(\'<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>\'),"AET"',
   'aba AET da Ergonomia exibia "undefined" (IC.find nunca foi definido)'),
]
for old, new, why in PATCHES:
    assert orig.count(old) == 1, f'remendo não casa 1x: {why}'
    orig = orig.replace(old, new)
out = orig
# 1) fontes: Barlow -> Public Sans / Bricolage Grotesque (só no CSS e no link)
out = out.replace('family=Barlow:wght@400;500;600;700&family=Barlow+Condensed:wght@600;700',
                  'family=Public+Sans:wght@400;500;600;700;800&family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,700;12..96,800')
head, body = out.split('<body>', 1)
head = head.replace('"Barlow Condensed"', '"Bricolage Grotesque"').replace('"Barlow"', '"Public Sans"')
# 2) CSS do Design System depois do CSS original
css = (D/'tokens.css').read_text(encoding='utf8') + '\n' + (D/'componentes.css').read_text(encoding='utf8')
head = head.replace('</head>', '<style id="sentinela">\n'+css+'\n</style>\n</head>')
# 3) shell novo: do <header class="top"> até o fim do <nav class="nav">…</nav>
a = body.index('<header class="top">'); b = body.index('</nav>', a) + len('</nav>')
body = body[:a] + shell + body[b:]
# 4) JS da camada de interface ao final do app
luc_js = '<script>window.__LUC=' + json.dumps(LUC, ensure_ascii=False) + ';</script>\n'
shell_js = '<script>\n' + (D/'shell.js').read_text(encoding='utf8') + '\n</script>\n'
last = body.rindex('</body>')
body = body[:last] + luc_js + shell_js + body[last:]
out = head + '<body>' + body
out = out.replace('<title>Inspeções SSMA</title>', '<title>Inspeções SSMA</title>')
dist = R/'dist'; dist.mkdir(exist_ok=True)
(dist/'inspecoes-ssma.html').write_text(out, encoding='utf8')
print('gerado', dist/'inspecoes-ssma.html', f'{len(out)/1024:.0f} KB')
