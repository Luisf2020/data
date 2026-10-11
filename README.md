# ChatsApp AI — instancia de datos

![stack: Next.js](https://img.shields.io/badge/stack--Next.js-0d9488?style=flat-square) ![stack: TypeScript](https://img.shields.io/badge/stack--TypeScript-0d9488?style=flat-square) ![stack: pnpm](https://img.shields.io/badge/stack--pnpm-0d9488?style=flat-square) ![stack: Turborepo](https://img.shields.io/badge/stack--Turborepo-0d9488?style=flat-square) ![IA: asistido](https://img.shields.io/badge/IA--asistido-6366f1?style=flat-square)

Instancia de la plataforma orientada a la capa de datos y servicios de apoyo del panel de agentes.

**Tipo:** Plataforma de agentes LLM (Next.js) · **Complejidad:** Avanzado

## Problema que resuelve

Construir agentes LLM personalizados sin programarlos desde cero, definiendolos con plantillas y herramientas.

## Solucion implementada

Monorepo con pnpm y Turborepo: un panel en Next.js, paquetes compartidos y servicios de apoyo, con la infraestructura de desarrollo levantada por docker compose.

### Funcionalidades principales

- Panel en Next.js (dashboard)
- Workspace pnpm con paquetes compartidos y Turborepo
- Plantillas de agentes y herramientas
- Servicios de apoyo con docker compose
- Variables de entorno por archivo (.env.local)

## Stack

- Next.js
- TypeScript
- pnpm
- Turborepo
- Docker

## Estructura

```
apps/         # panel Next.js
packages/     # paquetes compartidos
docker/       # infraestructura local
.env.local    # configuracion (no versionada)
```

## Puesta en marcha

```bash
pnpm install
pnpm docker:up     # servicios de apoyo
pnpm dev
```

## Complejidad del proyecto

**Nivel: Avanzado** — Monorepo con multiples paquetes, panel, servicios externos y configuracion por entorno; requiere credenciales y base de datos para ejecutarse.

El nivel describe la complejidad tecnica del proyecto, no el grado de dominio de quien lo escribio.

## Despliegue

Requiere servicios externos (base de datos, credenciales de proveedores de IA); no se despliega como sitio estatico.  
El codigo fuente esta disponible en este repositorio.

> **Autoría:** este repositorio corresponde a la plataforma de codigo abierto para agentes LLM (licencia **AGPL-3.0**, ver `LICENSE`). Se mantiene como referencia de estudio y despliegue local; no se reclama autoria sobre el codigo base.

## Transparencia sobre IA

Este proyecto se desarrollo con asistencia de inteligencia artificial (generacion de codigo,
revision y documentacion). El codigo fue leido, ejecutado y probado manualmente. No se declaran
clientes, metricas ni resultados que no puedan verificarse.

## Autor

**Luis Felipe Zuniga Leon** — Desarrollador de software asistido por IA

- GitHub: <https://github.com/Luisf2020>
- Correo: developerluis2@gmail.com
- WhatsApp: +504 3237 0056

---

_Proyecto de portafolio. El desarrollo se apoyo en herramientas de IA bajo revision tecnica humana._
