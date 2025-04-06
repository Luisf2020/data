import React from 'react';
import { Modal } from '@mui/material';
import type { SvgIconProps } from '@mui/material';
import {
  AccessTimeOutlined,
  MemoryOutlined,
  StarOutlined,
  GroupOutlined,
  CalendarTodayOutlined,
  CheckCircleOutlined,
  ErrorOutlined,
  PlayCircleOutlined,
  BuildOutlined,
  UpdateOutlined,
  PublicOutlined,
  WarningOutlined,
  InfoOutlined,
  CodeOutlined,
  PersonOutlined,
  SettingsOutlined,
  LaunchOutlined
} from '@mui/icons-material';

// Hacemos todos los campos opcionales recursivamente
type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

interface PricingInfo {
  pricingModel: string;
  pricePerUnitUsd: number;
  trialMinutes: number;
  createdAt: string;
  startedAt: string;
  apifyMarginPercentage: number;
  notifiedAboutFutureChangeAt?: string;
  notifiedAboutChangeAt?: string;
}

interface Stats {
  totalBuilds: number;
  totalRuns: number;
  totalUsers: number;
  totalUsers7Days: number;
  totalUsers30Days: number;
  totalUsers90Days: number;
  lastRunStartedAt: string;
  publicActorRunStats30Days?: Record<string, number>;
}

interface TaggedBuild {
  buildId: string;
  buildNumber: string;
  finishedAt: string;
}

interface ApifyData {
  id: string;
  userId: string;
  name: string;
  username: string;
  title: string;
  description: string;
  pictureUrl?: string;
  seoTitle: string | null;
  seoDescription: string | null;
  stats: Stats;
  defaultRunOptions: {
    build: string;
    timeoutSecs: number;
    memoryMbytes: number;
  };
  exampleRunInput?: {
    body: string;
    contentType: string;
  };
  categories?: string[];
  isPublic?: boolean;
  isDeprecated?: boolean;
  isCritical?: boolean;
  isGeneric?: boolean;
  createdAt: string;
  modifiedAt: string;
  pricingInfos?: PricingInfo[];
  notice?: string;
  deploymentKey?: string;
  taggedBuilds?: {
    latest: TaggedBuild;
  };
}

interface MetricCardProps {
  icon: React.ComponentType<SvgIconProps>;
  label: string;
  value?: string | number | null;
  className?: string;
}

interface SectionProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  show?: boolean;
}

interface ModalProps {
  open: boolean;
  onClose: () => void;
  toolDetails?: {
    data?: DeepPartial<ApifyData>;
  };
}

const MetricCard: React.FC<MetricCardProps> = ({
  icon: Icon,
  label,
  value = 'N/A',
  className = ""
}) => (
  <div className={`p-4 bg-neutral-800/80 rounded-lg hover:bg-neutral-800 transition-colors ${className}`}>
    <div className="flex items-center gap-2 mb-2">
      <Icon className="w-4 h-4 text-neutral-400" />
      <span className="text-sm text-neutral-400">{label}</span>
    </div>
    <div className="text-lg font-medium text-white truncate">
      {value?.toString() ?? 'N/A'}
    </div>
  </div>
);

const Section: React.FC<SectionProps> = ({ title, children, className = "", show = true }) => {
  if (!show) return null;

  return (
    <div className={`mb-8 ${className}`}>
      <h3 className="text-lg font-medium mb-4 text-white flex items-center gap-2">
        {title}
      </h3>
      {children}
    </div>
  );
};

const SafeValue: React.FC<{ value: any, fallback?: string }> = ({ value, fallback = 'N/A' }) => (
  <>{value ?? fallback}</>
);

export const ModalDetailToolApify: React.FC<ModalProps> = ({
  open,
  onClose,
  toolDetails
}) => {
  const data = toolDetails?.data;
  if (!data) return null;

  const getDocUrl = () => {
    if (data.username && data.name) {
      return `https://apify.com/${data.username}/${data.name}/input-schema`;
    }
    return null;
  };

  const formatDate = (date?: string): string => {
    if (!date) return 'N/A';
    try {
      return new Date(date).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Invalid Date';
    }
  };

  const formatNumber = (num?: number): string => {
    if (num === undefined || num === null) return 'N/A';
    try {
      return num.toLocaleString();
    } catch {
      return 'Invalid Number';
    }
  };

  const formatBoolean = (value?: boolean): string => {
    if (value === undefined) return 'N/A';
    return value ? 'Yes' : 'No';
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="tool-details"
    >
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
                     w-[95%] max-w-5xl max-h-[90vh] overflow-y-auto
                     bg-neutral-900 rounded-xl p-6 text-white
                     shadow-2xl border border-neutral-800">
        {/* Header Mejorado */}
        <div className="flex gap-6 mb-8">
          {/* Contenedor de imagen con aspect ratio fijo */}
          <div className="relative flex-shrink-0 w-24 h-24 rounded-xl overflow-hidden bg-neutral-800">
            <img
              src={data.pictureUrl || '/placeholder.png'}
              alt={data.title || 'Tool'}
              className="w-full h-full object-contain"
              style={{ backgroundColor: 'rgb(38, 38, 38)' }}
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold mb-1 truncate">
                  <SafeValue value={data.title} />
                </h2>
                <p className="text-neutral-400 mb-2">
                  by <SafeValue value={data.username} />
                </p>
              </div>

              {getDocUrl() && (
                <a
                  href={getDocUrl()!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 
                           rounded-lg text-sm text-white transition-colors flex-shrink-0"
                >
                  <LaunchOutlined className="w-4 h-4" />
                  Documentation
                </a>
              )}
            </div>

            {data.categories && data.categories.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {data.categories.map(category => (
                  <span key={category}
                    className="px-2 py-1 text-xs bg-neutral-800/80 rounded-full text-neutral-400
                                 hover:bg-neutral-700 transition-colors">
                    {category}
                  </span>
                ))}
              </div>
            )}
            <p className="text-sm text-neutral-500">ID: <SafeValue value={data.id} /></p>
          </div>
        </div>


        {/* Description */}
        <Section title="Description" show={!!data.description}>
          <div className="bg-neutral-800/50 rounded-lg p-4 hover:bg-neutral-800/80 transition-colors">
            <p className="text-neutral-300">{data.description}</p>
            {data.seoTitle && (
              <p className="text-neutral-400 mt-2">SEO Title: {data.seoTitle}</p>
            )}
            {data.seoDescription && (
              <p className="text-neutral-400 mt-2">SEO Description: {data.seoDescription}</p>
            )}
          </div>
        </Section>

        {/* Pricing History */}
        <Section title="Pricing History" show={!!data.pricingInfos?.length}>
          <div className="grid gap-4">
            {data.pricingInfos?.map((pricing, index) => (
              <div key={index} className="bg-neutral-800/50 p-4 rounded-lg hover:bg-neutral-800/80 transition-colors">
                <div className="text-xl font-bold mb-2">
                  ${pricing.pricePerUnitUsd}/month
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="text-neutral-400">
                    Trial Period: {Math.floor((pricing.trialMinutes || 0) / 1440)} days
                  </div>
                  <div className="text-neutral-400">
                    Model: <SafeValue value={pricing.pricingModel} />
                  </div>
                  <div className="text-neutral-400">
                    Created: {formatDate(pricing.createdAt)}
                  </div>
                  <div className="text-neutral-400">
                    Started: {formatDate(pricing.startedAt)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Stats Grid with null checks */}
        {data.stats && (
          <>
            <Section title="Usage Statistics">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <MetricCard
                  icon={GroupOutlined}
                  label="Total Users"
                  value={formatNumber(data.stats.totalUsers)}
                />
                <MetricCard
                  icon={GroupOutlined}
                  label="Users (7 days)"
                  value={formatNumber(data.stats.totalUsers7Days)}
                />
                <MetricCard
                  icon={GroupOutlined}
                  label="Users (30 days)"
                  value={formatNumber(data.stats.totalUsers30Days)}
                />
                <MetricCard
                  icon={GroupOutlined}
                  label="Users (90 days)"
                  value={formatNumber(data.stats.totalUsers90Days)}
                />
                <MetricCard
                  icon={PlayCircleOutlined}
                  label="Total Runs"
                  value={formatNumber(data.stats.totalRuns)}
                />
                <MetricCard
                  icon={BuildOutlined}
                  label="Total Builds"
                  value={formatNumber(data.stats.totalBuilds)}
                />
              </div>
            </Section>

            {/* Run Stats with null check */}
            {data.stats.publicActorRunStats30Days && (
              <Section title="30 Day Run Statistics">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {Object.entries(data.stats.publicActorRunStats30Days).map(([key, value]) => (
                    <div key={key} className="bg-neutral-800/50 p-4 rounded-lg hover:bg-neutral-800/80 transition-colors">
                      <div className="text-sm text-neutral-400 mb-1">{key}</div>
                      <div className="text-lg font-medium">{formatNumber(value)}</div>
                    </div>
                  ))}
                </div>
              </Section>
            )}
          </>
        )}

        {/* Technical Details with null checks */}
        {data.defaultRunOptions && (
          <Section title="Technical Configuration">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <MetricCard
                icon={MemoryOutlined}
                label="Memory"
                value={`${data.defaultRunOptions.memoryMbytes || 0}MB`}
              />
              <MetricCard
                icon={AccessTimeOutlined}
                label="Timeout"
                value={`${data.defaultRunOptions.timeoutSecs || 0}s`}
              />
              <MetricCard
                icon={BuildOutlined}
                label="Build"
                value={data.defaultRunOptions.build}
              />
            </div>
          </Section>
        )}

        {/* Status Section */}
        <Section title="Status" className="border-t border-neutral-800 pt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard
              icon={PublicOutlined}
              label="Public"
              value={formatBoolean(data.isPublic)}
            />
            <MetricCard
              icon={WarningOutlined}
              label="Deprecated"
              value={formatBoolean(data.isDeprecated)}
            />
            <MetricCard
              icon={ErrorOutlined}
              label="Critical"
              value={formatBoolean(data.isCritical)}
            />
            <MetricCard
              icon={SettingsOutlined}
              label="Generic"
              value={formatBoolean(data.isGeneric)}
            />
          </div>
        </Section>
      </div>
    </Modal >
  );
};

export default ModalDetailToolApify;