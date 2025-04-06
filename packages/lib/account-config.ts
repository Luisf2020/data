import { AgentModelName, SubscriptionPlan } from '@chaindesk/prisma';

type Plan = {
  type: SubscriptionPlan;
  label: string;
  description: string;
  price: {
    usd: {
      monthly: number;
      annually: number;
      symbol: string;
    };
  };
  limits: {
    maxAgents: number;
    maxAgentsQueries: number;
    maxDatastores: number;
    maxDatasources: number;
    maxFileSize: number; // in bytes
    maxDataProcessing: number; // in bytes
    maxStoredTokens: number;

    maxSeats: number;

    // e.g.: Crisp / Slack thread summary
    maxSummary: number;

    maxWebsiteURL: number;
  };
};

const config: {
  [key in SubscriptionPlan]: Plan;
} = {
  [SubscriptionPlan.level_0]: {
    type: SubscriptionPlan.level_0,
    label: 'Free',
    description: 'The essentials to get started quickly.',
    price: {
      usd: {
        monthly: 0,
        annually: 0,
        symbol: '$',
      },
    },
    limits: {
      maxAgents: 1,
      maxAgentsQueries: 100,
      maxDatastores: 1,
      maxDatasources: 10, // per datastore
      maxFileSize: 1000000, // 1 MB
      maxDataProcessing: 5000000, // 5 MB
      maxSummary: 10,
      maxWebsiteURL: 25,
      maxSeats: 1,
      maxStoredTokens: 20000,
    },
  },
  [SubscriptionPlan.level_0_5]: {
    type: SubscriptionPlan.level_0_5,
    label: 'Hobby',
    description: 'A plan that scales with your rapidly growing business.',
    price: {
      usd: {
        monthly: 25,
        annually: 250,
        symbol: '$',
      },
    },
    limits: {
      maxAgents: 2,
      maxAgentsQueries: 2500,
      maxDatastores: 2,
      maxDatasources: 100, // per datastore
      maxFileSize: 5000000, // 5 MB
      maxDataProcessing: 25000000, // 50 MB
      maxSummary: 100,
      maxWebsiteURL: 150,
      maxSeats: 5,
      maxStoredTokens: 15000000,
    },
  },
  [SubscriptionPlan.level_1]: {
    type: SubscriptionPlan.level_1,
    label: 'Plan Emprendimiento',
    description: 'Un plan que escala con tu negocio en rápido crecimiento.',

    price: {
      usd: {
        monthly: 80,
        annually: 800, // Puedes agregar esta opción si lo deseas
        symbol: 'USD',
      },
    },
    limits: {
      maxAgents: 2,
      maxAgentsQueries: 10000, // Consultas totales
      maxDatastores: 2,
      maxDatasources: 100, // Por almacén de datos
      maxFileSize: 25000000, // 25 MB por archivo
      maxDataProcessing: 30000000, // 30 millones de palabras de almacenamiento
      maxSummary: 100,
      maxWebsiteURL: 250, // Páginas de sitios web
      maxSeats: 10, // Asientos para el equipo
      maxStoredTokens: 30000000, // Palabras almacenadas
    },
  },
  [SubscriptionPlan.level_2]: {
    type: SubscriptionPlan.level_2,
    label: 'Plan Pymes',
    description: 'Soporte dedicado para tu empresa.',

    price: {
      usd: {
        monthly: 399,
        annually: 3990, // Puedes agregar esta opción si lo deseas
        symbol: 'USD',
      },
    },
    limits: {
      maxAgents: 5,
      maxAgentsQueries: 100000, // Consultas totales
      maxDatastores: 20,
      maxDatasources: 500, // Por almacén de datos
      maxFileSize: 50000000, // 50 MB por archivo
      maxDataProcessing: 300000000, // 300 millones de palabras de almacenamiento
      maxSummary: 200,
      maxWebsiteURL: 10000, // Páginas de sitios web
      maxSeats: 25, // Asientos para el equipo
      maxStoredTokens: 300000000, // Palabras almacenadas
    },
  },
  [SubscriptionPlan.level_3]: {
    type: SubscriptionPlan.level_3,
    label: 'Plan Pymes Premium',
    description:
      'Tienes una gran cantidad de recursos, pero no es suficiente. Hasta la luna.',

    price: {
      usd: {
        monthly: 789,
        annually: 7890, // Puedes agregar esta opción si lo deseas
        symbol: 'USD',
      },
    },
    limits: {
      maxAgents: 20,
      maxAgentsQueries: 300000, // Consultas totales
      maxDatastores: 100,
      maxDatasources: 1000, // Por almacén de datos
      maxFileSize: 125000000, // 125 MB por archivo
      maxDataProcessing: 600000000, // 600 millones de palabras de almacenamiento
      maxSummary: 500,
      maxWebsiteURL: 10000, // Páginas de sitios web
      maxSeats: 100, // Asientos para el equipo
      maxStoredTokens: 600000000, // Palabras almacenadas
    },
  },

  [SubscriptionPlan.level_4]: {
    type: SubscriptionPlan.level_4,
    label: 'Ultimate',
    description: 'Dedicated support and for your team.',
    price: {
      usd: {
        monthly: 999,
        annually: 9990,
        symbol: '$',
      },
    },
    limits: {
      maxAgents: 200,
      maxAgentsQueries: 200000,
      maxDatastores: 200,
      maxDatasources: 1000,
      maxFileSize: 90000000,
      maxDataProcessing: 500000000,
      maxSummary: 500,
      maxWebsiteURL: 20000,
      maxSeats: 500,
      maxStoredTokens: 600000000,
    },
  },
};

export default config;
