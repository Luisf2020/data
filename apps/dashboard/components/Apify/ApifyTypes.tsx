export interface ToolStats {
  totalBuilds: string | number | boolean
  totalUsers: number
  totalUsers30Days: number
  totalRuns: number
  publicActorRunStats30Days: Record<string, number>
}

export interface ToolDetails {
  pricingInfos: any
  isDeprecated: string | number | boolean
  isPublic: string | number | boolean
  defaultRunOptions: any
  title: string
  username: string
  name: string
  pictureUrl: string
  description: string
  categories: string[]
  stats: ToolStats
  taggedBuilds: Record<string, any>
  modifiedAt: string
}

export interface ModalDetailToolApifyProps {
  open: boolean
  onClose: () => void
  toolDetails?: {
    data: ToolDetails
  }
}


export interface Filters {
  limit: number;
  offset: number;
  search: string;
  sortBy: 'relevance' | 'popularity' | 'newest' | 'lastUpdate';
  category: string;
  username: string;
  pricingModel: 'FREE' | 'FLAT_PRICE_PER_MONTH' | 'PRICE_PER_DATASET_ITEM' | '';
}

export const defaultFilters: Filters = {
  limit: 100,
  offset: 0,
  search: '',
  sortBy: 'relevance',
  category: '',
  username: '',
  pricingModel: ''
};

export interface ApifyStats {
  totalBuilds: number
  totalRuns: number
  totalUsers: number
  totalUsers7Days: number
  totalUsers30Days: number
  totalUsers90Days: number
  lastRunStartedAt: string
  publicActorRunStats30Days: Record<string, number>
}

export interface PricingInfo {
  pricingModel: string
  pricePerUnitUsd: number
  trialMinutes: number
  createdAt: string
  startedAt: string
  apifyMarginPercentage: number
  notifiedAboutFutureChangeAt?: string
  notifiedAboutChangeAt?: string
}

export interface DefaultRunOptions {
  build: string
  timeoutSecs: number
  memoryMbytes: number
}

export interface ExampleRunInput {
  body: string
  contentType: string
}

export interface TaggedBuild {
  buildId: string
  buildNumber: string
  finishedAt: string
}

export interface ApifyTool {
  id: string
  userId: string
  name: string
  username: string
  title: string
  description: string
  pictureUrl: string
  seoTitle: string | null
  seoDescription: string | null

  // Stats y métricas
  stats: ApifyStats
  totalStars?: number

  // Fechas
  createdAt: string
  modifiedAt: string

  // Configuraciones
  restartOnError: boolean
  isPublic: boolean
  isDeprecated: boolean
  isCritical: boolean
  isGeneric: boolean

  // Categorías y versiones
  categories: string[]
  versions: any[]

  // Opciones de ejecución
  defaultRunOptions: DefaultRunOptions
  exampleRunInput: ExampleRunInput

  // Pricing
  pricingInfos: PricingInfo[]

  // Builds y deployment
  taggedBuilds: Record<string, TaggedBuild>
  deploymentKey: string

  // Estado
  notice: string
}