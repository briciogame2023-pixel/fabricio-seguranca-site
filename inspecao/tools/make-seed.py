#!/usr/bin/env python3
"""SOMENTE TESTE LOCAL: gera seed.json com dados SINTÉTICOS (nomes 'Teste') para conferir o layout do dashboard.
Nunca é publicado nem entra no app. Usa as áreas reais do cadastro só para os rótulos."""
import json, re, random, datetime, pathlib
R = pathlib.Path(__file__).resolve().parent.parent
src = (R/'original/inspecoes-ssma.original.html').read_text(encoding='utf8')
areas = [a['nome'] for a in json.loads(re.search(r'const LISTAS = (\{.*?\});\n', src, re.S).group(1))['areas']][:8]
random.seed(7)
tipos = {'area':('Inspeção de Área/Setor','SSMA'),'checklist':('Inspeção de Checklist','SSMA'),'quimicos':('Inspeção de Químicos','SSMA'),'nr11':('Inspeção de NR 11','SSMA'),'auditoria':('Auditoria Cruzada','Auditoria Cruzada')}
cats = ['Condições gerais','Ordem e limpeza','Sinalização','Proteção de máquinas','Equipamentos de emergência']
riscos = ['Elétrico','Queda de pessoa','Máquinas/veículos','Organização/limpeza','Químico','Ergonômico','Corte']
pessoas = [f'Pessoa Teste {i}' for i in range(1,7)]
hoje = datetime.date(2026,11,10)
insp, acoes = {}, {}
base = {a: random.choice([.97,.93,.9,.85,.8,.74]) for a in areas}
n = 0
for d in range(0, 190, 3):
    dia = hoje - datetime.timedelta(days=d)
    for _ in range(random.choice([1,1,2])):
        n += 1; t = random.choice(list(tipos)); a = random.choice(areas); id_ = f'T{n:03d}'
        ap = random.randint(24,40); nc = sum(random.random() > base[a] for _ in range(ap)); na = random.randint(0,3)
        ncs = []
        for k in range(nc):
            aid = f'a-{id_}-{k}'; prazo = dia + datetime.timedelta(days=random.choice([7,15,30]))
            r = random.random(); concl = r < .5
            st = 'Concluída' if concl else random.choice(['Aberta','Em andamento'])
            resp = random.choice(pessoas); crit = (dia.isoformat()+'T10:00:00Z')
            upd = (dia + datetime.timedelta(days=random.randint(1,25))); upd = min(upd, hoje)
            ac = {'autorId':'u1','inspecaoId':id_,'tipoNome':tipos[t][0],'grupo':tipos[t][1],'area':a,'setor':'Setor Teste','local':'','data':dia.isoformat(),
                  'item':f'{random.randint(1,5)}.{k+1}','pergunta':'Item do roteiro (teste)','descricao':f'Irregularidade de teste {id_}-{k+1}','risco':random.choice(riscos),
                  'acao':f'Ação corretiva de teste {id_}-{k+1}','responsavel':resp,'prazo':prazo.isoformat(),'status':st,'criadoEm':crit,'atualizadoEm':upd.isoformat()+'T14:30:00Z','reprogramacoes':[],
                  'historico':[{'em':crit,'por':'u1','evento':'Ação criada'}] + ([{'em':upd.isoformat()+'T14:30:00Z','por':'u1','evento':'Ação concluída' if concl else 'Prazo reprogramado'}] if upd>dia else [])}
            if concl: ac['conclusao'] = {'data': min(upd, prazo + datetime.timedelta(days=random.choice([-3,0,0,6]))).isoformat()}
            acoes[aid] = ac
            ncs.append({'item':ac['item'],'pergunta':ac['pergunta'],'cat':f'{random.randint(1,5)}. '+random.choice(cats),'descricao':ac['descricao'],'risco':ac['risco'],'fotoId':'','acaoId':aid})
        insp[id_] = {'id':id_,'autorId':'u1','tipo':t,'tipoNome':tipos[t][0],'grupo':tipos[t][1],'area':a,'setor':'Setor Teste','local':'','inspetor':random.choice(pessoas),
                     'responsavel_area':random.choice(pessoas),'data':dia.isoformat(),'turno':'1º','respostas':[],'ncs':ncs,
                     'totais':{'avaliados':ap+na,'aplicaveis':ap,'conformes':ap-nc,'nc':nc,'na':na,'pct':round((ap-nc)/ap*100,1)},'criadoEm':dia.isoformat()+'T09:00:00Z'}
(R/'tools/seed.json').write_text(json.dumps({'inspecoes':insp,'acoes':acoes}, ensure_ascii=False))
print(len(insp),'inspeções,',len(acoes),'ações (sintéticas)')
