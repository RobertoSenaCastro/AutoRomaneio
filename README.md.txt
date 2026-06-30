# AutoRomaneio

AutoRomaneio é uma aplicação web desenvolvida para automatizar o processamento de planilhas Excel geradas pelo Promob. O sistema permite padronizar os arquivos, agrupar peças, identificar processos de fabricação e gerar automaticamente planilhas separadas para cada setor da fábrica.

O objetivo é eliminar tarefas repetitivas realizadas manualmente e reduzir erros durante a preparação dos romaneios.

---

# Funcionalidades

## Leitura de planilhas

- Importação simultânea de uma ou mais planilhas `.xls` ou `.xlsx`
- Todas as configurações são aplicadas automaticamente a todos os arquivos carregados

---

## Remoção de colunas

Permite remover qualquer coluna desnecessária antes da geração das planilhas finais.

---

## Agrupamento

Agrupa automaticamente as peças por:

- Ambiente
- Código Material

O programa adiciona automaticamente títulos para facilitar a leitura:

```
AMBIENTE: COZINHA

CÓDIGO MATERIAL: 101 - Carvalho Hanover
```

Quando apenas o código muda, somente um novo título de código é criado.

---

## Identificação automática dos processos

O sistema cria automaticamente a coluna **PROCESSO**.

Os processos são identificados através de regras configuráveis.

### Colagem

É adicionada quando houver:

- valores configurados nas colunas de borda
- palavras configuradas na descrição da peça

Configuração:

```javascript
GLUE_EDGE_VALUES
GLUE_DESCRIPTION_VALUES
```

---

### Usinagem

É adicionada quando:

- existir USI na descrição
- ou códigos específicos nas colunas de borda

Configuração:

```javascript
MACHINING_DESCRIPTION_VALUES

MACHINING_EDGE_VALUES
```

---

### Seccionada

É adicionada quando a descrição possuir palavras configuradas.

Configuração:

```javascript
SECTIONING_DESCRIPTION_VALUES
```

---

### Coladeira 45°

Peças específicas podem ser direcionadas automaticamente para a Coladeira 45°.

Configuração:

```javascript
EDGEBANDER45_DESCRIPTION_VALUES
```

---

# Planilhas geradas

Para cada arquivo importado o programa gera automaticamente:

## Planilha Principal

Contém todas as peças organizadas.

---

## Colagem

Contém apenas peças cujo PROCESSO possui COLAR.

Nesta planilha são removidos todos os demais processos.

Exemplo:

```
COLAR
```

---

## Usinagem

Contém apenas peças com processo USINAGEM.

Caso existam outros processos, apenas USINAGEM é mantido.

---

## Seccionada

Contém apenas peças SECCIONADA.

---

## Puxadores

Contém peças cuja descrição possui "PUX".

Mantém a estrutura de agrupamento por:

- Ambiente
- Código Material

---

## Coladeira_45

Contém apenas peças destinadas à Coladeira 45°.

---

# Catálogo de materiais

O sistema utiliza um catálogo em JSON para substituir códigos por nomes.

Arquivo:

```
data/materials.json
```

A busca considera apenas os **3 primeiros dígitos** do Código Material.

Exemplo:

```
101001
↓

101
↓

Carvalho Hanover
```

---

# Estrutura do projeto

```
AutoRomaneio/

│
├── data/
│   └── materials.json
│
├── js/
│   ├── services/
│   │
│   ├── spreadsheet/
│   │   ├── grouping.js
│   │   ├── numbering.js
│   │   ├── processRules.js
│   │   └── processSheets.js
│   │
│   ├── ui/
│   │
│   ├── state/
│   │
│   └── main.js
│
├── style.css
├── index.html
└── config.js
```

---

# Configuração

Todas as regras de negócio ficam centralizadas no arquivo:

```
config.js
```

Exemplo:

```javascript
export const GLUE_EDGE_VALUES = [
    'COLAR'
];

export const MACHINING_EDGE_VALUES = [
    '4023',
    '4030',
    'RM416',
    'RM_416'
];

export const MACHINING_DESCRIPTION_VALUES = [
    'USI'
];

export const SECTIONING_DESCRIPTION_VALUES = [
    'SEC'
];

export const EDGEBANDER45_DESCRIPTION_VALUES = [
    'PUXADOR_45'
];
```

Novas regras podem ser adicionadas apenas alterando esse arquivo.

---

# Versionamento

O sistema possui uma versão visível na interface.

```
AutoRomaneio v1.4.1
```

A versão é definida em:

```javascript
export const APP_VERSION = '1.4.1';
```

---

# Como executar

Necessário possuir Python instalado.

Na pasta do projeto execute:

```bash
python -m http.server 8000
```

Acesse:

```
http://localhost:8000
```

Para disponibilizar na rede local:

```bash
python -m http.server 8000 --bind 0.0.0.0
```

Os demais computadores poderão acessar através do endereço:

```
http://IP_DO_SERVIDOR:8000
```

Exemplo:

```
http://192.168.86.77:8000
```

---

# Tecnologias utilizadas

- HTML
- CSS
- JavaScript (ES Modules)
- SheetJS (xlsx)
- JSZip
- Python HTTP Server

---

# Objetivo

O AutoRomaneio foi desenvolvido para automatizar o fluxo de preparação de romaneios da fábrica, reduzindo trabalho manual, padronizando a geração das planilhas e centralizando as regras de negócio em um único arquivo de configuração.